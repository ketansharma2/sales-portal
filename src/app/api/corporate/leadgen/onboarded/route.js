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

    // Get query parameters - use same param names as other APIs
    const { searchParams } = new URL(request.url)
    const fromDate = searchParams.get('fromDate')
    const toDate = searchParams.get('toDate')

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
      .eq('leadgen_id', user.id)
      .order('created_at', { ascending: false })

    if (queryError) {
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
        .eq('leadgen_id', user.id)
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

    // Count clients where latest interaction status contains 'onboard'
    const latestInteractions = Array.from(latestInteractionsMap.values())
    const onboardedClients = latestInteractions.filter(i => 
      i.status?.toLowerCase().includes('onboard')
    )
    
    const totalOnboarded = onboardedClients.length

    // Count startup onboarded
    const startupOnboarded = onboardedClients.filter(i => {
      const startup = i.startup
      return startup === true || 
             String(startup).toLowerCase() === 'yes' ||
             String(startup) === '1' ||
             String(startup).toLowerCase() === 'true'
    }).length

    return NextResponse.json({
      success: true,
      data: {
        onboarded: { total: totalOnboarded, startup: startupOnboarded }
      }
    })

  } catch (error) {
    console.error('Onboarded API error:', error)
    return NextResponse.json({
      error: 'Internal server error',
      details: error.message
    }, { status: 500 })
  }
}
