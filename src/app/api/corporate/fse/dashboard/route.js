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

    // Get monthly visits from interactions
    const { count: monthlyTotalVisitsCount, error: monthlyVisitsError } = await supabaseServer
      .from('corporate_clients_interaction')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .gte('contact_date', startDate)
      .lte('contact_date', `${currentYear}-${String(currentMonth).padStart(2, '0')}-${new Date(currentYear, currentMonth, 0).getDate()}`)
      .ilike('contact_mode', 'visit')

    if (monthlyVisitsError) {
      console.error('Monthly visits error:', monthlyVisitsError)
    }

    const monthlyTotalVisits = monthlyTotalVisitsCount || 0

    // Get monthly individual visits from corporate_clients
    const { count: monthlyIndividualVisitsCount, error: monthlyIndividualError } = await supabaseServer
      .from('corporate_clients')
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
        .from('corporate_clients_interaction')
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

    // Calculate monthly avg: total visits till today / working days till today (excluding Sundays)
    const { count: totalVisitsTillNow, error: visitsTillError } = await supabaseServer
      .from('corporate_clients_interaction')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .gte('contact_date', startDate)
      .lte('contact_date', today)
      .ilike('contact_mode', 'visit')

    if (visitsTillError) {
      console.error('Visits till now error:', visitsTillError)
    }

    const totalVisits = totalVisitsTillNow || 0

    // Calculate working days from startDate to today, excluding Sundays
    const start = new Date(startDate)
    const end = new Date(today)
    let workingDays = 0
    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      if (d.getDay() !== 0) { // 0 is Sunday
        workingDays++
      }
    }

    const monthlyAvg = workingDays > 0 ? (totalVisits / workingDays).toFixed(2) : '0.00'

    // Get total clients count
    const { count: totalClients, error: countError } = await supabaseServer
      .from('corporate_clients')
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
        .from('corporate_clients_interaction')
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
      // Individual: clients sourced within the range
      const { count: rangeIndividualCount, error: rangeIndividualError } = await supabaseServer
        .from('corporate_clients')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .gte('sourcing_date', from)
        .lte('sourcing_date', to)

      if (rangeIndividualError) {
        console.error('Range individual error:', rangeIndividualError)
      }

      latestIndividualVisits = rangeIndividualCount || 0

      // Count unique clients per status
      const rangeStatusMap = new Map()
      rangeInteractions.forEach(interaction => {
        if (!rangeStatusMap.has(interaction.client_id)) {
          rangeStatusMap.set(interaction.client_id, interaction.status)
        }
      })
      const rangeStatuses = Array.from(rangeStatusMap.values())
      latestOnboarded = rangeStatuses.filter(status => status === 'Onboarded').length
      latestInterested = rangeStatuses.filter(status => status === 'Interested').length
      latestNotInterested = rangeStatuses.filter(status => status === 'Not Interested').length
      latestReachedOut = rangeStatuses.filter(status => status === 'Reached Out').length
      latestRepeat = latestTotalVisits - latestIndividualVisits
    } else {
      // For latest date
      const latestDateInteractions = allInteractions?.filter(interaction => interaction.contact_date === latestContactDate) || []
      latestTotalVisits = latestDateInteractions.length
      const { count: latestIndividualCount, error: latestIndividualError } = await supabaseServer
        .from('corporate_clients')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('sourcing_date', latestContactDate)

      if (latestIndividualError) {
        console.error('Latest individual error:', latestIndividualError)
      }

      latestIndividualVisits = latestIndividualCount || 0

      // Count unique clients per status
      const latestStatusMap = new Map()
      latestDateInteractions.forEach(interaction => {
        if (!latestStatusMap.has(interaction.client_id)) {
          latestStatusMap.set(interaction.client_id, interaction.status)
        }
      })
      const latestStatuses = Array.from(latestStatusMap.values())
      latestOnboarded = latestStatuses.filter(status => status === 'Onboarded').length
      latestInterested = latestStatuses.filter(status => status === 'Interested').length
      latestNotInterested = latestStatuses.filter(status => status === 'Not Interested').length
      latestReachedOut = latestStatuses.filter(status => status === 'Reached Out').length
      latestRepeat = latestTotalVisits - latestIndividualVisits
    }

    // Calculate latest activity from interactions data instead of DWR
    let displayDwr;
    if (from && to) {
      // For date range, calculate from filtered interactions
      const rangeInteractions = allInteractions?.filter(interaction => interaction.contact_date >= from && interaction.contact_date <= to) || []
      const uniqueClientsInRange = new Map()

      rangeInteractions.forEach(int => {
        if (!uniqueClientsInRange.has(int.client_id)) {
          uniqueClientsInRange.set(int.client_id, int)
        }
      })

      const rangeStatuses = Array.from(uniqueClientsInRange.values())

      displayDwr = {
        dwr_date: to,
        total_visit: rangeInteractions.length,
        individual: rangeStatuses.length,
        repeat: rangeInteractions.length - rangeStatuses.length,
        interested: rangeStatuses.filter(s => s.status === 'Interested').length,
        not_interested: rangeStatuses.filter(s => s.status === 'Not Interested').length,
        reached_out: rangeStatuses.filter(s => s.status === 'Reached Out').length,
        onboarded: rangeStatuses.filter(s => s.status === 'Onboarded').length,
        avg_visit: 0
      }
    } else {
      // For latest date, use the already calculated latestActivityDate data
      displayDwr = {
        dwr_date: latestContactDate,
        total_visit: latestTotalVisits,
        individual: latestIndividualVisits,
        repeat: latestRepeat,
        interested: latestInterested,
        not_interested: latestNotInterested,
        reached_out: latestReachedOut,
        onboarded: latestOnboarded,
        avg_visit: 0
      }
    }

    // Get total visits count from interactions
    const { count: totalVisitsEver, error: visitsError } = await supabaseServer
      .from('corporate_clients_interaction')
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
        .from('corporate_clients_interaction')
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
        .from('corporate_clients')
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
        .from('corporate_clients_interaction')
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
        .from('corporate_clients')
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
        avg: monthlyAvg
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