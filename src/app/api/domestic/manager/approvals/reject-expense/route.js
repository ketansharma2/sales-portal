import { supabaseServer } from '@/lib/supabase-server'
import { NextResponse } from 'next/server'
import { notificationService } from '@/lib/services/notificationService'
import { actions } from '@/lib/messages/userMessages'; 
import { getUser } from '@/lib/auth-helper';

export async function POST(request) {
  try {
    // Authentication
      const { user, error: authError } = getUser(request);
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { exp_id } = await request.json()

    if (!exp_id) {
      return NextResponse.json({ error: 'Expense ID is required' }, { status: 400 })
    }

    // First, check if the expense exists and is pending for this manager's team
    const { data: expenseCheck, error: checkError } = await supabaseServer
      .from('expenses')
      .select('exp_id, users!expenses_user_id_fkey(manager_id)')
      .eq('exp_id', exp_id)
      .eq('status', 'Pending (Manager)')
      .eq('submitted', true)
      .eq('users.manager_id', user.id)
      .single()

    if (checkError || !expenseCheck) {
      return NextResponse.json({ error: 'Expense not found or not authorized' }, { status: 404 })
    }

    // Update the expense status to Rejected
    const { data: updatedExpense, error: updateError } = await supabaseServer
      .from('expenses')
      .update({
        status: 'Rejected',
        approved_by: user.id,
        approved_at: new Date().toISOString()
      })
      .eq('exp_id', exp_id)
      .select()
      .single()

    if (updateError) {
      console.error('Expense rejection error:', updateError)
      return NextResponse.json({
        error: 'Failed to reject expense',
        details: updateError.message
      }, { status: 500 })
    }
    const user_id = updatedExpense.user_id;
    await notificationService.createDynamicNotification( [user_id],actions.manager.expenseRejected,user.id );
    return NextResponse.json({
      success: true,
      data: updatedExpense
    })

  } catch (error) {
    console.error('Reject expense API error:', error)
    return NextResponse.json({
      error: 'Internal server error',
      details: error.message
    }, { status: 500 })
  }
}