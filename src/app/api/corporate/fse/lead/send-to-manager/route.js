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

    const body = await request.json()
    const { client_id, sent_to_sm, lock_date } = body

    // Validate required fields
    if (!client_id) {
      return NextResponse.json({ error: 'Client ID is required' }, { status: 400 })
    }

    // First, fetch the lead from corporate_clients
    const { data: leadData, error: fetchError } = await supabaseServer
      .from('corporate_clients')
      .select('*')
      .eq('client_id', client_id)
      .single()

    if (fetchError || !leadData) {
      console.error('Lead not found for client_id:', client_id)
      return NextResponse.json({ error: 'Lead not found' }, { status: 404 })
    }

    // Debug: Log the fetched lead data
    console.log('Fetched lead data:', JSON.stringify(leadData, null, 2))

    // Update corporate_clients table with sent_to_sm and lock_date
    const { error: updateError } = await supabaseServer
      .from('corporate_clients')
      .update({
        sent_to_sm: sent_to_sm || true,
        lock_date: lock_date || new Date().toISOString().split('T')[0],
      })
      .eq('client_id', client_id)

    if (updateError) {
      console.error('Send to manager update error:', updateError)
      return NextResponse.json({
        error: 'Failed to send to manager',
        details: updateError.message
      }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      data: { client_id, sent_to_sm: true, lock_date: lock_date || new Date().toISOString().split('T')[0] }
    })

  } catch (error) {
    console.error('Send to manager API error:', error)
    return NextResponse.json({
      error: 'Internal server error',
      details: error.message
    }, { status: 500 })
  }
}
