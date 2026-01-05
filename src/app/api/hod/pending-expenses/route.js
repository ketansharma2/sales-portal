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

    // Fetch pending expenses for managers (status Pending (HOD))
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
      .eq('status', 'Pending (HOD)')
      .eq('submitted', true)
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
      status: 'Pending Review',
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