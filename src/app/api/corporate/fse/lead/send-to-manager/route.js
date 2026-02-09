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

    // First, fetch the lead from corporate_leadgen_leads
    const { data: leadData, error: fetchError } = await supabaseServer
      .from('corporate_leadgen_leads')
      .select('*')
      .eq('client_id', client_id)
      .single()

    if (fetchError || !leadData) {
      console.error('Lead not found for client_id:', client_id)
      return NextResponse.json({ error: 'Lead not found' }, { status: 404 })
    }

    // Debug: Log the fetched lead data
    console.log('Fetched lead data:', JSON.stringify(leadData, null, 2))

    // Prepare insert data
    const insertData = {
      client_id: leadData.client_id,
      user_id: user.id,
      company: leadData.company,
      category: leadData.category,
      state: leadData.state,
      city: leadData.district_city,
      location: leadData.location,
      contact_person: leadData.contact_person,
      phone: leadData.phone,
      email: leadData.email,
      emp_count: leadData.empCount,
      reference: leadData.reference,
      startup: leadData.startup,
      sourcing_date: leadData.sourcingDate,
      status: leadData.status ,
      sub_status: leadData.subStatus,
      franchise_status: leadData.franchiseStatus,
      remarks: leadData.remarks,
      next_follow_up: leadData.nextFollowup,
    }
    console.log('Insert data:', JSON.stringify(insertData, null, 2))

    // Insert into corporate_manager_leads with all fields
    const { data: newLead, error: insertError } = await supabaseServer
      .from('corporate_manager_leads')
      .insert(insertData)
      .select()
      .single()

    // Also update corporate_leadgen_leads to mark as sent and lock
    const { error: lockError } = await supabaseServer
      .from('corporate_leadgen_leads')
      .update({
        sent_to_sm: true,
        lock_date: new Date().toISOString().split('T')[0],
      })
      .eq('client_id', client_id)

    if (insertError) {
      console.error('Send to manager insert error:', insertError)
      return NextResponse.json({
        error: 'Failed to send to manager',
        details: insertError.message
      }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      data: newLead
    })

  } catch (error) {
    console.error('Send to manager API error:', error)
    return NextResponse.json({
      error: 'Internal server error',
      details: error.message
    }, { status: 500 })
  }
}
