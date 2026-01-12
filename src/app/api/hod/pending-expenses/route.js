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

    // Get user IDs under these managers
    const { data: usersUnderManagers, error: usersError } = await supabaseServer
      .from('users')
      .select('user_id')
      .in('manager_id', managerIds)

    if (usersError) {
      console.error('Users fetch error:', usersError)
      return NextResponse.json({
        error: 'Failed to fetch users',
        details: usersError.message
      }, { status: 500 })
    }

    const userIds = usersUnderManagers?.map(u => u.user_id) || []

    // Fetch all submitted expenses for these users
    const { data: pendingExpenses, error: expensesError } = await supabaseServer
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

    if (expensesError) {
      console.error('Pending expenses fetch error:', expensesError)
      return NextResponse.json({
        error: 'Failed to fetch pending expenses',
        details: expensesError.message
      }, { status: 500 })
    }

    // Format the data
    const formattedExpenses = pendingExpenses?.map(expense => ({
      id: expense.exp_id,
      name: expense.users.name,
      role: expense.users.role,
      category: expense.category,
      notes: expense.notes || 'No notes added',
      amount: expense.amount,
      date: new Date(expense.date).toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric' }).replace(/\//g, '-'),
      status: expense.status,
      img: 'bg-blue-100 text-blue-600' // Default avatar style
    })) || []

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