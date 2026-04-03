import { supabaseServer } from '@/lib/supabase-server'
import { NextResponse } from 'next/server'

export async function POST(request) {
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

    const body = await request.json()
    const { from, to } = body

    const today = new Date().toISOString().split('T')[0]
    const currentMonth = new Date().getMonth() + 1
    const currentYear = new Date().getFullYear()
    const startDate = `${currentYear}-${String(currentMonth).padStart(2, '0')}-01`
    const monthEnd = `${currentYear}-${String(currentMonth).padStart(2, '0')}-${new Date(currentYear, currentMonth, 0).getDate()}`

    const { data: team, error: teamError } = await supabaseServer
      .from('users')
      .select('user_id, name')
      .contains('role', ['FSE'])
      .eq('manager_id', user.id)

    if (teamError) {
      console.error('Team fetch error:', teamError)
    }

    const fseIds = team?.map(fse => fse.user_id) || []
    
    if (fseIds.length === 0) {
      return NextResponse.json({
        success: true,
        data: {
          totalClients: 0,
          totalOnboarded: 0,
          totalOnboardCall: 0,
          totalOnboardVisit: 0,
          totalNeverVisited: 0,
          noStatus: 0,
          duplicate: 0,
          totalVisits: 0,
          projections: { wpGreater50: 0, wpLess50: 0, mpGreater50: 0, mpLess50: 0 },
          monthlyStats: { month: new Date().toLocaleString('en-US', { month: 'long', year: 'numeric' }).toUpperCase(), totalVisits: 0, individualVisits: 0, totalOnboarded: 0, mtdMp: "0/12", avg: "0.00" },
          latestActivity: { date: today, total: 0, totalVisits: 0, calls: 0, individual: 0, repeat: 0, interested: 0, notInterested: 0, reachedOut: 0, onboarded: 0 },
          latestLeads: [],
          fseList: []
        }
      })
    }

    const queryStartDate = from || startDate
    const queryEndDate = to || monthEnd

    const allInteractions = []
    let offset = 0
    const batchSize = 1000
    let fetchError = null

    while (true) {
      const { data, error } = await supabaseServer
        .from('domestic_clients_interaction')
        .select('client_id, status, sub_status, contact_date, created_at, contact_mode, user_id')
        .in('user_id', fseIds)
        .gte('contact_date', queryStartDate)
        .lte('contact_date', queryEndDate)
        .order('client_id', { ascending: true })
        .order('contact_date', { ascending: false })
        .order('created_at', { ascending: false })
        .range(offset, offset + batchSize - 1)

      if (error) {
        fetchError = error
        break
      }

      if (!data || data.length === 0) break

      allInteractions.push(...data)
      offset += batchSize

      if (data.length < batchSize) break
    }

    if (fetchError) {
      console.error('Interactions fetch error:', fetchError)
    }

    const monthlyLatestStatuses = new Map()
    allInteractions?.forEach(interaction => {
      const key = `${interaction.user_id}_${interaction.client_id}`
      if (!monthlyLatestStatuses.has(key)) {
        monthlyLatestStatuses.set(key, {
          userId: interaction.user_id,
          status: interaction.status,
          contactMode: interaction.contact_mode
        })
      }
    })

    let monthlyTotalVisits = 0
    let monthlyIndividualVisits = 0
    let monthlyOnboarded = 0

    const visitClients = new Set()
    const onboardClients = new Set()

    allInteractions?.forEach(interaction => {
      const key = `${interaction.user_id}_${interaction.client_id}`
      const latestData = monthlyLatestStatuses.get(key)
      
      if (latestData && latestData.contactMode?.toLowerCase() === 'visit') {
        visitClients.add(`${interaction.user_id}_${interaction.client_id}`)
      }
      if (latestData && latestData.status === 'Onboarded') {
        onboardClients.add(`${interaction.user_id}_${interaction.client_id}`)
      }
    })

    monthlyTotalVisits = visitClients.size
    monthlyOnboarded = onboardClients.size

    const { count: individualCount, error: individualError } = await supabaseServer
      .from('domestic_clients')
      .select('*', { count: 'exact', head: true })
      .in('user_id', fseIds)
      .gte('sourcing_date', startDate)
      .lte('sourcing_date', monthEnd)

    if (individualError) {
      console.error('Individual visits error:', individualError)
    }

    monthlyIndividualVisits = individualCount || 0

    const { count: visitsTillNowCount, error: visitsTillError } = await supabaseServer
      .from('domestic_clients_interaction')
      .select('*', { count: 'exact', head: true })
      .in('user_id', fseIds)
      .gte('contact_date', startDate)
      .lte('contact_date', today)
      .ilike('contact_mode', 'visit')

    if (visitsTillError) {
      console.error('Visits till now error:', visitsTillError)
    }

    const totalVisits = visitsTillNowCount || 0

    const start = new Date(startDate)
    const end = new Date(today)
    let workingDays = 0
    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      if (d.getDay() !== 0) {
        workingDays++
      }
    }

    const monthlyAvg = workingDays > 0 ? (totalVisits / workingDays).toFixed(2) : '0.00'

    const latestContactDate = allInteractions?.reduce((max, interaction) => interaction.contact_date > max ? interaction.contact_date : max, '') || today

    let latestActivityDate = latestContactDate
    let latestTotalVisits = 0
    let latestIndividualVisits = 0
    let latestOnboarded = 0
    let latestCalls = 0
    let latestInterested = 0
    let latestNotInterested = 0
    let latestReachedOut = 0
    let latestRepeat = 0
    let latestLeadsData = []

    if (from && to) {
      const rangeInteractions = allInteractions?.filter(i => i.contact_date >= from && i.contact_date <= to) || []
      latestActivityDate = to

      const rangeLatestByClient = new Map()
      rangeInteractions.forEach(interaction => {
        const key = `${interaction.user_id}_${interaction.client_id}`
        if (!rangeLatestByClient.has(key)) {
          rangeLatestByClient.set(key, interaction)
        }
      })

      const rangeVisitClients = new Set()
      const rangeCallClients = new Set()
      const rangeOnboardClients = new Set()
      const rangeStatuses = []

      ;[...rangeLatestByClient.values()].forEach(i => {
        if (i.contact_mode?.toLowerCase() === 'visit') {
          rangeVisitClients.add(`${i.user_id}_${i.client_id}`)
        }
        if (i.contact_mode?.toLowerCase() === 'call') {
          rangeCallClients.add(`${i.user_id}_${i.client_id}`)
        }
        if (i.status === 'Onboarded') {
          rangeOnboardClients.add(`${i.user_id}_${i.client_id}`)
        }
        rangeStatuses.push(i.status)
      })

      latestTotalVisits = rangeVisitClients.size
      latestCalls = rangeCallClients.size
      latestOnboarded = rangeOnboardClients.size
      latestInterested = rangeStatuses.filter(s => s === 'Interested').length
      latestNotInterested = rangeStatuses.filter(s => s === 'Not Interested').length
      latestReachedOut = rangeStatuses.filter(s => s === 'Reached Out').length

      const { count: rangeIndividualCount, error: rangeIndividualError } = await supabaseServer
        .from('domestic_clients')
        .select('*', { count: 'exact', head: true })
        .in('user_id', fseIds)
        .gte('sourcing_date', from)
        .lte('sourcing_date', to)

      if (rangeIndividualError) {
        console.error('Range individual error:', rangeIndividualError)
      }

      latestIndividualVisits = rangeIndividualCount || 0
      latestRepeat = (latestTotalVisits + latestCalls) - latestIndividualVisits

      const rangeClientIds = [...rangeLatestByClient.keys()]
      const clientIdList = [...new Set(rangeInteractions.map(i => i.client_id))]
      
      if (clientIdList.length > 0) {
        const { data: clientsData, error: clientsError } = await supabaseServer
          .from('domestic_clients')
          .select('client_id, company_name')
          .in('client_id', clientIdList)

        const fseUserIds = [...new Set([...rangeLatestByClient.values()].map(i => i.user_id))]
        const { data: fseUsersData, error: fseUsersError } = await supabaseServer
          .from('users')
          .select('user_id, name')
          .in('user_id', fseUserIds)

        if (!clientsError && clientsData) {
          const clientMap = new Map(clientsData.map(c => [c.client_id, c.company_name]))
          const fseNameMap = new Map(fseUsersData?.map(u => [u.user_id, u.name]) || [])
          latestLeadsData = [...rangeLatestByClient.values()].map((i, idx) => ({
            sn: idx + 1,
            date: i.contact_date,
            name: clientMap.get(i.client_id) || 'Unknown',
            agent: fseNameMap.get(i.user_id) || 'Unknown',
            status: i.status,
            sub: i.sub_status || '-',
            color: getStatusColor(i.status)
          }))
        }
      }
    } else {
      const latestInteractionsForDate = allInteractions?.filter(i => i.contact_date === latestContactDate) || []

      const latestByClient = new Map()
      latestInteractionsForDate.forEach(interaction => {
        const key = `${interaction.user_id}_${interaction.client_id}`
        if (!latestByClient.has(key)) {
          latestByClient.set(key, interaction)
        }
      })

      const visitClients = new Set()
      const callClients = new Set()
      const statuses = []

      ;[...latestByClient.values()].forEach(i => {
        if (i.contact_mode?.toLowerCase() === 'visit') {
          visitClients.add(`${i.user_id}_${i.client_id}`)
        }
        if (i.contact_mode?.toLowerCase() === 'call') {
          callClients.add(`${i.user_id}_${i.client_id}`)
        }
        statuses.push(i.status)
      })

      latestTotalVisits = visitClients.size
      latestCalls = callClients.size
      latestOnboarded = statuses.filter(s => s === 'Onboarded').length
      latestInterested = statuses.filter(s => s === 'Interested').length
      latestNotInterested = statuses.filter(s => s === 'Not Interested').length
      latestReachedOut = statuses.filter(s => s === 'Reached Out').length

      const { count: individualCount, error: individualError } = await supabaseServer
        .from('domestic_clients')
        .select('*', { count: 'exact', head: true })
        .in('user_id', fseIds)
        .eq('sourcing_date', latestContactDate)

      if (individualError) {
        console.error('Latest individual error:', individualError)
      }

      latestIndividualVisits = individualCount || 0
      latestRepeat = (latestTotalVisits + latestCalls) - latestIndividualVisits

      const clientIdList = [...new Set(latestInteractionsForDate.map(i => i.client_id))]

      if (clientIdList.length > 0) {
        const { data: clientsData, error: clientsError } = await supabaseServer
          .from('domestic_clients')
          .select('client_id, company_name')
          .in('client_id', clientIdList)

        const fseUserIdList = [...new Set(latestInteractionsForDate.map(i => i.user_id))]
        const { data: fseUsersData, error: fseUsersError } = await supabaseServer
          .from('users')
          .select('user_id, name')
          .in('user_id', fseUserIdList)

        if (!clientsError && clientsData) {
          const clientMap = new Map(clientsData.map(c => [c.client_id, c.company_name]))
          const fseNameMap = new Map(fseUsersData?.map(u => [u.user_id, u.name]) || [])
          latestLeadsData = [...latestByClient.values()].map((i, idx) => ({
            sn: idx + 1,
            date: i.contact_date,
            name: clientMap.get(i.client_id) || 'Unknown',
            agent: fseNameMap.get(i.user_id) || 'Unknown',
            status: i.status,
            sub: i.sub_status || '-',
            color: getStatusColor(i.status)
          }))
        }
      }
    }

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

    let allClients = []
    let clientOffset = 0
    const clientBatchSize = 1000

    while (true) {
      const { data, error } = await supabaseServer
        .from('domestic_clients')
        .select('projection, user_id')
        .in('user_id', fseIds)
        .range(clientOffset, clientOffset + clientBatchSize - 1)

      if (error) {
        console.error('Clients fetch error:', error)
        break
      }

      if (!data || data.length === 0) break

      allClients.push(...data)
      clientOffset += clientBatchSize

      if (data.length < clientBatchSize) break
    }

    const projections = {
      wpGreater50: 0,
      wpLess50: 0,
      mpGreater50: 0,
      mpLess50: 0
    }

    const projectionTypes = {
      "WP > 50": "wpGreater50",
      "WP < 50": "wpLess50",
      "MP > 50": "mpGreater50",
      "MP < 50": "mpLess50"
    }

    allClients?.forEach(client => {
      const key = projectionTypes[client.projection]
      if (key) {
        projections[key]++
      }
    })

    let totalClients = 0
    let totalOnboarded = 0
    let totalNeverVisited = 0

    const { count: totalClientsCount, error: totalClientsError } = await supabaseServer
      .from('domestic_clients')
      .select('*', { count: 'exact', head: true })
      .in('user_id', fseIds)

    if (totalClientsError) {
      console.error('Total clients error:', totalClientsError)
    }

    totalClients = totalClientsCount || 0

    const allInteractionsEver = []
    let everOffset = 0

    while (true) {
      const { data, error } = await supabaseServer
        .from('domestic_clients_interaction')
        .select('client_id, status, contact_mode, user_id')
        .in('user_id', fseIds)
        .order('client_id', { ascending: true })
        .order('contact_date', { ascending: false })
        .order('created_at', { ascending: false })
        .range(everOffset, everOffset + batchSize - 1)

      if (error) {
        console.error('All interactions error:', error)
        break
      }

      if (!data || data.length === 0) break

      allInteractionsEver.push(...data)
      everOffset += batchSize

      if (data.length < batchSize) break
    }

    const latestClientData = new Map()
    allInteractionsEver?.forEach(interaction => {
      const key = `${interaction.user_id}_${interaction.client_id}`
      if (!latestClientData.has(key)) {
        latestClientData.set(key, {
          userId: interaction.user_id,
          status: interaction.status,
          contactMode: interaction.contact_mode
        })
      }
    })

    totalOnboarded = [...latestClientData.values()].filter(d => d.status === 'Onboarded').length

    const interactionsByClient = {}
    const clientsWithInteractions = new Set()

    allInteractionsEver?.forEach(interaction => {
      const key = `${interaction.user_id}_${interaction.client_id}`
      clientsWithInteractions.add(key)
      
      if (!interactionsByClient[key]) {
        interactionsByClient[key] = []
      }
      interactionsByClient[key].push(interaction)
    })

    let neverVisited = 0

    Object.entries(interactionsByClient).forEach(([key, interactions]) => {
      const hasVisit = interactions.some(i => i.contact_mode?.toLowerCase() === 'visit')
      if (!hasVisit) {
        neverVisited++
      }
    })

    neverVisited += (totalClients || 0) - clientsWithInteractions.size
    totalNeverVisited = neverVisited

    let totalVisitsEver = 0
    let visitOffset = 0

    while (true) {
      const { data, error } = await supabaseServer
        .from('domestic_clients_interaction')
        .select('client_id, user_id')
        .in('user_id', fseIds)
        .ilike('contact_mode', 'visit')
        .range(visitOffset, visitOffset + batchSize - 1)

      if (error) {
        console.error('Total visits error:', error)
        break
      }

      if (!data || data.length === 0) break

      const uniqueClients = new Set(data.map(i => `${i.user_id}_${i.client_id}`))
      totalVisitsEver += uniqueClients.size
      visitOffset += batchSize

      if (data.length < batchSize) break
    }

    const dashboardData = {
      totalClients: totalClients || 0,
      totalOnboarded: totalOnboarded || 0,
      totalOnboardCall: 0,
      totalOnboardVisit: 0,
      totalNeverVisited: totalNeverVisited || 0,
      noStatus: 0,
      duplicate: 0,
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
        date: latestActivityDate ? new Date(latestActivityDate).toLocaleDateString('en-GB') : new Date().toLocaleDateString('en-GB'),
        total: latestTotalVisits,
        totalVisits: latestTotalVisits,
        calls: latestCalls,
        individual: latestIndividualVisits,
        repeat: latestRepeat,
        interested: latestInterested,
        notInterested: latestNotInterested,
        reachedOut: latestReachedOut,
        onboarded: latestOnboarded
      },
      latestLeads: latestLeadsData,
      fseList: team?.map(fse => fse.user_id) || []
    }

    return NextResponse.json({
      success: true,
      data: dashboardData
    })

  } catch (error) {
    console.error('Manager Dashboard API error:', error)
    return NextResponse.json({
      error: 'Internal server error',
      details: error.message
    }, { status: 500 })
  }
}