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

    // Fetch all interactions for the user
    const { data: interactions, error } = await supabaseServer
      .from('domestic_leads_interaction')
      .select('client_id, status')
      .eq('leadgen_id', user.id)
      .order('client_id', { ascending: true })
      .order('created_at', { ascending: false })

    if (error) {
      return NextResponse.json({
        error: 'Failed to fetch interactions',
        details: error.message
      }, { status: 500 })
    }

    // Group by client_id and get the latest status
    const latestStatuses = {}
    interactions.forEach(interaction => {
      if (!latestStatuses[interaction.client_id]) {
        latestStatuses[interaction.client_id] = interaction.status
      }
    })

    // Count where status is 'Interested' (case insensitive)
    const interestedCount = Object.values(latestStatuses).filter(status =>
      status && status.toLowerCase() === 'interested'
    ).length

    return NextResponse.json({
      success: true,
      count: interestedCount
    })

  } catch (error) {
    return NextResponse.json({
      error: 'Internal server error',
      details: error.message
    }, { status: 500 })
  }
}