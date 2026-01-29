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

    // Query expenses with status 'SENT TO HR' (case insensitive)
    const { data: pendingExpenses, error: expensesError } = await supabaseServer
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
          role,
          sector
        )
      `)
      .eq('submitted', true)
      .ilike('status', 'SENT TO HR')
      .order('created_at', { ascending: false })

    if (expensesError) {
      console.error('Pending payouts fetch error:', expensesError)
      return NextResponse.json({
        error: 'Failed to fetch pending payouts',
        details: expensesError.message
      }, { status: 500 })
    }

    // Format the data
    const formattedExpenses = pendingExpenses?.map(expense => {
      return {
        id: expense.exp_id,
        empName: expense.users.name,
        role: expense.users.role,
        sector: expense.users.sector,
        category: expense.category,
        desc: expense.notes || 'No notes added',
        amount: expense.amount,
        date: new Date(expense.date).toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric' }).replace(/\//g, '-'),
        status: expense.status,
        file_link: expense.file_link,
        approver: 'Pending HR Review'
      };
    }) || []

    return NextResponse.json({
      success: true,
      data: formattedExpenses
    })

  } catch (error) {
    console.error('Pending payouts API error:', error)
    return NextResponse.json({
      error: 'Internal server error',
      details: error.message
    }, { status: 500 })
  }
}