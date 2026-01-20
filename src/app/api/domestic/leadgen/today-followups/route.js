import { supabaseServer } from '@/lib/supabase-server'
import { NextResponse } from 'next/server'

export async function GET(request) {
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

    // Get today's date in YYYY-MM-DD format
    const today = new Date().toISOString().split('T')[0]

    // Fetch interactions with next_follow_up today, joined with leads
    const { data: followupsData, error: followupsError } = await supabaseServer
      .from('domestic_leads_interaction')
      .select(`
        *,
        domestic_leadgen_leads!inner (
          company
        )
      `)
      .eq('next_follow_up', today)
      .eq('domestic_leadgen_leads.leadgen_id', user.id)
      .order('created_at', { ascending: false })

    if (followupsError) {
      return NextResponse.json({
        error: 'Failed to fetch today\'s follow-ups',
        details: followupsError.message
      }, { status: 500 })
    }

    // Format the data
    const formattedFollowups = followupsData?.map(followup => ({
      client_id: followup.client_id,
      company: followup.domestic_leadgen_leads.company,
      remarks: followup.remarks,
      status: followup.status,
      sub_status: followup.sub_status,
      contact_person: followup.contact_person,
      contact_no: followup.contact_no,
      email: followup.email,
      next_follow_up: followup.next_follow_up,
      date: followup.date
    })) || []

    return NextResponse.json({
      success: true,
      data: formattedFollowups
    })

  } catch (error) {
    return NextResponse.json({
      error: 'Internal server error',
      details: error.message
    }, { status: 500 })
  }
}