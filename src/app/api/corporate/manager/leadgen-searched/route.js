import { supabaseServer } from '@/lib/supabase-server'
import { NextResponse } from 'next/server'

export async function GET(request) {
  try {
    const authHeader = request.headers.get('authorization')
    if (!authHeader) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authError } = await supabaseServer.auth.getUser(token)
    if (authError || !user) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }

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

    const { searchParams } = new URL(request.url)
    const selectedLeadgenId = searchParams.get('leadgen_id')
    const fromDate = searchParams.get('from_date')
    const toDate = searchParams.get('to_date')

    let leadgenIdsToQuery = []

    if (selectedLeadgenId && selectedLeadgenId !== 'All') {
      const { data: leadgenCheck, error: leadgenCheckError } = await supabaseServer
        .from('users')
        .select('user_id')
        .eq('user_id', selectedLeadgenId)
        .contains('role', ['LEADGEN'])
        .eq('manager_id', user.id)
        .single()

      if (leadgenCheckError || !leadgenCheck) {
        return NextResponse.json({ error: 'Invalid LeadGen selection' }, { status: 403 })
      }
      leadgenIdsToQuery = [selectedLeadgenId]
    } else {
      const { data: leadgenTeam, error: leadgenError } = await supabaseServer
        .from('users')
        .select('user_id')
        .contains('role', ['LEADGEN'])
        .eq('manager_id', user.id)

      if (leadgenError) {
        return NextResponse.json({ error: 'Failed to fetch LeadGen team' }, { status: 500 })
      }
      leadgenIdsToQuery = leadgenTeam?.map(lg => lg.user_id) || []
    }

    if (leadgenIdsToQuery.length === 0) {
      return NextResponse.json({ success: true, data: { searched: 0, startup: 0 } })
    }

    // Count total leads created (searched = total leads)
    const { count, error: countError } = await supabaseServer
      .from('corporate_leadgen_leads')
      .select('*', { count: 'exact', head: true })
      .in('leadgen_id', leadgenIdsToQuery)

    if (countError) {
      return NextResponse.json({ error: 'Failed to count searched' }, { status: 500 })
    }

    // Count startup leads
    const { data: leads, error: leadsError } = await supabaseServer
      .from('corporate_leadgen_leads')
      .select('startup')
      .in('leadgen_id', leadgenIdsToQuery)

    const startupCount = leads?.filter(l => {
      const startup = l.startup
      return startup === true || 
             String(startup).toLowerCase() === 'yes' ||
             String(startup) === '1' ||
             String(startup).toLowerCase() === 'true'
    }).length || 0

    return NextResponse.json({
      success: true,
      data: { searched: count || 0, startup: startupCount }
    })

  } catch (error) {
    console.error('LeadGen searched API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
