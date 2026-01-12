import { supabaseServer } from '@/lib/supabase-server'
import { NextResponse } from 'next/server'

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

    // Check if user has HOD role
    const { data: userProfile, error: profileError } = await supabaseServer
      .from('users')
      .select('role')
      .eq('user_id', user.id)
      .single()

    if (profileError || !userProfile) {
      return NextResponse.json({ error: 'User profile not found' }, { status: 404 })
    }

    if (!userProfile.role || !userProfile.role.includes('HOD')) {
      return NextResponse.json({ error: 'Access denied. HOD role required.' }, { status: 403 })
    }

    const { exp_id } = await request.json()

    if (!exp_id) {
      return NextResponse.json({ error: 'Expense ID is required' }, { status: 400 })
    }

    // First, check if the expense exists and is pending for HOD approval
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

    // Update the expense status to Sent to HR
    const { data: updatedExpense, error: updateError } = await supabaseServer
      .from('expenses')
      .update({
        status: 'Sent to HR',
        approved_by: user.id,
        approved_at: new Date().toISOString()
      })
      .eq('exp_id', exp_id)
      .select()
      .single()

    if (updateError) {
      console.error('Expense approval error:', updateError)
      return NextResponse.json({
        error: 'Failed to approve expense',
        details: updateError.message
      }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      data: updatedExpense
    })

  } catch (error) {
    console.error('HOD approve expense API error:', error)
    return NextResponse.json({
      error: 'Internal server error',
      details: error.message
    }, { status: 500 })
  }
}