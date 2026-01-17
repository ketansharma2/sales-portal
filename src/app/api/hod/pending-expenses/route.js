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

    // First, get managers under this HOD
    const { data: managers, error: mgrError } = await supabaseServer
      .from('users')
      .select('user_id')
      .eq('hod_id', user.id)
      .contains('role', ['MANAGER'])

    if (mgrError) {
      console.error('Managers fetch error:', mgrError)
      return NextResponse.json({
        error: 'Failed to fetch managers',
        details: mgrError.message
      }, { status: 500 })
    }

    const managerIds = managers?.map(m => m.user_id) || []

    if (managerIds.length === 0) {
      return NextResponse.json({
        success: true,
        data: []
      })
    }

    // Fetch all submitted expenses for these managers from both tables
    const [domesticExpenses, corporateExpenses] = await Promise.all([
      // Query domestic expenses table
      supabaseServer
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
        .in('user_id', managerIds)
        .order('created_at', { ascending: false }),

      // Query corporate expenses table
      supabaseServer
        .from('corporate_expenses')
        .select(`
          exp_id,
          date,
          category,
          amount,
          notes,
          file_link,
          status,
          created_at,
          users!corporate_expenses_user_id_fkey (
            user_id,
            name,
            role
          )
        `)
        .eq('submitted', true)
        .in('user_id', managerIds)
        .order('created_at', { ascending: false })
    ])

    if (domesticExpenses.error) {
      console.error('Domestic expenses fetch error:', domesticExpenses.error)
      return NextResponse.json({
        error: 'Failed to fetch domestic expenses',
        details: domesticExpenses.error.message
      }, { status: 500 })
    }

    if (corporateExpenses.error) {
      console.error('Corporate expenses fetch error:', corporateExpenses.error)
      return NextResponse.json({
        error: 'Failed to fetch corporate expenses',
        details: corporateExpenses.error.message
      }, { status: 500 })
    }

    // Combine and format the data from both tables
    const allExpenses = [
      ...(domesticExpenses.data || []).map(expense => ({
        id: expense.exp_id,
        name: expense.users?.name || 'Unknown',
        role: expense.users?.role || 'Unknown',
        category: expense.category,
        notes: expense.notes || 'No notes added',
        amount: expense.amount,
        date: new Date(expense.date).toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric' }).replace(/\//g, '-'),
        status: expense.status,
        file_link: expense.file_link,
        img: 'bg-blue-100 text-blue-600', // Default avatar style
        source: 'domestic' // Track which table this came from
      })),
      ...(corporateExpenses.data || []).map(expense => ({
        id: expense.exp_id,
        name: expense.users?.name || 'Unknown',
        role: expense.users?.role || 'Unknown',
        category: expense.category,
        notes: expense.notes || 'No notes added',
        amount: expense.amount,
        date: new Date(expense.date).toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric' }).replace(/\//g, '-'),
        status: expense.status,
        file_link: expense.file_link,
        img: 'bg-green-100 text-green-600', // Different color for corporate
        source: 'corporate' // Track which table this came from
      }))
    ]

    // Sort combined results by creation date (most recent first)
    const formattedExpenses = allExpenses.sort((a, b) => new Date(b.created_at) - new Date(a.created_at))

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