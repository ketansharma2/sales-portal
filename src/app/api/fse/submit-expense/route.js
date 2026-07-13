import { supabaseServer } from '@/lib/supabase-server'
import { NextResponse } from 'next/server'
import { getUser } from '@/lib/auth-helper'

export async function POST(request) {
  try {
    // Authentication - user injected by middleware (no auth calls needed!)
    const { user, error: authError } = getUser(request);
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { exp_id } = await request.json()

    if (!exp_id) {
      return NextResponse.json({ error: 'Expense ID is required' }, { status: 400 })
    }

    // Update the expense to submitted
    const { data: updatedExpense, error: updateError } = await supabaseServer
      .from('expenses')
      .update({
        submitted: true,
        status: 'Pending (Manager)'
      })
      .eq('exp_id', exp_id)
      .eq('user_id', user.id) // Ensure user owns the expense
      .select()

    if (updateError || !updatedExpense || updatedExpense.length === 0) {
      console.error('Expense submit error:', updateError)
      return NextResponse.json({
        error: 'Expense not found or not owned by user',
        details: updateError?.message
      }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      data: updatedExpense[0]
    })

  } catch (error) {
    console.error('Submit expense API error:', error)
    return NextResponse.json({
      error: 'Internal server error',
      details: error.message
    }, { status: 500 })
  }
}