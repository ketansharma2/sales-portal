import { supabaseServer } from '@/lib/supabase-server'
import { NextResponse } from 'next/server'

export async function POST(request) {
  try {
    // Authentication
    const authHeader = request.headers.get('authorization')
    if (!authHeader) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }
    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authError } = await supabaseServer.auth.getUser(token)
    if (authError || !user) {
      return NextResponse.json({ success: false, error: 'Invalid token' }, { status: 401 })
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
      user_id,
    } = body

    // Insert into corporate_crm_clients table
    const { data, error } = await supabaseServer
      .from('corporate_crm_clients')
      .insert({
        client_id,
        company_name,
        category,
        location,
        state,
        contact_person,
        email,
        phone,
        remarks,
        status: status || 'Handover',
        user_id: user_id,
        onboarding_date: new Date().toISOString().split('T')[0],
      })
      .select()
      .single()

    if (error) {
      console.error('Insert error:', error)
      return NextResponse.json({ success: false, error: error.message }, { status: 400 })
    }

    // Update corporate_manager_leads status - use client_id column
    const { error: updateError } = await supabaseServer
      .from('corporate_manager_leads')
      .update({sent_to_crm: true })
      .eq('client_id', client_id)

    if (updateError) {
      console.error('Update error:', updateError)
      return NextResponse.json({ success: false, error: updateError.message }, { status: 400 })
    }

    return NextResponse.json({ success: true, data })
  } catch (error) {
    console.error('Error in pass-to-delivery:', error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
