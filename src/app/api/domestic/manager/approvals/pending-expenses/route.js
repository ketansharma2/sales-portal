import { supabaseServer } from '@/lib/supabase-server'
import { NextResponse } from 'next/server'
import { getUser } from '@/lib/auth-helper';

function getDateRangeBounds(rangeKey) {
  const now = new Date()
  const startOfDay = (d) => {
    const x = new Date(d)
    x.setHours(0, 0, 0, 0)
    return x
  }
  const endOfDay = (d) => {
    const x = new Date(d)
    x.setHours(23, 59, 59, 999)
    return x
  }
  const toISODate = (d) => d.toISOString().split('T')[0]

  switch (rangeKey) {
    case 'today': {
      const s = startOfDay(now)
      return { from: toISODate(s), to: toISODate(endOfDay(now)) }
    }
    case 'this_week': {
      const day = now.getDay() // 0 = Sunday
      const diffToMonday = (day === 0 ? -6 : 1) - day
      const monday = new Date(now)
      monday.setDate(now.getDate() + diffToMonday)
      return { from: toISODate(startOfDay(monday)), to: toISODate(endOfDay(now)) }
    }
    case 'this_month': {
      const first = new Date(now.getFullYear(), now.getMonth(), 1)
      return { from: toISODate(first), to: toISODate(endOfDay(now)) }
    }
    case 'last_month': {
      const firstLast = new Date(now.getFullYear(), now.getMonth() - 1, 1)
      const lastLast = new Date(now.getFullYear(), now.getMonth(), 0)
      return { from: toISODate(firstLast), to: toISODate(endOfDay(lastLast)) }
    }
    default:
      return null
  }
}

const STATUS_MAP = {
  pending: 'Pending (Manager)',
  approved: 'Approved',
  rejected: 'Rejected',
  paid: 'PAID',
}

