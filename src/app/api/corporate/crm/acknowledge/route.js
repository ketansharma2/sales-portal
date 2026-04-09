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

    // Get request body
    const body = await request.json()
    const { client_id } = body

    if (!client_id) {
      return NextResponse.json({ error: 'client_id is required' }, { status: 400 })
    }

    // Update status to 'Done' and set ack_date to today
    const { data, error: updateError } = await supabaseServer
      .from('corporate_crm_clients')
      .update({ 
        status: 'Done',
        ack_date: new Date().toISOString().split('T')[0]
      })
      .eq('client_id', client_id)
      .eq('user_id', user.id)
      .select()

    if (updateError) {
      console.error('Update status error:', updateError)
      return NextResponse.json({
        error: 'Failed to update status',
        details: updateError.message
      }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: 'Status updated to Done',
      data: data
    })

  } catch (error) {
    console.error('CRM acknowledge API error:', error)
    return NextResponse.json({
      error: 'Internal server error',
      details: error.message
    }, { status: 500 })
  }
}
