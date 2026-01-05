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
    const filterDate = searchParams.get('date')

    // Fetch expenses for the user
    let query = supabaseServer
      .from('expenses')
      .select('exp_id, user_id, date, category, amount, notes, status, approved_by, approved_at, created_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (filterDate) {
      query = query.eq('date', filterDate)
    }

    const { data: expensesData, error: expensesError } = await query

    if (expensesError) {
      console.error('Expenses fetch error:', expensesError)
      return NextResponse.json({
        error: 'Failed to fetch expenses',
        details: expensesError.message
      }, { status: 500 })
    }

    // Format the data
    const formattedExpenses = expensesData?.map(expense => ({
      id: expense.exp_id,
      date: expense.date,
      category: expense.category,
      amount: expense.amount,
      status: expense.status,
      notes: expense.notes || 'No notes added'
    })) || []

    return NextResponse.json({
      success: true,
      data: formattedExpenses
    })

  } catch (error) {
    console.error('Expenses API error:', error)
    return NextResponse.json({
      error: 'Internal server error',
      details: error.message
    }, { status: 500 })
  }
}

export async function POST(request) {
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

    const body = await request.json()
    const { date, category, amount, notes } = body

    // Insert new expense
    const { data: newExpense, error: insertError } = await supabaseServer
      .from('expenses')
      .insert({
        user_id: user.id,
        date,
        category,
        amount,
        notes,
        status: 'DRAFT',
        submitted: false
      })
      .select()
      .single()

    if (insertError) {
      console.error('Expense insert error:', insertError)
      return NextResponse.json({
        error: 'Failed to create expense',
        details: insertError.message
      }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      data: {
        user_id: newExpense.user_id,
        date: newExpense.date,
        category: newExpense.category,
        amount: newExpense.amount,
        status: newExpense.status,
        notes: newExpense.notes || 'No notes added'
      }
    })

  } catch (error) {
    console.error('Create expense API error:', error)
    return NextResponse.json({
      error: 'Internal server error',
      details: error.message
    }, { status: 500 })
  }
}

export async function DELETE(request) {
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

    const { exp_id } = await request.json()

    if (!exp_id) {
      return NextResponse.json({ error: 'Expense ID is required' }, { status: 400 })
    }

    // Delete the expense (only if it's DRAFT and belongs to user)
    const { data: deletedExpense, error: deleteError } = await supabaseServer
      .from('expenses')
      .delete()
      .eq('exp_id', exp_id)
      .eq('user_id', user.id)
      .eq('status', 'DRAFT') // Only allow deleting drafts
      .select()

    if (deleteError || !deletedExpense || deletedExpense.length === 0) {
      console.error('Expense delete error:', deleteError)
      return NextResponse.json({
        error: 'Expense not found or not owned by user',
        details: deleteError?.message
      }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      data: deletedExpense[0]
    })

  } catch (error) {
    console.error('Delete expense API error:', error)
    return NextResponse.json({
      error: 'Internal server error',
      details: error.message
    }, { status: 500 })
  }
}