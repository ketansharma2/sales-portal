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
    const {
      client_id,
      company_name,
      category,
      location,
      state,
      contact_person,
      email,
      phone,
      remarks,
      status,
      user_id
    } = body

    // Validate required fields
    if (!client_id || !company_name || !user_id) {
      return NextResponse.json({ error: 'Client ID, company name, and user ID are required' }, { status: 400 })
    }

    const insertData = {
      client_id,
      company_name,
      category,
      location,
      state,
      contact_person,
      email,
      phone,
      remarks,
      status,
      user_id,
      onboarding_date: new Date().toISOString().split('T')[0]
    };

    console.log('Data being posted to domestic_crm_clients:', insertData);

    // Insert into domestic_crm_clients table
    const { data: newClient, error: insertError } = await supabaseServer
      .from('domestic_crm_clients')
      .insert(insertData)
      .select()
      .single()

    if (insertError) {
      console.error('Pass to delivery insert error:', insertError)
      return NextResponse.json({
        error: 'Failed to pass to delivery',
        details: insertError.message
      }, { status: 500 })
    }

    // Update domestic_leadgen_leads to set sent_to_crm
    const { error: updateError } = await supabaseServer
      .from('domestic_leadgen_leads')
      .update({ sent_to_crm: user_id })
      .eq('client_id', client_id)

    if (updateError) {
      console.error('Update sent_to_crm error:', updateError)
      // Don't fail the request, just log
    }

    return NextResponse.json({
      success: true,
      data: newClient
    })

  } catch (error) {
    console.error('Pass to delivery API error:', error)
    return NextResponse.json({
      error: 'Internal server error',
      details: error.message
    }, { status: 500 })
  }
}