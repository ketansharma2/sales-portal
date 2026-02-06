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

    // Get query parameters
    const { searchParams } = new URL(request.url)
    const selectedLeadgenId = searchParams.get('leadgen_id')
    const fromDate = searchParams.get('from_date')
    const toDate = searchParams.get('to_date')

    let leadgenIdsToQuery = []

    if (selectedLeadgenId && selectedLeadgenId !== 'All') {
      // Verify the selected LeadGen belongs to this manager
      const { data: leadgenCheck, error: leadgenCheckError } = await supabaseServer
        .from('users')
        .select('user_id')
        .eq('user_id', selectedLeadgenId)
        .contains('role', ['LEADGEN'])
        .eq('manager_id', user.id)
        .single()

      if (leadgenCheckError || !leadgenCheck) {
        return NextResponse.json({
          error: 'Invalid LeadGen selection or access denied'
        }, { status: 403 })
      }

      leadgenIdsToQuery = [selectedLeadgenId]
    } else {
      // Get all LeadGen team user IDs under this manager
      const { data: leadgenTeam, error: leadgenError } = await supabaseServer
        .from('users')
        .select('user_id')
        .contains('role', ['LEADGEN'])
        .eq('manager_id', user.id)

      if (leadgenError) {
        console.error('LeadGen team fetch error:', leadgenError)
        return NextResponse.json({
          error: 'Failed to fetch LeadGen team',
          details: leadgenError.message
        }, { status: 500 })
      }

      leadgenIdsToQuery = leadgenTeam?.map(lg => lg.user_id) || []
    }

    if (leadgenIdsToQuery.length === 0) {
      return NextResponse.json({
        success: true,
        data: { interested: 0, startup: 0 }
      })
    }

    // Get all leads with their interactions
    const { data: rawData, error: queryError } = await supabaseServer
      .from('corporate_leadgen_leads')
      .select(`
        client_id,
        startup,
        corporate_leads_interaction!left (
          id,
          date,
          status,
          created_at
        )
      `)
      .in('leadgen_id', leadgenIdsToQuery)
      .order('created_at', { ascending: false })

    if (queryError) {
      console.error('LeadGen leads fetch error:', queryError)
      return NextResponse.json({
        error: 'Failed to fetch data',
        details: queryError.message
      }, { status: 500 })
    }

    // Filter leads based on date range if provided
    let leadsToConsider = rawData || []
    if (fromDate && toDate) {
      // Get client_ids that have interactions in the date range
      const { data: interactionsInRange } = await supabaseServer
        .from('corporate_leads_interaction')
        .select('client_id')
        .in('leadgen_id', leadgenIdsToQuery)
        .gte('date', fromDate)
        .lte('date', toDate)
      
      const clientIdsInRange = new Set(interactionsInRange?.map(i => i.client_id) || [])
      leadsToConsider = (rawData || []).filter(lead => clientIdsInRange.has(lead.client_id))
    }

    // Find latest interaction per client
    const latestInteractionsMap = new Map()
    leadsToConsider.forEach(lead => {
      const interaction = lead.corporate_leads_interaction?.[0] || null
      if (interaction) {
        const existing = latestInteractionsMap.get(lead.client_id)
        if (!existing || new Date(interaction.created_at) > new Date(existing.created_at)) {
          latestInteractionsMap.set(lead.client_id, {
            ...interaction,
            startup: lead.startup
          })
        }
      }
    })

    // Count clients where latest interaction status = 'Interested'
    const latestInteractions = Array.from(latestInteractionsMap.values());
    const interestedLatest = latestInteractions.filter(i =>
      String(i.status).trim().toLowerCase() === 'interested'
    );
    const totalInterested = interestedLatest.length;

    // Count startup companies
    const startupInterested = interestedLatest.filter(i => {
      const startup = i.startup;
      return startup === true || 
             String(startup).toLowerCase() === 'yes' ||
             String(startup) === '1' ||
             String(startup).toLowerCase() === 'true';
    }).length;

    return NextResponse.json({
      success: true,
      data: { 
        interested: totalInterested, 
        startup: startupInterested 
      }
    })

  } catch (error) {
    console.error('LeadGen interested API error:', error)
    return NextResponse.json({
      error: 'Internal server error',
      details: error.message
    }, { status: 500 })
  }
}
