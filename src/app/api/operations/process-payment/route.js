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

    // Update expense status to PAID and set paid_date
    const today = new Date().toISOString().split('T')[0]

    const { data, error } = await supabaseServer
      .from('expenses')
      .update({
        status: 'PAID',
        paid_date: today
      })
      .eq('exp_id', exp_id)
      .select()

    if (error) {
      console.error('Payment update error:', error)
      return NextResponse.json({
        error: 'Failed to process payment',
        details: error.message
      }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: 'Payment processed successfully',
      data: data
    })

  } catch (error) {
    console.error('Payment API error:', error)
    return NextResponse.json({
      error: 'Internal server error',
      details: error.message
    }, { status: 500 })
  }
}
