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

    // Get filter parameter
    const { searchParams } = new URL(request.url)
    const filter = searchParams.get('filter') || 'all'

    // Get the most recent date from corporate_leads_interaction table (date column)
    // Fetch only dates that are NOT today, ordered by descending, limit 1
    const today = new Date().toISOString().split('T')[0]
    
    // Get yesterday's date as fallback
    const yesterday = new Date()
    yesterday.setDate(yesterday.getDate() - 1)
    const yesterdayStr = yesterday.toISOString().split('T')[0]
    
    const { data: latestDateData, error: latestDateError } = await supabaseServer
      .from('corporate_leads_interaction')
      .select('date')
      .not('date', 'is', null)
      .neq('date', today)  // Exclude today's date
      .order('date', { ascending: false })
      .limit(1)
      .single()

    console.log('Latest date query result:', latestDateData, 'error:', latestDateError)

    let lastWorkingDayStr = yesterdayStr // Default fallback
    if (latestDateData && latestDateData.date) {
      lastWorkingDayStr = latestDateData.date
      console.log('Using previous date:', lastWorkingDayStr)
    } else if (latestDateError) {
      console.error('Latest date error:', latestDateError)
    }

    console.log('Last working day:', lastWorkingDayStr)

    // Initialize metrics
    let clientSearchTotal = 0
    let clientSearchYesterday = 0
    let startupSearchTotal = 0
    let startupSearchYesterday = 0
    let startupCallingTotal = 0
    let startupCallingYesterday = 0
    let masterUnionClientsTotal = 0
    let masterUnionCallingTotal = 0
    let franchiseDiscussedTotal = 0
    let franchiseDiscussedYesterday = 0
    let formSharedTotal = 0
    let formSharedYesterday = 0
    
    // NEW: Total Client Search (all rows from corporate_leadgen_leads)
    let totalClientSearchNew = 0
    let totalClientSearchYesterdayNew = 0
    
    // NEW: Total Client Calling (all rows from corporate_leads_interaction)
    let totalClientCallingNew = 0
    let totalClientCallingYesterdayNew = 0

    // NEW: New Calls vs Followup Calls logic (similar to corporate/leadgen)
    let newCallsTotal = 0
    let newCallsYesterday = 0
    let followupCallsTotal = 0
    let followupCallsYesterday = 0

    // Get ALL interactions to build the first interaction map
    const { data: allInteractions, error: allInteractionsError } = await supabaseServer
      .from('corporate_leads_interaction')
      .select('id, client_id, leadgen_id, contact_person, created_at')
      .order('created_at', { ascending: true })

    if (allInteractionsError) {
      console.error('All interactions fetch error:', allInteractionsError)
    }

    // Build a map of first interaction for each client_id + contact_person + leadgen_id combination
    const firstInteractionMap = new Map()
    
    ;(allInteractions || []).forEach(interaction => {
      const leadgenId = interaction.leadgen_id
      const clientId = interaction.client_id
      const contactPerson = interaction.contact_person || ''
      const createdAt = interaction.created_at
      const key = `${leadgenId}_${clientId}_${contactPerson}`
      
      if (!firstInteractionMap.has(key)) {
        firstInteractionMap.set(key, createdAt)
      }
    })

    // Get yesterday's interactions for counting new vs followup
    const { data: yesterdayInteractions, error: yesterdayInteractionsError } = await supabaseServer
      .from('corporate_leads_interaction')
      .select('id, client_id, leadgen_id, contact_person, created_at')
      .eq('date', lastWorkingDayStr)
      .order('created_at', { ascending: true })

    if (yesterdayInteractionsError) {
      console.error('Yesterday interactions fetch error:', yesterdayInteractionsError)
    }

    // Classify yesterday's interactions as new or followup
    let yesterdayNewCallsSet = new Set()
    let yesterdayFollowupCallsSet = new Set()
    
    ;(yesterdayInteractions || []).forEach(interaction => {
      const leadgenId = interaction.leadgen_id
      const clientId = interaction.client_id
      const contactPerson = interaction.contact_person || ''
      const createdAt = interaction.created_at
      const key = `${leadgenId}_${clientId}_${contactPerson}`
      
      const firstCreatedAt = firstInteractionMap.get(key)
      const isNewCall = firstCreatedAt === createdAt
      
      // Use unique key for each interaction
      if (isNewCall) {
        yesterdayNewCallsSet.add(`${interaction.id}`)
      } else {
        yesterdayFollowupCallsSet.add(`${interaction.id}`)
      }
    })

    newCallsYesterday = yesterdayNewCallsSet.size
    followupCallsYesterday = yesterdayFollowupCallsSet.size

    // Get total new calls and followup calls (all time)
    const { data: allInteractionsWithDate, error: allInteractionsWithDateError } = await supabaseServer
      .from('corporate_leads_interaction')
      .select('id, client_id, leadgen_id, contact_person, created_at')
      .order('created_at', { ascending: true })

    if (allInteractionsWithDateError) {
      console.error('All interactions with date fetch error:', allInteractionsWithDateError)
    }

    let totalNewCallsSet = new Set()
    let totalFollowupCallsSet = new Set()
    
    ;(allInteractionsWithDate || []).forEach(interaction => {
      const leadgenId = interaction.leadgen_id
      const clientId = interaction.client_id
      const contactPerson = interaction.contact_person || ''
      const createdAt = interaction.created_at
      const key = `${leadgenId}_${clientId}_${contactPerson}`
      
      const firstCreatedAt = firstInteractionMap.get(key)
      const isNewCall = firstCreatedAt === createdAt
      
      if (isNewCall) {
        totalNewCallsSet.add(`${interaction.id}`)
      } else {
        totalFollowupCallsSet.add(`${interaction.id}`)
      }
    })

    newCallsTotal = totalNewCallsSet.size
    followupCallsTotal = totalFollowupCallsSet.size

    // Get Total Client Search NEW: Count ALL rows from corporate_leadgen_leads (no filter)
    const { count: totalClientSearchAll, error: totalClientSearchAllError } = await supabaseServer
      .from('corporate_leadgen_leads')
      .select('*', { count: 'exact', head: true })

    if (totalClientSearchAllError) {
      console.error('Total client search all error:', totalClientSearchAllError)
    }

    totalClientSearchNew = totalClientSearchAll || 0

    // Get Yesterday: Count ALL rows from corporate_leadgen_leads where sourcing_date = lastWorkingDay
    if (lastWorkingDayStr) {
      const { count: yesterdayClientSearchAll, error: yesterdayClientSearchAllError } = await supabaseServer
        .from('corporate_leadgen_leads')
        .select('*', { count: 'exact', head: true })
        .eq('sourcing_date', lastWorkingDayStr)

      if (yesterdayClientSearchAllError) {
        console.error('Yesterday client search all error:', yesterdayClientSearchAllError)
      }

      totalClientSearchYesterdayNew = yesterdayClientSearchAll || 0
    }

    // Get Total Client Calling NEW: Count ALL rows from corporate_leads_interaction (no filter)
    const { count: totalClientCallingAllCount, error: totalClientCallingAllError } = await supabaseServer
      .from('corporate_leads_interaction')
      .select('*', { count: 'exact', head: true })

    if (totalClientCallingAllError) {
      console.error('Total client calling all error:', totalClientCallingAllError)
    }

    totalClientCallingNew = totalClientCallingAllCount || 0

    // Get Yesterday Client Calling: Count ALL rows where date = lastWorkingDay
    if (lastWorkingDayStr) {
      const { count: yesterdayClientCallingAllCount, error: yesterdayClientCallingAllError } = await supabaseServer
        .from('corporate_leads_interaction')
        .select('*', { count: 'exact', head: true })
        .eq('date', lastWorkingDayStr)

      if (yesterdayClientCallingAllError) {
        console.error('Yesterday client calling all error:', yesterdayClientCallingAllError)
      }

      totalClientCallingYesterdayNew = yesterdayClientCallingAllCount || 0
    }

    // Get Total: Count from corporate_leadgen_leads where startup = 'NO' or NULL
    const { count: totalClientSearch, error: totalCSError } = await supabaseServer
      .from('corporate_leadgen_leads')
      .select('*', { count: 'exact', head: true })
      .or('startup.ilike.%no%,startup.is.null')

    if (totalCSError) {
      console.error('Total client search error:', totalCSError)
    }

    clientSearchTotal = totalClientSearch || 0

    // Get Yesterday: Count from corporate_leadgen_leads where sourcing_date = lastWorkingDay AND startup = 'NO' or NULL
    if (lastWorkingDayStr) {
      const { count: yesterdayClientSearch, error: yesterdayCSError } = await supabaseServer
        .from('corporate_leadgen_leads')
        .select('*', { count: 'exact', head: true })
        .eq('sourcing_date', lastWorkingDayStr)
        .or('startup.ilike.%no%,startup.is.null')

      if (yesterdayCSError) {
        console.error('Yesterday client search error:', yesterdayCSError)
      }

      clientSearchYesterday = yesterdayClientSearch || 0
    }

    // Get Startup Search Total: Count from corporate_leadgen_leads where startup = 'YES'
    const { count: totalStartupSearch, error: totalStartupSearchError } = await supabaseServer
      .from('corporate_leadgen_leads')
      .select('*', { count: 'exact', head: true })
      .ilike('startup', 'yes')

    if (totalStartupSearchError) {
      console.error('Total startup search error:', totalStartupSearchError)
    }

    startupSearchTotal = totalStartupSearch || 0

    // Get Startup Search Yesterday: Count where sourcing_date = lastWorkingDay AND startup = 'YES'
    if (lastWorkingDayStr) {
      const { count: yesterdayStartupSearch, error: yesterdayStartupSearchError } = await supabaseServer
        .from('corporate_leadgen_leads')
        .select('*', { count: 'exact', head: true })
        .eq('sourcing_date', lastWorkingDayStr)
        .ilike('startup', 'yes')

      if (yesterdayStartupSearchError) {
        console.error('Yesterday startup search error:', yesterdayStartupSearchError)
      }

      startupSearchYesterday = yesterdayStartupSearch || 0
    }

    // Get Startup Calling Total: Count ALL rows from corporate_leads_interaction
    // where corporate_leadgen_leads startup = 'YES' (case insensitive)
    const { data: startupCallingData, error: startupCallingError } = await supabaseServer
      .from('corporate_leads_interaction')
      .select('client_id, date, corporate_leadgen_leads!inner(startup)')

    if (startupCallingError) {
      console.error('Startup calling data error:', startupCallingError)
    }

    // Count ALL rows where startup = 'YES' (no deduplication)
    startupCallingTotal = 0
    startupCallingData?.forEach(record => {
      const startupValue = record.corporate_leadgen_leads?.startup
      if (startupValue && startupValue.toLowerCase() === 'yes' && record.client_id) {
        startupCallingTotal++
      }
    })

    // Get Startup Calling Yesterday: count ALL rows where date = lastWorkingDay
    const { data: startupCallingYesterdayData, error: startupCallingYesterdayError } = await supabaseServer
      .from('corporate_leads_interaction')
      .select('client_id, date, corporate_leadgen_leads!inner(startup)')
      .eq('date', lastWorkingDayStr)

    if (startupCallingYesterdayError) {
      console.error('Startup calling yesterday error:', startupCallingYesterdayError)
    }

    startupCallingYesterday = 0
    startupCallingYesterdayData?.forEach(record => {
      const startupValue = record.corporate_leadgen_leads?.startup
      if (startupValue && startupValue.toLowerCase() === 'yes' && record.client_id && record.date) {
        startupCallingYesterday++
      }
    })

    // Get Master Union Clients Total: Count rows from corporate_leadgen_leads where startup = 'Master Union' (case insensitive)
    const { count: masterUnionClientsCount, error: masterUnionClientsError } = await supabaseServer
      .from('corporate_leadgen_leads')
      .select('*', { count: 'exact', head: true })
      .ilike('startup', 'master union')

    if (masterUnionClientsError) {
      console.error('Master union clients error:', masterUnionClientsError)
    }

    masterUnionClientsTotal = masterUnionClientsCount || 0

    // Get Master Union Calling Total: Count ALL rows from corporate_leads_interaction
    // where corporate_leadgen_leads startup = 'Master Union' (case insensitive)
    const { data: masterUnionCallingData, error: masterUnionCallingError } = await supabaseServer
      .from('corporate_leads_interaction')
      .select('client_id, date, corporate_leadgen_leads!inner(startup)')

    if (masterUnionCallingError) {
      console.error('Master union calling data error:', masterUnionCallingError)
    }

    // Count ALL rows where startup = 'Master Union' (no deduplication)
    masterUnionCallingTotal = 0
    masterUnionCallingData?.forEach(record => {
      const startupValue = record.corporate_leadgen_leads?.startup
      if (startupValue && startupValue.toLowerCase() === 'master union' && record.client_id) {
        masterUnionCallingTotal++
      }
    })

    // Get Master Union Clients Yesterday: Count rows where sourcing_date = lastWorkingDay
    let masterUnionClientsYesterday = 0
    if (lastWorkingDayStr) {
      const { count: masterUnionClientsYesterdayCount, error: masterUnionClientsYesterdayError } = await supabaseServer
        .from('corporate_leadgen_leads')
        .select('*', { count: 'exact', head: true })
        .eq('sourcing_date', lastWorkingDayStr)
        .ilike('startup', 'master union')

      if (masterUnionClientsYesterdayError) {
        console.error('Master union clients yesterday error:', masterUnionClientsYesterdayError)
      }

      masterUnionClientsYesterday = masterUnionClientsYesterdayCount || 0
    }

    // Get Master Union Calling Yesterday: Count ALL rows where date = lastWorkingDay
    let masterUnionCallingYesterday = 0
    if (lastWorkingDayStr) {
      const { data: masterUnionCallingYesterdayData, error: masterUnionCallingYesterdayError } = await supabaseServer
        .from('corporate_leads_interaction')
        .select('client_id, date, corporate_leadgen_leads!inner(startup)')
        .eq('date', lastWorkingDayStr)

      if (masterUnionCallingYesterdayError) {
        console.error('Master union calling yesterday error:', masterUnionCallingYesterdayError)
      }

      masterUnionCallingYesterdayData?.forEach(record => {
        const startupValue = record.corporate_leadgen_leads?.startup
        if (startupValue && startupValue.toLowerCase() === 'master union' && record.client_id && record.date) {
          masterUnionCallingYesterday++
        }
      })
    }

    // Get Franchise Discussed Total: Count first franchise discussed per client
    // (matching corporate/leadgen logic - first franchise discussed ever)
    const { data: franchiseDiscussedData, error: franchiseDiscussedError } = await supabaseServer
      .from('corporate_leads_interaction')
      .select('client_id, created_at, franchise_status')
      .not('franchise_status', 'ilike', 'No Franchise Discuss')
      .order('created_at', { ascending: true })

    if (franchiseDiscussedError) {
      console.error('Franchise discussed error:', franchiseDiscussedError)
    }

    // Find first franchise discussed for each client
    const firstFranchiseMap = new Map()
    franchiseDiscussedData?.forEach(record => {
      const clientId = record.client_id
      if (clientId && !firstFranchiseMap.has(clientId)) {
        firstFranchiseMap.set(clientId, record.created_at)
      }
    })

    franchiseDiscussedTotal = firstFranchiseMap.size

    // Get Franchise Discussed Yesterday: Count first franchise discussed on lastWorkingDay
    const { data: franchiseDiscussedYesterdayData, error: franchiseDiscussedYesterdayError } = await supabaseServer
      .from('corporate_leads_interaction')
      .select('client_id, created_at, date, franchise_status')
      .not('franchise_status', 'ilike', 'No Franchise Discuss')
      .eq('date', lastWorkingDayStr)
      .order('created_at', { ascending: true })

    if (franchiseDiscussedYesterdayError) {
      console.error('Franchise discussed yesterday error:', franchiseDiscussedYesterdayError)
    }

    // For yesterday, check if this is the first franchise discussed EVER
    const yesterdayFirstFranchiseSet = new Set()
    franchiseDiscussedYesterdayData?.forEach(record => {
      const clientId = record.client_id
      const createdAt = record.created_at
      const firstCreatedAt = firstFranchiseMap.get(clientId)
      
      // Only count if this is the first franchise discussed for this client
      if (clientId && firstCreatedAt === createdAt) {
        yesterdayFirstFranchiseSet.add(clientId)
      }
    })

    franchiseDiscussedYesterday = yesterdayFirstFranchiseSet.size

    // Get Form Shared Total: Count first form shared per client
    // (matching corporate/leadgen logic - first form shared ever)
    const { data: formSharedData, error: formSharedError } = await supabaseServer
      .from('corporate_leads_interaction')
      .select('client_id, created_at, franchise_status')
      .ilike('franchise_status', 'Application form share')
      .order('created_at', { ascending: true })

    if (formSharedError) {
      console.error('Form shared error:', formSharedError)
    }

    // Find first form shared for each client
    const firstFormSharedMap = new Map()
    formSharedData?.forEach(record => {
      const clientId = record.client_id
      if (clientId && !firstFormSharedMap.has(clientId)) {
        firstFormSharedMap.set(clientId, record.created_at)
      }
    })

    formSharedTotal = firstFormSharedMap.size

    // Get Form Shared Yesterday: Count first form shared on lastWorkingDay
    const { data: formSharedYesterdayData, error: formSharedYesterdayError } = await supabaseServer
      .from('corporate_leads_interaction')
      .select('client_id, created_at, date, franchise_status')
      .ilike('franchise_status', 'Application form share')
      .eq('date', lastWorkingDayStr)
      .order('created_at', { ascending: true })

    if (formSharedYesterdayError) {
      console.error('Form shared yesterday error:', formSharedYesterdayError)
    }

    // For yesterday, check if this is the first form shared EVER
    const yesterdayFirstFormSharedSet = new Set()
    formSharedYesterdayData?.forEach(record => {
      const clientId = record.client_id
      const createdAt = record.created_at
      const firstCreatedAt = firstFormSharedMap.get(clientId)
      
      // Only count if this is the first form shared for this client
      if (clientId && firstCreatedAt === createdAt) {
        yesterdayFirstFormSharedSet.add(clientId)
      }
    })

    formSharedYesterday = yesterdayFirstFormSharedSet.size

    // Get Client Calling Total: Count ALL rows from corporate_leads_interaction
    // where startup is NULL or 'NO' (not 'YES' and not 'Master Union')
    const { data: callingData, error: callingError } = await supabaseServer
      .from('corporate_leads_interaction')
      .select('client_id, date, corporate_leadgen_leads!inner(startup)')

    if (callingError) {
      console.error('Client calling data error:', callingError)
    }

    // Count ALL rows where startup is NULL or 'NO' (no deduplication)
    let clientCallingTotal = 0
    callingData?.forEach(record => {
      const startupValue = record.corporate_leadgen_leads?.startup
      // Include only if startup is NULL or contains 'no' (case insensitive)
      if (record.client_id && (!startupValue || startupValue.toLowerCase().includes('no'))) {
        clientCallingTotal++
      }
    })

    // Get Client Calling Yesterday: count ALL rows where date = lastWorkingDay
    const { data: callingYesterdayData, error: callingYesterdayError } = await supabaseServer
      .from('corporate_leads_interaction')
      .select('client_id, date, corporate_leadgen_leads!inner(startup)')
      .eq('date', lastWorkingDayStr)

    if (callingYesterdayError) {
      console.error('Client calling yesterday error:', callingYesterdayError)
    }

    let clientCallingYesterday = 0
    callingYesterdayData?.forEach(record => {
      const startupValue = record.corporate_leadgen_leads?.startup
      if (record.client_id && record.date && (!startupValue || startupValue.toLowerCase().includes('no'))) {
        clientCallingYesterday++
      }
    })

    // Get Contract Share Total: Count distinct client_ids who have at least one interaction with sub_status = 'Contract Share'
    const { data: contractShareData, error: contractShareError } = await supabaseServer
      .from('corporate_leads_interaction')
      .select('client_id, sub_status')
      .eq('sub_status', 'Contract Share')

    if (contractShareError) {
      console.error('Contract share total error:', contractShareError)
    }

    // Get unique client_ids
    const contractShareSet = new Set()
    contractShareData?.forEach(record => {
      if (record.client_id) {
        contractShareSet.add(record.client_id)
      }
    })

    const contractShareTotal = contractShareSet.size

    // Get Contract Share Yesterday: Count distinct client_ids who have at least one interaction with sub_status = 'Contract Share' on yesterday's date
    const yesterdayDateObj = new Date(lastWorkingDayStr)
    const nextDayObj = new Date(lastWorkingDayStr)
    nextDayObj.setDate(nextDayObj.getDate() + 1)
    
    const yesterdayDateStart = yesterdayDateObj.toISOString()
    const nextDayStart = nextDayObj.toISOString()
    
    const { data: contractShareYesterdayData, error: contractShareYesterdayError } = await supabaseServer
      .from('corporate_leads_interaction')
      .select('client_id, sub_status, created_at')
      .eq('sub_status', 'Contract Share')
      .gte('created_at', yesterdayDateStart)
      .lt('created_at', nextDayStart)

    if (contractShareYesterdayError) {
      console.error('Contract share yesterday error:', contractShareYesterdayError)
    }

    // Get unique client_ids for yesterday
    const contractShareYesterdaySet = new Set()
    contractShareYesterdayData?.forEach(record => {
      if (record.client_id) {
        contractShareYesterdaySet.add(record.client_id)
      }
    })

    const contractShareYesterday = contractShareYesterdaySet.size

    // If filter is provided and not 'all', return detailed data
    if (filter !== 'all') {
      let details = []
      let filterTitle = 'All Records'
      
      // Helper function to get user names
      const getUserNames = async (userIds) => {
        if (!userIds || userIds.length === 0) return new Map()
        const { data: usersData } = await supabaseServer
          .from('users')
          .select('user_id, name')
          .in('user_id', userIds)
        const userMap = new Map()
        usersData?.forEach(user => {
          userMap.set(user.user_id, user.name)
        })
        return userMap
      }

      // Helper function to get leadgen names using leadgen_id
      const getLeadgenNames = async (leadgenIds) => {
        if (!leadgenIds || leadgenIds.length === 0) return new Map()
        const { data: usersData } = await supabaseServer
          .from('users')
          .select('user_id, name')
          .in('user_id', leadgenIds)
        const userMap = new Map()
        usersData?.forEach(user => {
          userMap.set(user.user_id, user.name)
        })
        return userMap
      }

      switch (filter) {
        case 'client-search-yesterday':
          filterTitle = 'Client Search (Yesterday)'
          if (lastWorkingDayStr) {
            // First get client search leads from corporate_leadgen_leads
            const { data: clientSearchData } = await supabaseServer
              .from('corporate_leadgen_leads')
              .select('*')
              .eq('sourcing_date', lastWorkingDayStr)
              .or('startup.ilike.%no%,startup.is.null')
            
            if (clientSearchData && clientSearchData.length > 0) {
              const clientIds = clientSearchData.map(c => c.client_id).filter(Boolean)
              
              // Get latest interactions for these clients from corporate_leads_interaction
              let interactionsMap = new Map()
              if (clientIds.length > 0) {
                const { data: interactionsData } = await supabaseServer
                  .from('corporate_leads_interaction')
                  .select('client_id, contact_person, contact_no, remarks, next_follow_up, status, sub_status, franchise_status, date')
                  .in('client_id', clientIds)
                  .order('date', { ascending: false })
                
                // Get only the latest interaction for each client
                interactionsData?.forEach(interaction => {
                  if (!interactionsMap.has(interaction.client_id)) {
                    interactionsMap.set(interaction.client_id, interaction)
                  }
                })
              }
              
              const ownerIds = [...new Set(clientSearchData.map(c => c.leadgen_id).filter(Boolean))]
              const userNamesMap = await getLeadgenNames(ownerIds)
              
              details = clientSearchData.map(client => {
                const interaction = interactionsMap.get(client.client_id)
                return {
                  client_id: client.client_id,
                  companyName: client.company,
                  contactName: interaction?.contact_person || '',
                  contactNumber: interaction?.contact_no || '',
                  lastInteraction: interaction?.remarks || client.remarks || '',
                  lastInteractionDate: interaction?.date || client.sourcing_date || '',
                  nextFollowup: interaction?.next_follow_up || client.next_follow_up || '',
                  status: interaction?.status || client.status || '',
                  substatus: interaction?.sub_status || client.sub_status || '',
                  franchiseStatus: interaction?.franchise_status || client.franchise_status || 'Not Applicable',
                  owner: userNamesMap.get(client.leadgen_id) || client.leadgen_id || 'Unknown'
                }
              })
            }
          }
          break

        case 'client-calling-yesterday':
          filterTitle = 'Client Calling (Yesterday)'
          if (lastWorkingDayStr) {
            const { data: callingData } = await supabaseServer
              .from('corporate_leads_interaction')
              .select('*, corporate_leadgen_leads!inner(startup, company)')
              .eq('date', lastWorkingDayStr)
            
            if (callingData && callingData.length > 0) {
              const filteredData = callingData
              
              // Removed deduplication - show ALL interactions
              const ownerIds = [...new Set(filteredData.map(c => c.leadgen_id).filter(Boolean))]
              const userNamesMap = await getLeadgenNames(ownerIds)
              
              details = filteredData.map(interaction => ({
                client_id: interaction.client_id,
                companyName: interaction.corporate_leadgen_leads?.company || '',
                contactName: interaction.contact_person || '',
                contactNumber: interaction.contact_no || '',
                lastInteraction: interaction.remarks || '',
                lastInteractionDate: interaction.date || '',
                nextFollowup: interaction.next_follow_up || '',
                status: interaction.status || '',
                substatus: interaction.sub_status || '',
                franchiseStatus: interaction.franchise_status || 'Not Applicable',
                owner: userNamesMap.get(interaction.leadgen_id) || interaction.leadgen_id || 'Unknown'
              }))
            }
          }
          break

        case 'startup-search-yesterday':
          filterTitle = 'Startup Search (Yesterday)'
          if (lastWorkingDayStr) {
            // First get startup search leads from corporate_leadgen_leads
            const { data: startupData } = await supabaseServer
              .from('corporate_leadgen_leads')
              .select('*')
              .eq('sourcing_date', lastWorkingDayStr)
              .ilike('startup', 'yes')
            
            if (startupData && startupData.length > 0) {
              const clientIds = startupData.map(c => c.client_id).filter(Boolean)
              
              // Get latest interactions for these clients from corporate_leads_interaction
              let interactionsMap = new Map()
              if (clientIds.length > 0) {
                const { data: interactionsData } = await supabaseServer
                  .from('corporate_leads_interaction')
                  .select('client_id, contact_person, contact_no, remarks, next_follow_up, status, sub_status, franchise_status, date')
                  .in('client_id', clientIds)
                  .order('date', { ascending: false })
                
                // Get only the latest interaction for each client
                interactionsData?.forEach(interaction => {
                  if (!interactionsMap.has(interaction.client_id)) {
                    interactionsMap.set(interaction.client_id, interaction)
                  }
                })
              }
              
              const ownerIds = [...new Set(startupData.map(c => c.leadgen_id).filter(Boolean))]
              const userNamesMap = await getLeadgenNames(ownerIds)
              
              details = startupData.map(client => {
                const interaction = interactionsMap.get(client.client_id)
                return {
                  client_id: client.client_id,
                  companyName: client.company,
                  contactName: interaction?.contact_person || '',
                  contactNumber: interaction?.contact_no || '',
                  lastInteraction: interaction?.remarks || client.remarks || '',
                  lastInteractionDate: interaction?.date || client.sourcing_date || '',
                  nextFollowup: interaction?.next_follow_up || client.next_follow_up || '',
                  status: interaction?.status || client.status || '',
                  substatus: interaction?.sub_status || client.sub_status || '',
                  franchiseStatus: interaction?.franchise_status || client.franchise_status || 'Not Applicable',
                  owner: userNamesMap.get(client.leadgen_id) || client.leadgen_id || 'Unknown',
                  startup: client.startup
                }
              })
            }
          }
          break

        case 'startup-calling-yesterday':
          filterTitle = 'Startup Calling (Yesterday)'
          if (lastWorkingDayStr) {
            const { data: startupCallingData } = await supabaseServer
              .from('corporate_leads_interaction')
              .select('*, corporate_leadgen_leads!inner(startup, company)')
              .eq('date', lastWorkingDayStr)
            
            if (startupCallingData && startupCallingData.length > 0) {
              const filteredData = startupCallingData.filter(rec => 
                rec.corporate_leadgen_leads?.startup?.toLowerCase() === 'yes'
              )
              
              // NO deduplication - show all rows
              const ownerIds = [...new Set(filteredData.map(c => c.leadgen_id).filter(Boolean))]
              const userNamesMap = await getLeadgenNames(ownerIds)
              
              details = filteredData.map(interaction => ({
                client_id: interaction.client_id,
                companyName: interaction.corporate_leadgen_leads?.company || '',
                contactName: interaction.contact_person || '',
                contactNumber: interaction.contact_no || '',
                lastInteraction: interaction.remarks || '',
                lastInteractionDate: interaction.date || '',
                nextFollowup: interaction.next_follow_up || '',
                status: interaction.status || '',
                substatus: interaction.sub_status || '',
                franchiseStatus: interaction.franchise_status || 'Not Applicable',
                owner: userNamesMap.get(interaction.leadgen_id) || interaction.leadgen_id || 'Unknown'
              }))
            }
          }
          break

        case 'franchise-discussed-yesterday':
          filterTitle = 'Franchise Discussed (Yesterday)'
          if (lastWorkingDayStr) {
            // Get all franchise discussed interactions for yesterday
            const { data: franchiseData } = await supabaseServer
              .from('corporate_leads_interaction')
              .select('*, corporate_leadgen_leads!inner(startup, company)')
              .not('franchise_status', 'ilike', 'No Franchise Discuss')
              .eq('date', lastWorkingDayStr)
              .order('created_at', { ascending: true })
            
            if (franchiseData && franchiseData.length > 0) {
              // Filter to show only first franchise discussed per client (matching corporate/leadgen logic)
              const firstFranchiseClients = new Set()
              const filteredData = []
              
              franchiseData.forEach(rec => {
                const clientId = rec.client_id
                if (clientId && !firstFranchiseClients.has(clientId)) {
                  firstFranchiseClients.add(clientId)
                  filteredData.push(rec)
                }
              })
              
              const ownerIds = [...new Set(filteredData.map(c => c.leadgen_id).filter(Boolean))]
              const userNamesMap = await getLeadgenNames(ownerIds)
              
              details = filteredData.map(interaction => ({
                client_id: interaction.client_id,
                companyName: interaction.corporate_leadgen_leads?.company || '',
                contactName: interaction.contact_person || '',
                contactNumber: interaction.contact_no || '',
                lastInteraction: interaction.remarks || '',
                lastInteractionDate: interaction.date || '',
                nextFollowup: interaction.next_follow_up || '',
                status: interaction.status || '',
                substatus: interaction.sub_status || '',
                franchiseStatus: interaction.franchise_status || 'Not Applicable',
                owner: userNamesMap.get(interaction.leadgen_id) || interaction.leadgen_id || 'Unknown'
              }))
            }
          }
          break

        case 'form-ask-yesterday':
          filterTitle = 'Form Ask (Yesterday)'
          if (lastWorkingDayStr) {
            // Get all form ask interactions for yesterday
            const { data: formAskData } = await supabaseServer
              .from('corporate_leads_interaction')
              .select('*, corporate_leadgen_leads!inner(startup, company)')
              .ilike('sub_status', 'Form Ask')
              .eq('date', lastWorkingDayStr)
              .order('created_at', { ascending: true })
            
            if (formAskData && formAskData.length > 0) {
              // Filter to show only first form ask per client (matching corporate/leadgen logic)
              const firstFormAskClients = new Set()
              const filteredData = []
              
              formAskData.forEach(rec => {
                const clientId = rec.client_id
                if (clientId && !firstFormAskClients.has(clientId)) {
                  firstFormAskClients.add(clientId)
                  filteredData.push(rec)
                }
              })
              
              const ownerIds = [...new Set(filteredData.map(c => c.leadgen_id).filter(Boolean))]
              const userNamesMap = await getLeadgenNames(ownerIds)
              
              details = filteredData.map(interaction => ({
                client_id: interaction.client_id,
                companyName: interaction.corporate_leadgen_leads?.company || '',
                contactName: interaction.contact_person || '',
                contactNumber: interaction.contact_no || '',
                lastInteraction: interaction.remarks || '',
                lastInteractionDate: interaction.date || '',
                nextFollowup: interaction.next_follow_up || '',
                status: interaction.status || '',
                substatus: interaction.sub_status || '',
                franchiseStatus: interaction.franchise_status || 'Not Applicable',
                owner: userNamesMap.get(interaction.leadgen_id) || interaction.leadgen_id || 'Unknown'
              }))
            }
          }
          break

        case 'form-shared-yesterday':
          filterTitle = 'Form Shared (Yesterday)'
          if (lastWorkingDayStr) {
            // Get all form shared interactions for yesterday
            const { data: formSharedData } = await supabaseServer
              .from('corporate_leads_interaction')
              .select('*, corporate_leadgen_leads!inner(startup, company)')
              .ilike('franchise_status', 'Application form share')
              .eq('date', lastWorkingDayStr)
              .order('created_at', { ascending: true })
            
            if (formSharedData && formSharedData.length > 0) {
              // Filter to show only first form shared per client (matching corporate/leadgen logic)
              const firstFormSharedClients = new Set()
              const filteredData = []
              
              formSharedData.forEach(rec => {
                const clientId = rec.client_id
                if (clientId && !firstFormSharedClients.has(clientId)) {
                  firstFormSharedClients.add(clientId)
                  filteredData.push(rec)
                }
              })
              
              const ownerIds = [...new Set(filteredData.map(c => c.leadgen_id).filter(Boolean))]
              const userNamesMap = await getLeadgenNames(ownerIds)
              
              details = filteredData.map(interaction => ({
                client_id: interaction.client_id,
                companyName: interaction.corporate_leadgen_leads?.company || '',
                contactName: interaction.contact_person || '',
                contactNumber: interaction.contact_no || '',
                lastInteraction: interaction.remarks || '',
                lastInteractionDate: interaction.date || '',
                nextFollowup: interaction.next_follow_up || '',
                status: interaction.status || '',
                substatus: interaction.sub_status || '',
                franchiseStatus: interaction.franchise_status || 'Not Applicable',
                owner: userNamesMap.get(interaction.leadgen_id) || interaction.leadgen_id || 'Unknown'
              }))
            }
          }
          break

        case 'contract-share-yesterday':
          filterTitle = 'Contract Share (Yesterday)'
          if (lastWorkingDayStr) {
            const { data: contractShareData } = await supabaseServer
              .from('corporate_leads_interaction')
              .select('*, corporate_leadgen_leads!inner(startup, company)')
              .eq('sub_status', 'Contract Share')
              .eq('date', lastWorkingDayStr)
            
            if (contractShareData && contractShareData.length > 0) {
              // Fetch ALL Contract Share data first to find first time ever
              const { data: allContractData } = await supabaseServer
                .from('corporate_leads_interaction')
                .select('*, corporate_leadgen_leads!inner(startup, company)')
                .ilike('sub_status', 'Contract Share')
                .order('created_at', { ascending: true })
              
              if (allContractData && allContractData.length > 0) {
                // Find first Contract Share for each client using created_at
                const firstContractMap = new Map()
                allContractData.forEach(rec => {
                  const clientId = rec.client_id
                  if (!firstContractMap.has(clientId)) {
                    firstContractMap.set(clientId, rec)
                  }
                })
                
                // Get first Contract Share list
                const firstContractList = Array.from(firstContractMap.values())
                
                // Filter by lastWorkingDay
                let filteredData = firstContractList
                if (lastWorkingDayStr) {
                  filteredData = firstContractList.filter(interaction => interaction.date === lastWorkingDayStr)
                }
                
                if (filteredData && filteredData.length > 0) {
                  const ownerIds = [...new Set(filteredData.map(c => c.leadgen_id).filter(Boolean))]
                  const userNamesMap = await getLeadgenNames(ownerIds)
                  
                  details = filteredData.map(interaction => ({
                    client_id: interaction.client_id,
                    companyName: interaction.corporate_leadgen_leads?.company || '',
                    contactName: interaction.contact_person || '',
                    contactNumber: interaction.contact_no || '',
                    lastInteraction: interaction.remarks || '',
                    lastInteractionDate: interaction.date || '',
                    nextFollowup: interaction.next_follow_up || '',
                    status: interaction.status || '',
                    substatus: interaction.sub_status || '',
                    franchiseStatus: interaction.franchise_status || 'Not Applicable',
                    owner: userNamesMap.get(interaction.leadgen_id) || interaction.leadgen_id || 'Unknown'
                  }))
                }
              }
            }
          }
          break

        case 'master-union-clients':
          filterTitle = 'Master Union Clients'
          // Get all Master Union clients from corporate_leadgen_leads
          const { data: masterUnionClientsData } = await supabaseServer
            .from('corporate_leadgen_leads')
            .select('*')
            .ilike('startup', 'master union')
          
          if (masterUnionClientsData && masterUnionClientsData.length > 0) {
            const clientIds = masterUnionClientsData.map(c => c.client_id).filter(Boolean)
            
            // Get latest interactions for these clients from corporate_leads_interaction
            let interactionsMap = new Map()
            if (clientIds.length > 0) {
              const { data: interactionsData } = await supabaseServer
                .from('corporate_leads_interaction')
                .select('client_id, contact_person, contact_no, remarks, next_follow_up, status, sub_status, franchise_status, date')
                .in('client_id', clientIds)
                .order('date', { ascending: false })
              
              // Get only the latest interaction for each client
              interactionsData?.forEach(interaction => {
                if (!interactionsMap.has(interaction.client_id)) {
                  interactionsMap.set(interaction.client_id, interaction)
                }
              })
            }
            
            const muClientOwnerIds = [...new Set(masterUnionClientsData.map(c => c.leadgen_id).filter(Boolean))]
            const muUserNamesMap = await getLeadgenNames(muClientOwnerIds)
            
            details = masterUnionClientsData.map(client => {
              const interaction = interactionsMap.get(client.client_id)
              return {
                client_id: client.client_id,
                companyName: client.company,
                contactName: interaction?.contact_person || '',
                contactNumber: interaction?.contact_no || '',
                lastInteraction: interaction?.remarks || client.remarks || '',
                lastInteractionDate: interaction?.date || client.sourcing_date || '',
                nextFollowup: interaction?.next_follow_up || client.next_follow_up || '',
                status: interaction?.status || client.status || '',
                substatus: interaction?.sub_status || client.sub_status || '',
                franchiseStatus: interaction?.franchise_status || client.franchise_status || 'Not Applicable',
                owner: muUserNamesMap.get(client.leadgen_id) || client.leadgen_id || 'Unknown'
              }
            })
          }
          break

        case 'master-union-calling':
          filterTitle = 'Master Union Calling'
          // Get all interactions where startup = 'Master Union'
          const { data: masterUnionCallingInteractions } = await supabaseServer
            .from('corporate_leads_interaction')
            .select('*, corporate_leadgen_leads!inner(startup, company)')
          
          if (masterUnionCallingInteractions && masterUnionCallingInteractions.length > 0) {
            // Filter where startup = 'Master Union' (case insensitive)
            const muInteractions = masterUnionCallingInteractions.filter(rec => 
              rec.corporate_leadgen_leads?.startup?.toLowerCase() === 'master union'
            )
            
            // NO deduplication - show all rows
            const muCallingOwnerIds = [...new Set(muInteractions.map(c => c.leadgen_id).filter(Boolean))]
            const muCallingUserNamesMap = await getLeadgenNames(muCallingOwnerIds)
            
            details = muInteractions.map(interaction => ({
              client_id: interaction.client_id,
              companyName: interaction.corporate_leadgen_leads?.company || '',
              contactName: interaction.contact_person || '',
              contactNumber: interaction.contact_no || '',
              lastInteraction: interaction.remarks || '',
              lastInteractionDate: interaction.date || '',
              nextFollowup: interaction.next_follow_up || '',
              status: interaction.status || '',
              substatus: interaction.sub_status || '',
              franchiseStatus: interaction.franchise_status || 'Not Applicable',
              owner: muCallingUserNamesMap.get(interaction.leadgen_id) || interaction.leadgen_id || 'Unknown'
            }))
          }
          break

        case 'new-calls-yesterday':
          filterTitle = 'New Calls (Yesterday)'
          if (lastWorkingDayStr) {
            // Get yesterday's interactions and classify as new
            const { data: newCallsInteractions } = await supabaseServer
              .from('corporate_leads_interaction')
              .select('*, corporate_leadgen_leads!inner(startup, company, sourcing_date)')
              .eq('date', lastWorkingDayStr)
              .order('created_at', { ascending: true })

            if (newCallsInteractions && newCallsInteractions.length > 0) {
              // Classify each interaction as new or followup using the firstInteractionMap
              const newCallsDetails = []
              
              newCallsInteractions.forEach(interaction => {
                const leadgenId = interaction.leadgen_id
                const clientId = interaction.client_id
                const contactPerson = interaction.contact_person || ''
                const createdAt = interaction.created_at
                const key = `${leadgenId}_${clientId}_${contactPerson}`
                
                const firstCreatedAt = firstInteractionMap.get(key)
                const isNewCall = firstCreatedAt === createdAt
                
                if (isNewCall) {
                  newCallsDetails.push(interaction)
                }
              })

              // Get unique owner IDs
              const ownerIds = [...new Set(newCallsDetails.map(c => c.leadgen_id).filter(Boolean))]
              const userNamesMap = await getLeadgenNames(ownerIds)

              // Deduplicate by client_id - keep first interaction
              const uniqueClientsMap = new Map()
              newCallsDetails.forEach(rec => {
                if (rec.client_id && !uniqueClientsMap.has(rec.client_id)) {
                  uniqueClientsMap.set(rec.client_id, rec)
                }
              })

              details = Array.from(uniqueClientsMap.values()).map(interaction => ({
                client_id: interaction.client_id,
                companyName: interaction.corporate_leadgen_leads?.company || '',
                contactName: interaction.contact_person || '',
                contactNumber: interaction.contact_no || '',
                lastInteraction: interaction.remarks || '',
                lastInteractionDate: interaction.date || '',
                nextFollowup: interaction.next_follow_up || '',
                status: interaction.status || '',
                substatus: interaction.sub_status || '',
                franchiseStatus: interaction.franchise_status || 'Not Applicable',
                owner: userNamesMap.get(interaction.leadgen_id) || interaction.leadgen_id || 'Unknown'
              }))
            }
          }
          break

        case 'followup-calls-yesterday':
          filterTitle = 'Followup Calls (Yesterday)'
          if (lastWorkingDayStr) {
            // Get yesterday's interactions and classify as followup
            const { data: followupCallsInteractions } = await supabaseServer
              .from('corporate_leads_interaction')
              .select('*, corporate_leadgen_leads!inner(startup, company, sourcing_date)')
              .eq('date', lastWorkingDayStr)
              .order('created_at', { ascending: true })

            if (followupCallsInteractions && followupCallsInteractions.length > 0) {
              // Classify each interaction as new or followup using the firstInteractionMap
              const followupDetails = []
              
              followupCallsInteractions.forEach(interaction => {
                const leadgenId = interaction.leadgen_id
                const clientId = interaction.client_id
                const contactPerson = interaction.contact_person || ''
                const createdAt = interaction.created_at
                const key = `${leadgenId}_${clientId}_${contactPerson}`
                
                const firstCreatedAt = firstInteractionMap.get(key)
                const isNewCall = firstCreatedAt === createdAt
                
                if (!isNewCall) {
                  followupDetails.push(interaction)
                }
              })

              // Get unique owner IDs
              const ownerIds = [...new Set(followupDetails.map(c => c.leadgen_id).filter(Boolean))]
              const userNamesMap = await getLeadgenNames(ownerIds)

              // Deduplicate by client_id - keep first followup interaction for each client
              const uniqueClientsMap = new Map()
              followupDetails.forEach(rec => {
                if (rec.client_id && !uniqueClientsMap.has(rec.client_id)) {
                  uniqueClientsMap.set(rec.client_id, rec)
                }
              })

              details = Array.from(uniqueClientsMap.values()).map(interaction => ({
                client_id: interaction.client_id,
                companyName: interaction.corporate_leadgen_leads?.company || '',
                contactName: interaction.contact_person || '',
                contactNumber: interaction.contact_no || '',
                lastInteraction: interaction.remarks || '',
                lastInteractionDate: interaction.date || '',
                nextFollowup: interaction.next_follow_up || '',
                status: interaction.status || '',
                substatus: interaction.sub_status || '',
                franchiseStatus: interaction.franchise_status || 'Not Applicable',
                owner: userNamesMap.get(interaction.leadgen_id) || interaction.leadgen_id || 'Unknown'
              }))
            }
          }
          break

        case 'yesterday-calls':
          filterTitle = 'Yesterday Calls'
          if (lastWorkingDayStr) {
            // Get all yesterday's interactions
            const { data: yesterdayCallsData } = await supabaseServer
              .from('corporate_leads_interaction')
              .select('*, corporate_leadgen_leads!inner(startup, company, sourcing_date)')
              .eq('date', lastWorkingDayStr)
              .order('created_at', { ascending: true })

            if (yesterdayCallsData && yesterdayCallsData.length > 0) {
              // Get unique owner IDs
              const ownerIds = [...new Set(yesterdayCallsData.map(c => c.leadgen_id).filter(Boolean))]
              const userNamesMap = await getLeadgenNames(ownerIds)

              // Classify each interaction as new or followup (NO deduplication - show all rows)
              details = yesterdayCallsData.map(interaction => {
                const leadgenId = interaction.leadgen_id
                const clientId = interaction.client_id
                const contactPerson = interaction.contact_person || ''
                const createdAt = interaction.created_at
                const key = `${leadgenId}_${clientId}_${contactPerson}`
                
                const firstCreatedAt = firstInteractionMap.get(key)
                const isNewCall = firstCreatedAt === createdAt
                
                return {
                  client_id: interaction.client_id,
                  companyName: interaction.corporate_leadgen_leads?.company || '',
                  contactName: interaction.contact_person || '',
                  contactNumber: interaction.contact_no || '',
                  lastInteraction: interaction.remarks || '',
                  lastInteractionDate: interaction.date || '',
                  nextFollowup: interaction.next_follow_up || '',
                  status: interaction.status || '',
                  substatus: interaction.sub_status || '',
                  franchiseStatus: interaction.franchise_status || 'Not Applicable',
                  owner: userNamesMap.get(interaction.leadgen_id) || interaction.leadgen_id || 'Unknown',
                  isNewCall
                }
              })
            }
          }
          break

        case 'crm-client-calling':
          filterTitle = 'CRM Client Calling'
          
          // Get today's date
          const crmToday = new Date().toISOString().split('T')[0]
          
          // Get the latest past date from corporate_crm_conversation
          const { data: crmLatestDateData } = await supabaseServer
            .from('corporate_crm_conversation')
            .select('date')
            .neq('date', crmToday)
            .order('date', { ascending: false })
            .limit(1)
          
          const crmLastWorkingDayStr = crmLatestDateData && crmLatestDateData.length > 0 ? crmLatestDateData[0].date : null
          
          // Get all CRM conversations
          const { data: crmAllData } = await supabaseServer
            .from('corporate_crm_conversation')
            .select('*')
          
          // Format all data for table display
          details = (crmAllData || []).map(conversation => ({
            client_id: conversation.branch_id,
            companyName: conversation.company_name || '',
            contactName: conversation.contact_name || '',
            contactNumber: conversation.contact_no || '',
            lastInteraction: conversation.discussion || '',
            lastInteractionDate: conversation.date || '',
            mode: conversation.mode || '',
            owner: conversation.user_id || ''
          }))
          break

        default:
          details = []
      }

      return NextResponse.json({
        success: true,
        data: {
          filter,
          filterTitle,
          details
        }
      })
    }

    return NextResponse.json({
      success: true,
      data: {
        lastWorkingDay: lastWorkingDayStr,
        clientSearchTotal,
        clientSearchYesterday,
        clientCallingTotal,
        clientCallingYesterday,
        contractShareTotal,
        contractShareYesterday,
        startupSearchTotal,
        startupSearchYesterday,
        startupCallingTotal,
        startupCallingYesterday,
        masterUnionClientsTotal,
        masterUnionCallingTotal,
        masterUnionClientsYesterday,
        masterUnionCallingYesterday,
        franchiseDiscussedTotal,
        franchiseDiscussedYesterday,
        formSharedTotal,
        formSharedYesterday,
        // NEW: Total Client Search (all rows)
        totalClientSearchNew,
        totalClientSearchYesterdayNew,
        // NEW: Total Client Calling (all rows)
        totalClientCallingNew,
        totalClientCallingYesterdayNew,
        // NEW: New Calls vs Followup Calls
        newCallsTotal,
        newCallsYesterday,
        followupCallsTotal,
        followupCallsYesterday
      }
    })

  } catch (error) {
    console.error('Corporate morning report API error:', error)
    return NextResponse.json({
      error: 'Internal server error',
      details: error.message
    }, { status: 500 })
  }
}
