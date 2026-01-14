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

    // Get counts for latest activity date or range
    let latestActivityDate = latestContactDate
    let latestTotalVisits = 0
    let latestIndividualVisits = 0
    let latestOnboarded = 0
    let latestInterested = 0
    let latestNotInterested = 0
    let latestReachedOut = 0
    let latestRepeat = 0

    if (from && to) {
      // For range, calculate totals for the range
      const rangeInteractions = allInteractions?.filter(interaction => interaction.contact_date >= from && interaction.contact_date <= to) || []
      latestActivityDate = to // Use the end date as the display date
      latestTotalVisits = rangeInteractions.length
      const uniqueClientsInRange = new Set(rangeInteractions.map(i => i.client_id))
      latestIndividualVisits = uniqueClientsInRange.size
      latestOnboarded = rangeInteractions.filter(interaction => interaction.status === 'Onboarded').length
      latestInterested = rangeInteractions.filter(interaction => interaction.status === 'Interested').length
      latestNotInterested = rangeInteractions.filter(interaction => interaction.status === 'Not Interested').length
      latestReachedOut = rangeInteractions.filter(interaction => interaction.status === 'Reached Out').length
      latestRepeat = latestTotalVisits - latestIndividualVisits
    } else {
      // For latest date
      const latestDateInteractions = allInteractions?.filter(interaction => interaction.contact_date === latestContactDate) || []
      latestTotalVisits = latestDateInteractions.length
      const { count: latestIndividualCount, error: latestIndividualError } = await supabaseServer
        .from('domestic_clients')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('sourcing_date', latestContactDate)

      if (latestIndividualError) {
        console.error('Latest individual error:', latestIndividualError)
      }

      latestIndividualVisits = latestIndividualCount || 0
      latestOnboarded = latestDateInteractions.filter(interaction => interaction.status === 'Onboarded').length
      latestInterested = latestDateInteractions.filter(interaction => interaction.status === 'Interested').length
      latestNotInterested = latestDateInteractions.filter(interaction => interaction.status === 'Not Interested').length
      latestReachedOut = latestDateInteractions.filter(interaction => interaction.status === 'Reached Out').length
      latestRepeat = latestTotalVisits - latestIndividualVisits
    }

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

    // Get clients with interactions on the latest date
    let recentLeads
    if (from && to) {
      // For date range, get all interactions in range
      const { data: rangeInteractions, error: rangeError } = await supabaseServer
        .from('domestic_clients_interaction')
        .select('client_id, status, sub_status, contact_date, created_at')
        .eq('user_id', user.id)
        .gte('contact_date', from)
        .lte('contact_date', to)
        .order('contact_date', { ascending: false })
        .order('created_at', { ascending: false })

      if (rangeError) {
        console.error('Range interactions error:', rangeError)
      }

      const clientIds = [...new Set(rangeInteractions?.map(i => i.client_id) || [])]

      // Fetch client names
      const { data: clients, error: clientsError } = await supabaseServer
        .from('domestic_clients')
        .select('client_id, company_name')
        .in('client_id', clientIds)

      if (clientsError) {
        console.error('Clients fetch error:', clientsError)
      }

      const clientMapById = new Map(clients?.map(c => [c.client_id, c.company_name]) || [])
      recentLeads = rangeInteractions?.map(i => ({ ...i, company: clientMapById.get(i.client_id) || 'Unknown' })) || []
    } else {
      // For latest date, get interactions on latestContactDate
      const { data: dateInteractions, error: dateError } = await supabaseServer
        .from('domestic_clients_interaction')
        .select('client_id, status, sub_status, contact_date, created_at')
        .eq('user_id', user.id)
        .eq('contact_date', latestContactDate)
        .order('created_at', { ascending: false })

      if (dateError) {
        console.error('Date interactions error:', dateError)
      }

      // Group by client_id, take latest interaction per client
      const clientMap = new Map()
      dateInteractions?.forEach(interaction => {
        if (!clientMap.has(interaction.client_id)) {
          clientMap.set(interaction.client_id, interaction)
        }
      })
      const uniqueInteractions = Array.from(clientMap.values())
      const clientIds = uniqueInteractions.map(i => i.client_id)

      // Fetch client names
      const { data: clients, error: clientsError } = await supabaseServer
        .from('domestic_clients')
        .select('client_id, company_name')
        .in('client_id', clientIds)

      if (clientsError) {
        console.error('Clients fetch error:', clientsError)
      }

      const clientMapById = new Map(clients?.map(c => [c.client_id, c.company_name]) || [])
      recentLeads = uniqueInteractions.map(i => ({ ...i, company: clientMapById.get(i.client_id) || 'Unknown' }))
    }

    // Format recent leads for UI
    const formattedLeads = recentLeads?.map((interaction, index) => ({
      sn: index + 1,
      date: interaction.contact_date,
      name: interaction.company,
      status: interaction.status,
      sub: interaction.sub_status || '-',
      color: getStatusColor(interaction.status)
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