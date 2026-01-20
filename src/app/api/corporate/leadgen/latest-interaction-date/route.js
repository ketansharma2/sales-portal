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

    // Get the latest interaction date
    const { data, error } = await supabaseServer
      .from('corporate_leads_interaction')
      .select('date')
      .eq('leadgen_id', user.id)
      .order('date', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (error) {
      return NextResponse.json({
        error: 'Failed to fetch latest interaction date',
        details: error.message
      }, { status: 500 })
    }

    const latestDate = data ? data.date : null
    const formattedDate = data ? new Date(data.date).toLocaleDateString('en-US', { weekday: 'short', day: 'numeric', month: 'short' }) : 'No data'

    return NextResponse.json({
      success: true,
      latestDate: formattedDate,
      rawDate: latestDate
    })

  } catch (error) {
    return NextResponse.json({
      error: 'Internal server error',
      details: error.message
    }, { status: 500 })
  }
}