import { supabaseServer } from '@/lib/supabase-server'
import { NextResponse } from 'next/server'
import { getUser } from "@/lib/auth-helper";
export async function POST(request) {
  try {
    // Authentication
   const { user, error: authError } = getUser(request)

if (authError || !user) {
  console.log('[API] Auth error:', authError)
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
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

    // Insert into domestic_crm_clients table
    const { data, error } = await supabaseServer
      .from('domestic_crm_clients')
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

    // Update domestic_manager_leads status - use client_id column
    const { error: updateError } = await supabaseServer
      .from('domestic_manager_leads')
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
