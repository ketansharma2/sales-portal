import { supabaseServer } from '@/lib/supabase-server'
import { NextResponse } from 'next/server'

export async function POST(request) {
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

    // Get request body
    const body = await request.json()
    const { from, to } = body

    // Get current date in YYYY-MM-DD format
    const today = new Date().toISOString().split('T')[0]
    const currentMonth = new Date().getMonth() + 1
    const currentYear = new Date().getFullYear()
    const startDate = `${currentYear}-${String(currentMonth).padStart(2, '0')}-01`

    // Get monthly stats from DWR
    const { data: monthlyDwr, error: monthlyDwrError } = await supabaseServer
      .from('corporate_dwr_history')
      .select('*')
      .eq('user_id', user.id)
      .gte('dwr_date', startDate)

    if (monthlyDwrError) {
      console.error('Monthly DWR error:', monthlyDwrError)
    }

    const monthlyTotalVisits = monthlyDwr?.reduce((sum, d) => sum + (parseInt(d.total_visit) || 0), 0) || 0
    const monthlyIndividualVisits = monthlyDwr?.reduce((sum, d) => sum + (parseInt(d.individual) || 0), 0) || 0
    const monthlyOnboarded = monthlyDwr?.reduce((sum, d) => sum + (parseInt(d.onboarded) || 0), 0) || 0
    const sortedMonthlyDwr = monthlyDwr?.sort((a, b) => new Date(b.dwr_date) - new Date(a.dwr_date)) || []
    const monthlyAvg = sortedMonthlyDwr[0]?.avg_visit || 0

    // Get latest DWR record
    const { data: latestDwrData, error: latestDwrError } = await supabaseServer
      .from('corporate_dwr_history')
      .select('*')
      .eq('user_id', user.id)
      .order('dwr_date', { ascending: false })
      .limit(1)

    if (latestDwrError) {
      console.error('Latest DWR error:', latestDwrError)
    }

    const latestDwr = latestDwrData?.[0] || null

    // Get DWR for display
    let displayDwr;
    if (from && to) {
      // Sum for date range
      const { data: rangeDwr, error: rangeError } = await supabaseServer
        .from('corporate_dwr_history')
        .select('*')
        .eq('user_id', user.id)
        .gte('dwr_date', from)
        .lte('dwr_date', to)

      if (rangeError) {
        console.error('Range DWR error:', rangeError)
      }

      const sortedRangeDwr = rangeDwr?.sort((a, b) => new Date(b.dwr_date) - new Date(a.dwr_date)) || []

      displayDwr = {
        dwr_date: to,
        total_visit: rangeDwr?.reduce((sum, d) => sum + (parseInt(d.total_visit) || 0), 0) || 0,
        individual: rangeDwr?.reduce((sum, d) => sum + (parseInt(d.individual) || 0), 0) || 0,
        repeat: rangeDwr?.reduce((sum, d) => sum + (parseInt(d.repeat) || 0), 0) || 0,
        interested: rangeDwr?.reduce((sum, d) => sum + (parseInt(d.interested) || 0), 0) || 0,
        not_interested: rangeDwr?.reduce((sum, d) => sum + (parseInt(d.not_interested) || 0), 0) || 0,
        reached_out: rangeDwr?.reduce((sum, d) => sum + (parseInt(d.reached_out) || 0), 0) || 0,
        onboarded: rangeDwr?.reduce((sum, d) => sum + (parseInt(d.onboarded) || 0), 0) || 0,
        avg_visit: sortedRangeDwr[0]?.avg_visit || 0
      }
    } else {
      displayDwr = latestDwr || {
        dwr_date: today,
        total_visit: 0,
        individual: 0,
        repeat: 0,
        interested: 0,
        not_interested: 0,
        onboarded: 0,
        reached_out: 0,
        avg_visit: 0
      }
    }

    // Get total clients count
    const { count: totalClients, error: countError } = await supabaseServer
      .from('corporate_clients')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)

    if (countError) {
      console.error('Total clients count error:', countError)
    }

    // Get total onboarded count
    const { count: totalOnboarded, error: onboardError } = await supabaseServer
      .from('corporate_clients')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('status', 'Onboarded')

    if (onboardError) {
      console.error('Total onboarded count error:', onboardError)
    }

    // Get total visits count
    const { count: totalVisitsEver, error: visitsError } = await supabaseServer
      .from('corporate_clients')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .ilike('contact_mode', 'visit')

    if (visitsError) {
      console.error('Total visits count error:', visitsError)
    }

    // Get projection counts
    const projections = {}
    const projectionTypes = ["WP > 50", "WP < 50", "MP > 50", "MP < 50"]
    const projectionKeys = ["wpGreater50", "wpLess50", "mpGreater50", "mpLess50"]

    for (let i = 0; i < projectionTypes.length; i++) {
      const { count, error } = await supabaseServer
        .from('corporate_clients')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('projection', projectionTypes[i])

      if (error) {
        console.error(`Projection count error for ${projectionTypes[i]}:`, error)
      }

      projections[projectionKeys[i]] = count || 0
    }

    // Get clients with activity on the latest DWR date
    let recentLeads
    if (from && to) {
      // Sum for date range
      const { data: rangeLeads, error: rangeError } = await supabaseServer
        .from('corporate_clients')
        .select('*')
        .eq('user_id', user.id)
        .or(`and(sourcing_date.gte.${from},sourcing_date.lte.${to}),and(latest_contact_date.gte.${from},latest_contact_date.lte.${to})`)
        .order('created_at', { ascending: false })

      if (rangeError) {
        console.error('Range leads error:', rangeError)
      }

      recentLeads = rangeLeads
    } else {
      const latestDwrDate = displayDwr.dwr_date || today
      const { data: dateLeads, error: dateError } = await supabaseServer
        .from('corporate_clients')
        .select('*')
        .eq('user_id', user.id)
        .or(`sourcing_date.eq.${latestDwrDate},latest_contact_date.eq.${latestDwrDate}`)
        .order('created_at', { ascending: false })

      if (dateError) {
        console.error('Date leads error:', dateError)
      }

      recentLeads = dateLeads
    }

    // Format recent leads for UI
    const formattedLeads = recentLeads?.map((lead, index) => ({
      sn: index + 1,
      date: lead.sourcing_date || lead.latest_contact_date || displayDwr.dwr_date || today,
      name: lead.company,
      status: lead.status,
      sub: lead.sub_status || '-',
      color: getStatusColor(lead.status)
    })) || []


    const dashboardData = {
      totalClients: totalClients || 0,
      totalOnboarded: totalOnboarded || 0,
      totalVisits: totalVisitsEver || 0,
      projections: projections,
      monthlyStats: {
        month: new Date().toLocaleString('en-US', { month: 'long', year: 'numeric' }).toUpperCase(),
        totalVisits: monthlyTotalVisits,
        individualVisits: monthlyIndividualVisits,
        totalOnboarded: monthlyOnboarded,
        mtdMp: `${monthlyOnboarded}/12`,
        avg: monthlyAvg ? parseFloat(monthlyAvg).toString() : '0.0'
      },
      latestActivity: {
        date: displayDwr.dwr_date ? new Date(displayDwr.dwr_date).toLocaleDateString('en-GB') : new Date().toLocaleDateString('en-GB'), // DD/MM/YYYY format
        total: displayDwr.total_visit || 0,
        individual: displayDwr.individual || 0,
        repeat: displayDwr.repeat || 0,
        interested: displayDwr.interested || 0,
        notInterested: displayDwr.not_interested || 0,
        reachedOut: displayDwr.reached_out || 0,
        onboarded: displayDwr.onboarded || 0
      },
      latestLeads: formattedLeads
    }
    return NextResponse.json({
      success: true,
      data: dashboardData
    })

  } catch (error) {
    console.error('Dashboard API error:', error)
    return NextResponse.json({
      error: 'Internal server error',
      details: error.message
    }, { status: 500 })
  }
}

// Helper function to get status color classes
function getStatusColor(status) {
  switch (status) {
    case 'Onboarded':
      return 'text-white bg-green-700'
    case 'Interested':
      return 'text-green-600 bg-green-50'
    case 'Not Interested':
      return 'text-red-600 bg-red-50'
    default:
      return 'text-blue-600 bg-blue-50'
  }
}