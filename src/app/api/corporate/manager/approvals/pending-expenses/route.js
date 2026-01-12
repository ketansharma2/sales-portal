import { supabaseServer } from '@/lib/supabase-server'
import { NextResponse } from 'next/server'

export async function GET(request) {
  try {
    // Authentication
    const authHeader = request.headers.get('authorization')
    if (!authHeader) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authError } = await supabaseServer.auth.getUser(token)
    if (authError || !user) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }

    // Get query parameters
    const { searchParams } = new URL(request.url)
    const fromDate = searchParams.get('from_date')
    const toDate = searchParams.get('to_date')
    const statusFilter = searchParams.get('status')

    // First, get user IDs under this manager
    const { data: usersUnderManager, error: usersError } = await supabaseServer
      .from('users')
      .select('user_id')
      .eq('manager_id', user.id)

    if (usersError) {
      console.error('Users fetch error:', usersError)
      return NextResponse.json({
        error: 'Failed to fetch users',
        details: usersError.message
      }, { status: 500 })
    }

    const userIds = usersUnderManager?.map(u => u.user_id) || []

    let query = supabaseServer
      .from('expenses')
      .select(`
        exp_id,
        date,
        category,
        amount,
        notes,
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
      .order('created_at', { ascending: false })

    if (statusFilter === 'pending') {
      query = query.eq('status', 'Pending (Manager)')
    }

    if (fromDate && toDate) {
      query = query.gte('date', fromDate).lte('date', toDate)
    }

    const { data: pendingExpenses, error: expensesError } = await query

    if (expensesError) {
      console.error('Pending expenses fetch error:', expensesError)
      return NextResponse.json({
        error: 'Failed to fetch pending expenses',
        details: expensesError.message
      }, { status: 500 })
    }

    // Format the data
    const formattedExpenses = pendingExpenses?.map(expense => {
      let displayStatus = expense.status;
      if (expense.status === 'Pending (Manager)') {
        displayStatus = 'Pending Review';
      } else if (expense.status === 'Approved') {
        displayStatus = 'Approved';
      } else if (expense.status === 'Rejected') {
        displayStatus = 'Rejected';
      }
      // Keep other statuses as is

      return {
        id: expense.exp_id,
        name: expense.users.name,
        role: expense.users.role,
        category: expense.category,
        notes: expense.notes || 'No notes added',
        amount: expense.amount,
        date: new Date(expense.date).toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric' }).replace(/\//g, '-'),
        status: displayStatus,
        img: 'bg-blue-100 text-blue-600' // Default avatar style
      };
    }) || []

    return NextResponse.json({
      success: true,
      data: formattedExpenses
    })

  } catch (error) {
    console.error('Pending expenses API error:', error)
    return NextResponse.json({
      error: 'Internal server error',
      details: error.message
    }, { status: 500 })
  }
}