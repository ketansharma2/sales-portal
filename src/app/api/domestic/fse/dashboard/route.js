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
      .from('dwr_history')
      .select('*')
      .eq('user_id', user.id)
      .gte('dwr_date', startDate)

    if (monthlyDwrError) {
      console.error('Monthly DWR error:', monthlyDwrError)
    }

    // Get monthly visits from interactions
    const { count: monthlyTotalVisitsCount, error: monthlyVisitsError } = await supabaseServer
      .from('domestic_clients_interaction')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .gte('contact_date', startDate)
      .lte('contact_date', `${currentYear}-${String(currentMonth).padStart(2, '0')}-${new Date(currentYear, currentMonth, 0).getDate()}`)
      .ilike('contact_mode', 'visit')

    if (monthlyVisitsError) {
      console.error('Monthly visits error:', monthlyVisitsError)
    }

    const monthlyTotalVisits = monthlyTotalVisitsCount || 0

    // Get monthly individual visits from domestic_clients
    const { count: monthlyIndividualVisitsCount, error: monthlyIndividualError } = await supabaseServer
      .from('domestic_clients')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .gte('sourcing_date', startDate)
      .lte('sourcing_date', `${currentYear}-${String(currentMonth).padStart(2, '0')}-${new Date(currentYear, currentMonth, 0).getDate()}`)

    if (monthlyIndividualError) {
      console.error('Monthly individual visits error:', monthlyIndividualError)
    }

    const monthlyIndividualVisits = monthlyIndividualVisitsCount || 0

    // Get monthly onboarded from interactions
    const monthEnd = `${currentYear}-${String(currentMonth).padStart(2, '0')}-${new Date(currentYear, currentMonth, 0).getDate()}`
    let monthlyInteractions = []
    let monthlyOffset = 0
    const monthlyBatchSize = 1000
    let monthlyOnboardError = null

    while (true) {
      const { data, error } = await supabaseServer
        .from('domestic_clients_interaction')
        .select('client_id, status, contact_date, created_at')
        .eq('user_id', user.id)
        .gte('contact_date', startDate)
        .lte('contact_date', monthEnd)
        .order('client_id', { ascending: true })
        .order('contact_date', { ascending: false })
        .order('created_at', { ascending: false })
        .range(monthlyOffset, monthlyOffset + monthlyBatchSize - 1)

      if (error) {
        monthlyOnboardError = error
        break
      }

      if (data.length === 0) break

      monthlyInteractions.push(...data)
      monthlyOffset += monthlyBatchSize

      if (data.length < monthlyBatchSize) break
    }

    if (monthlyOnboardError) {
      console.error('Monthly onboarded error:', monthlyOnboardError)
    }

    // Process to get latest status per client in month
    const monthlyLatestStatuses = new Map()
    monthlyInteractions?.forEach(interaction => {
      if (!monthlyLatestStatuses.has(interaction.client_id)) {
        monthlyLatestStatuses.set(interaction.client_id, interaction.status)
      }
    })

    const monthlyOnboarded = Array.from(monthlyLatestStatuses.values()).filter(status => status === 'Onboarded').length
    const sortedMonthlyDwr = monthlyDwr?.sort((a, b) => new Date(b.dwr_date) - new Date(a.dwr_date)) || []
    const monthlyAvg = sortedMonthlyDwr[0]?.avg_visit || 0

    // Get latest DWR record
    const { data: latestDwrData, error: latestDwrError } = await supabaseServer
      .from('dwr_history')
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
        .from('dwr_history')
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
      .from('domestic_clients')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)

    if (countError) {
      console.error('Total clients count error:', countError)
    }

    // Get total onboarded count based on latest interactions
    let allInteractions = []
    let offset = 0
    const batchSize = 1000
    let onboardError = null

    while (true) {
      const { data, error } = await supabaseServer
        .from('domestic_clients_interaction')
        .select('client_id, status, projection, contact_date, created_at')
        .eq('user_id', user.id)
        .order('client_id', { ascending: true })
        .order('contact_date', { ascending: false })
        .order('created_at', { ascending: false })
        .range(offset, offset + batchSize - 1)

      if (error) {
        onboardError = error
        break
      }

      if (data.length === 0) break

      allInteractions.push(...data)
      offset += batchSize

      if (data.length < batchSize) break
    }

    if (onboardError) {
      console.error('Total onboarded count error:', onboardError)
    }

    // Process to get latest status and projection per client
    const latestStatuses = new Map()
    const latestProjections = new Map()
    allInteractions?.forEach(interaction => {
      if (!latestStatuses.has(interaction.client_id)) {
        latestStatuses.set(interaction.client_id, interaction.status)
        latestProjections.set(interaction.client_id, interaction.projection)
      }
    })

    const totalOnboarded = Array.from(latestStatuses.values()).filter(status => status === 'Onboarded').length

    // Get latest contact date
    const latestContactDate = allInteractions?.reduce((max, interaction) => interaction.contact_date > max ? interaction.contact_date : max, '') || today

    // Get counts for latest activity date
    const latestDateInteractions = allInteractions?.filter(interaction => interaction.contact_date === latestContactDate) || []
    const latestTotalVisits = latestDateInteractions.length
    // For individual, count clients sourced on that date
    // Actually, since we have allInteractions, but to match, perhaps query domestic_clients
    // But to keep simple, since domestic_clients sourcing_date is when client was added, perhaps count unique client_id in interactions on date
    // But user said query domestic_clients sourcing_date = latest date
    // So, change to count from domestic_clients
    // But since we don't have domestic_clients data, perhaps add a query
    // For now, keep as is, but user wants from domestic_clients
    // Let's add a query for individual
    const { count: latestIndividualCount, error: latestIndividualError } = await supabaseServer
      .from('domestic_clients')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('sourcing_date', latestContactDate)

    if (latestIndividualError) {
      console.error('Latest individual error:', latestIndividualError)
    }

    const latestIndividualVisits = latestIndividualCount || 0
    const latestOnboarded = latestDateInteractions.filter(interaction => interaction.status === 'Onboarded').length
    const latestInterested = latestDateInteractions.filter(interaction => interaction.status === 'Interested').length
    const latestNotInterested = latestDateInteractions.filter(interaction => interaction.status === 'Not Interested').length
    const latestReachedOut = latestDateInteractions.filter(interaction => interaction.status === 'Reached Out').length
    const latestRepeat = latestTotalVisits - latestIndividualVisits

    // Get total visits count from interactions
    const { count: totalVisitsEver, error: visitsError } = await supabaseServer
      .from('domestic_clients_interaction')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .ilike('contact_mode', 'visit')

    if (visitsError) {
      console.error('Total visits count error:', visitsError)
    }

    // Get projection counts from latest interactions
    const projections = {}
    const projectionTypes = ["WP > 50", "WP < 50", "MP > 50", "MP < 50"]
    const projectionKeys = ["wpGreater50", "wpLess50", "mpGreater50", "mpLess50"]

    for (let i = 0; i < projectionTypes.length; i++) {
      const count = Array.from(latestProjections.values()).filter(proj => proj === projectionTypes[i]).length
      projections[projectionKeys[i]] = count
    }

    // Get clients with activity on the latest DWR date
    let recentLeads
    if (from && to) {
      // Sum for date range
      const { data: rangeLeads, error: rangeError } = await supabaseServer
        .from('domestic_clients')
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
        .from('domestic_clients')
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
        date: latestContactDate ? new Date(latestContactDate).toLocaleDateString('en-GB') : new Date().toLocaleDateString('en-GB'), // DD/MM/YYYY format
        total: latestTotalVisits,
        individual: latestIndividualVisits,
        repeat: latestRepeat,
        interested: latestInterested,
        notInterested: latestNotInterested,
        reachedOut: latestReachedOut,
        onboarded: latestOnboarded
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