import { supabaseServer } from '@/lib/supabase-server'
import { NextResponse } from 'next/server'
import { getUserWithProfile } from '@/lib/auth-helper'

export async function POST(request) {
  try {
    // Authentication - user injected by middleware (no auth calls needed!)
    const { user, profile, error: authError } = getUserWithProfile(request);
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user has HOD role (from cached profile data)
    if (!profile || !profile.role) {
      return NextResponse.json({ error: 'User profile not found' }, { status: 404 })
    }

    if (!profile.role.includes('HOD')) {
      return NextResponse.json({ error: 'Access denied. HOD role required.' }, { status: 403 })
    }

    const { exp_id } = await request.json()

    if (!exp_id) {
      return NextResponse.json({ error: 'Expense ID is required' }, { status: 400 })
    }

    // Check expenses table for the expense with Approved status
    const { data: expenseCheck, error: checkError } = await supabaseServer
      .from('expenses')
      .select('exp_id')
      .eq('exp_id', exp_id)
      .eq('status', 'Approved')
      .eq('approved_by', user.id)
      .single()

    if (checkError || !expenseCheck) {
      return NextResponse.json({ error: 'Expense not found, not authorized, or not in Approved status' }, { status: 404 })
    }

    // Update the expense status to Sent to HR
    const { data: updatedExpense, error: updateError } = await supabaseServer
      .from('expenses')
      .update({
        status: 'Sent to HR'
      })
      .eq('exp_id', exp_id)
      .select()
      .single()

    if (updateError) {
      console.error('Send to HR error:', updateError)
      return NextResponse.json({
        error: 'Failed to send expense to HR',
        details: updateError.message
      }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      data: updatedExpense
    })

  } catch (error) {
    console.error('HOD send to HR API error:', error)
    return NextResponse.json({
      error: 'Internal server error',
      details: error.message
    }, { status: 500 })
  }
}
