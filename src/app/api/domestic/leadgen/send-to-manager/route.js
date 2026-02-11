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

    // Get manager info (user_id and name)
    let managerId = null
    let managerName = 'Manager'
    const { data: userProfile, error: profileError } = await supabaseServer
      .from('users')
      .select('manager_id')
      .eq('user_id', user.id)
      .single()

    if (!profileError && userProfile?.manager_id) {
      const { data: manager, error: managerError } = await supabaseServer
        .from('users')
        .select('user_id, name')
        .eq('user_id', userProfile.manager_id)
        .single()
      if (!managerError && manager) {
        managerId = manager.user_id
        managerName = manager.name
      }
    }

    // If client_id is 0 or not provided, just return manager info
    if (!client_id || client_id === 0) {
      return NextResponse.json({
        success: true,
        data: { managerName }
      })
    }

    // Validate required fields for sending lead
    if (!client_id) {
      return NextResponse.json({ error: 'Client ID is required' }, { status: 400 })
    }

    // Fetch the lead details with latest interaction
    const { data: lead, error: leadError } = await supabaseServer
      .from('domestic_leadgen_leads')
      .select('*')
      .eq('client_id', client_id)
      .single()

    if (leadError || !lead) {
      console.error('Lead fetch error:', leadError)
      return NextResponse.json({ error: 'Lead not found' }, { status: 404 })
    }

    // Fetch latest interaction for contact info
    const { data: interactions } = await supabaseServer
      .from('domestic_leads_interaction')
      .select('*')
      .eq('client_id', client_id)
      .order('date', { ascending: false })
      .limit(1)

    const latestInteraction = interactions?.[0] || {}

    const today = new Date().toISOString().split('T')[0]

    // Insert into domestic_manager_leads table
    const { data: managerLead, error: insertError } = await supabaseServer
      .from('domestic_manager_leads')
      .insert({
        client_id: lead.client_id,
        user_id: managerId,
        sourced_by: user.id,
        sourcing_date: lead.sourcing_date || null,
        arrived_date: today,
        company: lead.company,
        category: lead.category,
        city: lead.district_city || null,
        state: lead.state,
        location: lead.location || null,
        contact_person: latestInteraction.contact_person || lead.contact_person || null,
        phone: latestInteraction.contact_no || lead.phone || null,
        email: latestInteraction.email || lead.email || null,
        emp_count: lead.emp_count || lead.empCount || null,
        reference: lead.reference || null,
        remarks: latestInteraction.remarks || null,
        next_follow_up: latestInteraction.next_follow_up || null,
        status: latestInteraction.status || lead.status || 'Sent to Manager',
        sub_status: latestInteraction.sub_status || lead.sub_status || null
      })
      .select()
      .single()

    if (insertError) {
      console.error('Insert to domestic_manager_leads error:', insertError)
      return NextResponse.json({
        error: 'Failed to send lead to manager',
        details: insertError.message
      }, { status: 500 })
    }

    // Update the original lead: set sent_to_sm to true and lock_date to today
    const { data: updatedLead, error: updateError } = await supabaseServer
      .from('domestic_leadgen_leads')
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
        error: 'Failed to update lead',
        details: updateError.message
      }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      data: {
        ...updatedLead,
        managerName,
        managerLeadId: managerLead?.id
      }
    })

  } catch (error) {
    console.error('Send to manager API error:', error)
    return NextResponse.json({
      error: 'Internal server error',
      details: error.message
    }, { status: 500 })
  }
}