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

    // Get monthly visits from interactions (convert contact_mode to lowercase first)
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

    // Calculate monthly avg: total visits till today / working days till today (excluding Sundays)
    const { count: totalVisitsTillNow, error: visitsTillError } = await supabaseServer
      .from('domestic_clients_interaction')
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
        .select('client_id, status, contact_date, created_at, contact_mode')
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

    // Process to get latest status per client along with contact_mode
    const latestClientData = new Map()
    allInteractions?.forEach(interaction => {
      if (!latestClientData.has(interaction.client_id)) {
        latestClientData.set(interaction.client_id, {
          status: interaction.status,
          contactMode: interaction.contact_mode
        })
      }
    })

    const totalOnboarded = Array.from(latestClientData.values())
      .filter(d => d.status === 'Onboarded').length

    // Count onboarded by contact mode (visit vs call)
    const onboardVisit = Array.from(latestClientData.values())
      .filter(d => d.status === 'Onboarded' && d.contactMode?.toLowerCase() === 'visit').length

    const onboardCall = Array.from(latestClientData.values())
      .filter(d => d.status === 'Onboarded' && d.contactMode?.toLowerCase() === 'call').length

    // Count clients with no status (empty/null status)
    const noStatus = Array.from(latestClientData.values())
      .filter(d => !d.status || d.status === '' || d.status === null).length

    // Get unique client IDs that have at least 1 interaction
    // NEW LOGIC: Clients with NO interactions OR have interactions but NO 'visit' mode in any interaction
    const clientsWithInteractions = new Set(allInteractions?.map(i => i.client_id) || [])
    
    // Group interactions by client_id and check if any interaction has 'visit' mode
    const interactionsByClient = {}
    allInteractions?.forEach(interaction => {
      if (!interactionsByClient[interaction.client_id]) {
        interactionsByClient[interaction.client_id] = []
      }
      interactionsByClient[interaction.client_id].push(interaction)
    })
    
    // Count clients who have NO interactions OR have interactions but NO 'visit' mode in any interaction
    let neverVisited = 0
    
    // Add clients with NO interactions at all
    neverVisited += (totalClients || 0) - clientsWithInteractions.size
    
    // Add clients with interactions but NO 'visit' mode in any interaction
    Object.entries(interactionsByClient).forEach(([clientId, interactions]) => {
      const hasVisit = interactions.some(int => int.contact_mode?.toLowerCase() === 'visit')
      if (!hasVisit) {
        neverVisited++
      }
    })

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
    let latestCalls = 0

    if (from && to) {
      // For range, calculate totals for the range - Count UNIQUE clients with visit mode
      const rangeInteractions = allInteractions?.filter(interaction => interaction.contact_date >= from && interaction.contact_date <= to) || []
      latestActivityDate = to // Use the end date as the display date
      // Get unique client_ids from visit interactions in the range
      const rangeVisitClientIds = new Set(
        rangeInteractions
          .filter(i => i.contact_mode?.toLowerCase() === 'visit')
          .map(i => i.client_id)
      )
      latestTotalVisits = rangeVisitClientIds.size
      
      // Get unique client_ids from call interactions in the range
      const rangeCallClientIds = new Set(
        rangeInteractions
          .filter(i => i.contact_mode?.toLowerCase() === 'call')
          .map(i => i.client_id)
      )
      latestCalls = rangeCallClientIds.size
      // Individual: clients sourced within the range
      const { count: rangeIndividualCount, error: rangeIndividualError } = await supabaseServer
        .from('domestic_clients')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .gte('sourcing_date', from)
        .lte('sourcing_date', to)

      if (rangeIndividualError) {
        console.error('Range individual error:', rangeIndividualError)
      }

      latestIndividualVisits = rangeIndividualCount || 0

      // Count unique clients per status - Use LATEST status per client
      // Sort interactions by date and time to get latest first
      const sortedRangeInteractions = rangeInteractions.sort((a, b) => {
        // Sort by created_at descending (latest first)
        return new Date(b.created_at) - new Date(a.created_at);
      });
      
      const rangeStatusMap = new Map()
      sortedRangeInteractions.forEach(interaction => {
        // Keep the first (latest) status for each client
        if (!rangeStatusMap.has(interaction.client_id)) {
          rangeStatusMap.set(interaction.client_id, interaction.status)
        }
      })
      const rangeStatuses = Array.from(rangeStatusMap.values())
      latestOnboarded = rangeStatuses.filter(status => status === 'Onboarded').length
      latestInterested = rangeStatuses.filter(status => status === 'Interested').length
      latestNotInterested = rangeStatuses.filter(status => status === 'Not Interested').length
      latestReachedOut = rangeStatuses.filter(status => status === 'Reached Out').length
      latestRepeat = (latestTotalVisits + latestCalls) - latestIndividualVisits
    } else {
      // For latest date - Count UNIQUE clients with visit mode per date
      const latestDateInteractions = allInteractions?.filter(interaction => interaction.contact_date === latestContactDate) || []
      // Get unique client_ids from visit interactions
      const latestVisitClientIds = new Set(
        latestDateInteractions
          .filter(i => i.contact_mode?.toLowerCase() === 'visit')
          .map(i => i.client_id)
      )
      latestTotalVisits = latestVisitClientIds.size
      
      // Get unique client_ids from call interactions
      const latestCallClientIds = new Set(
        latestDateInteractions
          .filter(i => i.contact_mode?.toLowerCase() === 'call')
          .map(i => i.client_id)
      )
      latestCalls = latestCallClientIds.size
      const { count: latestIndividualCount, error: latestIndividualError } = await supabaseServer
        .from('domestic_clients')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('sourcing_date', latestContactDate)

      if (latestIndividualError) {
        console.error('Latest individual error:', latestIndividualError)
      }

      latestIndividualVisits = latestIndividualCount || 0

      // Count unique clients per status - Use LATEST status per client
      // Sort interactions by date and time to get latest first
      const sortedLatestDateInteractions = latestDateInteractions.sort((a, b) => {
        return new Date(b.created_at) - new Date(a.created_at);
      });
      
      const latestStatusMap = new Map()
      sortedLatestDateInteractions.forEach(interaction => {
        // Keep the first (latest) status for each client
        if (!latestStatusMap.has(interaction.client_id)) {
          latestStatusMap.set(interaction.client_id, interaction.status)
        }
      })
      const latestStatuses = Array.from(latestStatusMap.values())
      latestOnboarded = latestStatuses.filter(status => status === 'Onboarded').length
      latestInterested = latestStatuses.filter(status => status === 'Interested').length
      latestNotInterested = latestStatuses.filter(status => status === 'Not Interested').length
      latestReachedOut = latestStatuses.filter(status => status === 'Reached Out').length
      latestRepeat = (latestTotalVisits + latestCalls) - latestIndividualVisits
    }

    // Format: visits/calls (e.g., "10/5")
    const latestTotalVisitsCalls = `${latestTotalVisits}/${latestCalls}`

    // Get total visits count - count UNIQUE clients with at least 1 visit
    // First get all interactions with contact_mode = 'visit' (case-insensitive)
    let visitInteractions = []
    let visitOffset = 0
    const visitBatchSize = 1000
    let visitsError = null

    while (true) {
      const { data, error } = await supabaseServer
        .from('domestic_clients_interaction')
        .select('client_id')
        .eq('user_id', user.id)
        .ilike('contact_mode', 'visit')
        .range(visitOffset, visitOffset + visitBatchSize - 1)

      if (error) {
        visitsError = error
        break
      }

      if (!data || data.length === 0) break

      visitInteractions.push(...data)
      visitOffset += visitBatchSize

      if (data.length < visitBatchSize) break
    }

    if (visitsError) {
      console.error('Total visits count error:', visitsError)
    }

    // Count unique client_ids from visit interactions
    const totalVisitsEver = new Set(visitInteractions.map(i => i.client_id)).size

    // Get projection counts from domestic_clients
    const { data: clientsData, error: clientsError } = await supabaseServer
      .from('domestic_clients')
      .select('projection')
      .eq('user_id', user.id)

    if (clientsError) {
      console.error('Clients projection error:', clientsError)
    }

    const projections = {}
    const projectionTypes = ["WP > 50", "WP < 50", "MP > 50", "MP < 50"]
    const projectionKeys = ["wpGreater50", "wpLess50", "mpGreater50", "mpLess50"]

    for (let i = 0; i < projectionTypes.length; i++) {
      const count = clientsData?.filter(client => client.projection === projectionTypes[i]).length || 0
      projections[projectionKeys[i]] = count
    }

    // Count duplicates using SQL-like logic (LOWER(TRIM(company_name)))
    const { data: allClients, error: allClientsError } = await supabaseServer
      .from('domestic_clients')
      .select('client_id, company_name')
      .eq('user_id', user.id)

    if (allClientsError) {
      console.error('All clients error:', allClientsError)
    }

    // Group clients by lowercase trimmed company_name to find duplicates
    const companyGroups = {}
    allClients?.forEach(client => {
      const lowerTrimmedName = client.company_name?.toLowerCase().trim() || ''
      if (lowerTrimmedName && lowerTrimmedName !== '') {
        if (!companyGroups[lowerTrimmedName]) {
          companyGroups[lowerTrimmedName] = []
        }
        companyGroups[lowerTrimmedName].push(client.client_id)
      }
    })

    // Count duplicates (companies that appear more than once)
    const duplicateCountManual = Object.values(companyGroups)
      .filter(group => group.length > 1)
      .reduce((sum, group) => sum + group.length, 0)

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
      onboardCall: onboardCall || 0,
      onboardVisit: onboardVisit || 0,
      neverVisited: neverVisited || 0,
      noStatus: noStatus || 0,
      duplicate: duplicateCountManual || 0,
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
        totalVisitsCalls: latestTotalVisitsCalls,
        calls: latestCalls,
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