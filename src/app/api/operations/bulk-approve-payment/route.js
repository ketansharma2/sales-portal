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

    const { exp_ids } = await request.json()

    if (!exp_ids || !Array.isArray(exp_ids) || exp_ids.length === 0) {
      return NextResponse.json({ 
        error: 'Expense IDs array is required and cannot be empty' 
      }, { status: 400 })
    }

    const today = new Date().toISOString().split('T')[0]

    // Update multiple expenses in one query
    const { data, error } = await supabaseServer
      .from('expenses')
      .update({
        status: 'PAID',
        paid_date: today
      })
      .in('exp_id', exp_ids)
      .select()

    if (error) {
      console.error('Bulk payment update error:', error)
      return NextResponse.json({
        error: 'Failed to process bulk payments',
        details: error.message
      }, { status: 500 })
    }

    // Check if all requested IDs were updated
    const updatedIds = data.map(item => item.exp_id)
    const notUpdated = exp_ids.filter(id => !updatedIds.includes(id))

    return NextResponse.json({
      success: true,
      message: `Successfully processed ${data.length} payments`,
      data: data,
      not_updated: notUpdated.length > 0 ? notUpdated : undefined,
      details: {
        total_requested: exp_ids.length,
        total_updated: data.length,
        failed: notUpdated.length
      }
    })

  } catch (error) {
    console.error('Bulk payment API error:', error)
    return NextResponse.json({
      error: 'Internal server error',
      details: error.message
    }, { status: 500 })
  }
}