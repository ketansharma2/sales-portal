import { supabaseServer } from '@/lib/supabase-server'
import { NextResponse } from 'next/server'
import { getUserWithProfile } from '@/lib/auth-helper'
import { getUser, getUserName } from '@/lib/auth-helper' // Import getUserName

import { notificationService } from '@/lib/services/notificationService'
import { actions } from '@/lib/messages/userMessages';  
export async function POST(request) {
  try {
    // Authentication - user injected by middleware (no auth calls needed!)
    const { user, profile, error: authError } = getUserWithProfile(request);
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
     const actorName = await getUserName(request);
    
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

    // Check expenses table for the expense
    const { data: expenseCheck, error: checkError } = await supabaseServer
      .from('expenses')
      .select('exp_id')
      .eq('exp_id', exp_id)
      .eq('status', 'Pending (HOD)')
      .eq('submitted', true)
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
      .select('user_id')
      .single()

    if (updateError) {
      console.error('Expense rejection error:', updateError)
      return NextResponse.json({
        error: 'Failed to reject expense',
        details: updateError.message
      }, { status: 500 })
    }

    const expenseUserId = updatedExpense?.user_id
      await notificationService.createDynamicNotification( [expenseUserId],actions.hod.rejectExpense,user.id , { 
        extra: { actorName: actorName } 
      });


    return NextResponse.json({
      success: true,
      data: updatedExpense
    })

  } catch (error) {
    console.error('HOD reject expense API error:', error)
    return NextResponse.json({
      error: 'Internal server error',
      details: error.message
    }, { status: 500 })
  }
}
