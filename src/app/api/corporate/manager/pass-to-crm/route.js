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

    // Check if user has MANAGER role
    const { data: userProfile, error: profileError } = await supabaseServer
      .from('users')
      .select('role')
      .eq('user_id', user.id)
      .single()

    if (profileError || !userProfile) {
      return NextResponse.json({ error: 'User profile not found' }, { status: 404 })
    }

    if (!userProfile.role || !userProfile.role.includes('MANAGER')) {
      return NextResponse.json({ error: 'Access denied. Manager role required.' }, { status: 403 })
    }

    // Get request body
    const { client_id, crm_user_id } = await request.json()

    if (!client_id || !crm_user_id) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Step 1: Fetch the client details from corporate_clients
    const { data: client, error: clientError } = await supabaseServer
      .from('corporate_clients')
      .select('*')
      .eq('client_id', client_id)
      .single()

    if (clientError || !client) {
      return NextResponse.json({ error: 'Client not found' }, { status: 404 })
    }

    // Step 2: Fetch the latest interaction for remarks and contact info
    const { data: latestInteraction } = await supabaseServer
      .from('corporate_clients_interaction')
      .select('remarks, contact_person, contact_no, email')
      .eq('client_id', client_id)
      .order('contact_date', { ascending: false })
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    const latestRemarks = latestInteraction?.remarks || null
    // Get contact info from latest interaction, fall back to client
    const contactPerson = latestInteraction?.contact_person || client.contact_person || null
    const contactNo = latestInteraction?.contact_no || client.contact_no || null
    const email = latestInteraction?.email || client.email || null

    const today = new Date().toISOString().split('T')[0]

    // Step 3: Insert into corporate_crm_clients
    const { data: crmClient, error: insertError } = await supabaseServer
      .from('corporate_crm_clients')
      .insert({
        client_id: client.client_id,
        company_name: client.company_name,
        onboarding_date: today,
        category: client.category,
        location: client.location,
        state: client.state,
        contact_person: contactPerson,
        email: email,
        phone: contactNo,
        remarks: latestRemarks,
        status: client.status,
        user_id: crm_user_id
      })
      .select()
      .single()

    if (insertError) {
      console.error('Insert to CRM clients error:', insertError)
      return NextResponse.json({ 
        error: 'Failed to insert into CRM clients',
        details: insertError.message 
      }, { status: 500 })
    }

    // Step 4: Update corporate_clients
    const { error: updateError } = await supabaseServer
      .from('corporate_clients')
      .update({
        sent_to_crm: true,
        crm_lock_date: today
      })
      .eq('client_id', client_id)

    if (updateError) {
      console.error('Update corporate clients error:', updateError)
      // Rollback the CRM insert
      await supabaseServer
        .from('corporate_crm_clients')
        .delete()
        .eq('client_id', client_id)
      
      return NextResponse.json({ 
        error: 'Failed to update client, transaction rolled back',
        details: updateError.message 
      }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: 'Client successfully passed to CRM',
      data: crmClient
    })

  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({
      error: 'Internal server error',
      details: error.message
    }, { status: 500 })
  }
}
