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
    const { client_id } = body

    // Validate required fields
    if (!client_id) {
      return NextResponse.json({ error: 'Client ID is required' }, { status: 400 })
    }

    // Update the lead: set sent_to_sm to true and lock_date to today
    const today = new Date().toISOString().split('T')[0] // YYYY-MM-DD format

    const { data: updatedLead, error: updateError } = await supabaseServer
      .from('corporate_leadgen_leads')
      .update({
        sent_to_sm: true,
        lock_date: today
      })
      .eq('client_id', client_id)
      .eq('leadgen_id', user.id) // Ensure the user owns the lead
      .select()
      .single()

    if (updateError) {
      console.error('Send to manager update error:', updateError)
      return NextResponse.json({
        error: 'Failed to send to manager',
        details: updateError.message
      }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      data: updatedLead
    })

  } catch (error) {
    console.error('Send to manager API error:', error)
    return NextResponse.json({
      error: 'Internal server error',
      details: error.message
    }, { status: 500 })
  }
}