export async function GET(request) {
  try {
    // Authentication
      const { user, error: authError } = getUser(request);
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Query params
    const { searchParams } = new URL(request.url)
    const dateRangeKey = searchParams.get('date_range') // today | this_week | this_month | last_month | custom
    let fromDate = searchParams.get('from_date')
    let toDate = searchParams.get('to_date')
    const statusFilter = searchParams.get('status') // pending | approved (includes Sent to HR) | rejected | paid | all
    const employeeId = searchParams.get('employee_id')
    const category = searchParams.get('category')
    const search = (searchParams.get('search') || '').trim()
    const minAmount = searchParams.get('min_amount')
    const maxAmount = searchParams.get('max_amount')
    const sortBy = searchParams.get('sort_by') || 'created_at' // created_at | amount | date | name | status
    const sortDir = (searchParams.get('sort_dir') || 'desc').toLowerCase() === 'asc' ? 'asc' : 'desc'
    const page = Math.max(parseInt(searchParams.get('page') || '1', 10), 1)
    const pageSize = Math.min(Math.max(parseInt(searchParams.get('page_size') || '20', 10), 1), 200)
    const exportAll = searchParams.get('export') === 'true'

    if (dateRangeKey && dateRangeKey !== 'custom') {
      const bounds = getDateRangeBounds(dateRangeKey)
      if (bounds) {
        fromDate = bounds.from
        toDate = bounds.to
      }
    }

    // Team members under this manager
    const { data: usersUnderManager, error: usersError } = await supabaseServer
      .from('users')
      .select('user_id, name, role')
      .eq('manager_id', user.id)

    if (usersError) {
      console.error('Users fetch error:', usersError)
      return NextResponse.json({
        error: 'Failed to fetch users',
        details: usersError.message
      }, { status: 500 })
    }

    const teamMembers = usersUnderManager || []
    const userIds = teamMembers.map(u => u.user_id)

    if (userIds.length === 0) {
      return NextResponse.json({
        success: true,
        data: [],
        employees: [],
        categories: [],
        kpis: {
          totalClaims: 0, pendingClaims: 0, approvedClaims: 0, rejectedClaims: 0, paidClaims: 0,
          totalApprovedValue: 0, pendingAmount: 0, rejectedAmount: 0, activeEmployees: 0
        },
        pagination: { page: 1, pageSize, total: 0, totalPages: 0 }
      })
    }

    // Base builder shared for both the KPI aggregation pass and the paginated data pass
    const buildQuery = () => {
      let q = supabaseServer
        .from('expenses')
        .select(`
          exp_id,
          date,
          category,
          amount,
          notes,
          file_link,
          status,
          created_at,
          users!expenses_user_id_fkey (
            user_id,
            name,
            role
          )
        `)
        .eq('submitted', true)
        .in('user_id', userIds)

      if (statusFilter === 'approved') {
        // "Sent to HR" is a downstream sub-state of Approved, so it's grouped under Approved
        q = q.in('status', ['Approved', 'Sent to HR'])
      } else if (statusFilter && statusFilter !== 'all' && STATUS_MAP[statusFilter]) {
        q = q.eq('status', STATUS_MAP[statusFilter])
      }
      if (fromDate && toDate) {
        q = q.gte('date', fromDate).lte('date', toDate)
      }
      if (employeeId) {
        q = q.eq('user_id', employeeId)
      }
      if (category) {
        q = q.eq('category', category)
      }
      if (minAmount) {
        q = q.gte('amount', parseFloat(minAmount))
      }
      if (maxAmount) {
        q = q.lte('amount', parseFloat(maxAmount))
      }
      if (search) {
        q = q.ilike('notes', `%${search}%`)
      }
      return q
    }

    // Fetch full filtered set once for accurate aggregation + optional export + in-memory sort/search-by-name/paginate
    const { data: allExpenses, error: expensesError } = await buildQuery()

    if (expensesError) {
      console.error('Pending expenses fetch error:', expensesError)
      return NextResponse.json({
        error: 'Failed to fetch pending expenses',
        details: expensesError.message
      }, { status: 500 })
    }

    let rows = allExpenses || []

    // Name search also matches employee name (notes already filtered server-side via ilike, so widen client-side to include name matches too)
    if (search) {
      const searchLower = search.toLowerCase()
      rows = rows.filter(e =>
        (e.notes || '').toLowerCase().includes(searchLower) ||
        (e.users?.name || '').toLowerCase().includes(searchLower) ||
        (e.category || '').toLowerCase().includes(searchLower)
      )
    }

    // KPI aggregation (computed over the filtered set, independent of pagination)
    const kpis = {
      totalClaims: rows.length,
      pendingClaims: 0,
      approvedClaims: 0,
      rejectedClaims: 0,
      paidClaims: 0,
      totalApprovedValue: 0,
      pendingAmount: 0,
      rejectedAmount: 0,
      activeEmployees: 0,
    }
    const activeEmployeeIds = new Set()
    for (const e of rows) {
      const amt = parseFloat(e.amount) || 0
      activeEmployeeIds.add(e.users?.user_id)
      if (e.status === 'Pending (Manager)') {
        kpis.pendingClaims++
        kpis.pendingAmount += amt
      } else if (e.status === 'Approved' || e.status === 'Sent to HR' || e.status === 'PAID') {
        kpis.approvedClaims++
        kpis.totalApprovedValue += amt
        if (e.status === 'PAID') kpis.paidClaims++
      } else if (e.status === 'Rejected') {
        kpis.rejectedClaims++
        kpis.rejectedAmount += amt
      }
    }
    kpis.activeEmployees = activeEmployeeIds.size

    // Sort
    const sorted = [...rows].sort((a, b) => {
      let av, bv
      switch (sortBy) {
        case 'amount':
          av = parseFloat(a.amount) || 0
          bv = parseFloat(b.amount) || 0
          break
        case 'date':
          av = new Date(a.date).getTime()
          bv = new Date(b.date).getTime()
          break
        case 'name':
          av = (a.users?.name || '').toLowerCase()
          bv = (b.users?.name || '').toLowerCase()
          break
        case 'status':
          av = a.status || ''
          bv = b.status || ''
          break
        default:
          av = new Date(a.created_at).getTime()
          bv = new Date(b.created_at).getTime()
      }
      if (av < bv) return sortDir === 'asc' ? -1 : 1
      if (av > bv) return sortDir === 'asc' ? 1 : -1
      return 0
    })

    const total = sorted.length
    const totalPages = Math.ceil(total / pageSize) || 1
    const pageSlice = exportAll ? sorted : sorted.slice((page - 1) * pageSize, (page - 1) * pageSize + pageSize)

    const formattedExpenses = pageSlice.map(expense => {
      let displayStatus = expense.status
      if (expense.status === 'Pending (Manager)') {
        displayStatus = 'Pending Review'
      }

      return {
        id: expense.exp_id,
        name: expense.users?.name,
        role: expense.users?.role,
        category: expense.category,
        notes: expense.notes || 'No notes added',
        amount: expense.amount,
        date: new Date(expense.date).toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric' }).replace(/\//g, '-'),
        rawDate: expense.date,
        status: displayStatus,
        file_link: expense.file_link,
        img: 'bg-blue-100 text-blue-600'
      }
    })

    const categories = [...new Set((allExpenses || []).map(e => e.category).filter(Boolean))]

    return NextResponse.json({
      success: true,
      data: formattedExpenses,
      employees: teamMembers.map(m => ({ id: m.user_id, name: m.name, role: m.role })),
      categories,
      kpis,
      pagination: exportAll
        ? { page: 1, pageSize: total, total, totalPages: 1 }
        : { page, pageSize, total, totalPages }
    })

  } catch (error) {
    console.error('Pending expenses API error:', error)
    return NextResponse.json({
      error: 'Internal server error',
      details: error.message
    }, { status: 500 })
  }
}
