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

    // Get query parameters for date filtering
    const { searchParams } = new URL(request.url)
    const fromDate = searchParams.get('from_date')
    const toDate = searchParams.get('to_date')

    // Build date filter for interactions
    const dateFilter = {}
    if (fromDate && toDate) {
      dateFilter.gte = fromDate
      dateFilter.lte = toDate
    }

    // Fetch interactions
    const interactionsQuery = supabaseServer
      .from('corporate_leads_interaction')
      .select('*')
      .eq('leadgen_id', user.id)

    if (fromDate && toDate) {
      interactionsQuery.gte('date', fromDate).lte('date', toDate)
    }

    const { data: interactionsData, error: interactionsError } = await interactionsQuery

    if (interactionsError) {
      return NextResponse.json({
        error: 'Failed to fetch interactions',
        details: interactionsError.message
      }, { status: 500 })
    }

    // Count onboarded (status contains 'onboard') - count unique companies
    const onboardedInteractions = interactionsData?.filter(i => i.status?.toLowerCase().includes('onboard')) || []
    const onboardedClientIds = new Set(onboardedInteractions.map(i => i.client_id))
    const totalOnboarded = onboardedClientIds.size

    const startupOnboarded = Array.from(onboardedClientIds).filter(clientId => {
      // Get the lead info from interactions
      const interaction = onboardedInteractions.find(i => i.client_id === clientId)
      const startup = interaction?.corporate_leadgen_leads?.startup;
      if (startup === true || 
          String(startup).toLowerCase() === 'yes' ||
          String(startup) === '1' ||
          String(startup).toLowerCase() === 'true') {
        return true
      }
      return false
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
