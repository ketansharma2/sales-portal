import { supabaseServer } from '@/lib/supabase-server'
import { NextResponse } from 'next/server'
import { getUser } from "@/lib/auth-helper";
export async function PUT(request) {
  try {
    // Authentication
    const { user, error: authError } = getUser(request)

if (authError || !user) {
  console.log('[API] Auth error:', authError)
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
}
    const body = await request.json()
    const {
      id,
      client_id,
      company,
      category,
      city,
      state,
      location,
      contact_person,
      phone,
      email,
      remarks,
      next_follow_up,
      status,
      sub_status,
      franchise_status,
      emp_count,
      reference,
      startup,
      projection,
    } = body

    if (!id && !client_id) {
      return NextResponse.json({ success: false, error: 'Lead ID or Client ID is required' }, { status: 400 })
    }

    // Update corporate_manager_leads
    const { data, error } = await supabaseServer
      .from('corporate_manager_leads')
      .update({
        client_id,
        company,
        category,
        city,
        state,
        location,
        contact_person,
        phone,
        email,
        remarks,
        next_follow_up,
        status,
        sub_status,
        franchise_status,
        emp_count,
        reference,
        startup,
        projection,
      })
      .eq('client_id', client_id || id)
      .select()
      .single()

    if (error) {
      console.error('Update error:', error)
      return NextResponse.json({ success: false, error: error.message }, { status: 400 })
    }

    return NextResponse.json({ success: true, data })
  } catch (error) {
    console.error('Error updating lead:', error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
