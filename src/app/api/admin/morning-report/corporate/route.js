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

    // Get Total: Count from corporate_leadgen_leads where startup = 'NO' or NULL
    const { count: totalClientSearch, error: totalCSError } = await supabaseServer
      .from('corporate_leadgen_leads')
      .select('*', { count: 'exact', head: true })
      .or('startup.eq.NO,startup.is.null')

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
        .or('startup.eq.NO,startup.is.null')

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

    // Get Startup Calling Total: distinct client_id per unique date from corporate_leads_interaction
    // where corporate_leadgen_leads startup = 'YES' (case insensitive)
    const { data: startupCallingData, error: startupCallingError } = await supabaseServer
      .from('corporate_leads_interaction')
      .select('client_id, date, corporate_leadgen_leads!inner(startup)')

    if (startupCallingError) {
      console.error('Startup calling data error:', startupCallingError)
    }

    // Filter where startup = 'YES' (case insensitive) and count distinct client_id + date
    const startupCallingSet = new Set()
    startupCallingData?.forEach(record => {
      const startupValue = record.corporate_leadgen_leads?.startup
      if (startupValue && startupValue.toLowerCase() === 'yes' && record.client_id) {
        // Use 'NULL' string for null dates to include them in count
        const dateKey = record.date || 'NULL'
        startupCallingSet.add(`${record.client_id}_${dateKey}`)
      }
    })

    startupCallingTotal = startupCallingSet.size

    // Get Startup Calling Yesterday: same logic but date = lastWorkingDay
    const { data: startupCallingYesterdayData, error: startupCallingYesterdayError } = await supabaseServer
      .from('corporate_leads_interaction')
      .select('client_id, date, corporate_leadgen_leads!inner(startup)')
      .eq('date', lastWorkingDayStr)

    if (startupCallingYesterdayError) {
      console.error('Startup calling yesterday error:', startupCallingYesterdayError)
    }

    const startupCallingYesterdaySet = new Set()
    startupCallingYesterdayData?.forEach(record => {
      const startupValue = record.corporate_leadgen_leads?.startup
      if (startupValue && startupValue.toLowerCase() === 'yes' && record.client_id && record.date) {
        startupCallingYesterdaySet.add(`${record.client_id}_${record.date}`)
      }
    })

    startupCallingYesterday = startupCallingYesterdaySet.size

    // Get Master Union Clients Total: Count rows from corporate_leadgen_leads where startup = 'Master Union' (case insensitive)
    const { count: masterUnionClientsCount, error: masterUnionClientsError } = await supabaseServer
      .from('corporate_leadgen_leads')
      .select('*', { count: 'exact', head: true })
      .ilike('startup', 'master union')

    if (masterUnionClientsError) {
      console.error('Master union clients error:', masterUnionClientsError)
    }

    masterUnionClientsTotal = masterUnionClientsCount || 0

    // Get Master Union Calling Total: distinct client_id per unique date from corporate_leads_interaction
    // where corporate_leadgen_leads startup = 'Master Union' (case insensitive)
    const { data: masterUnionCallingData, error: masterUnionCallingError } = await supabaseServer
      .from('corporate_leads_interaction')
      .select('client_id, date, corporate_leadgen_leads!inner(startup)')

    if (masterUnionCallingError) {
      console.error('Master union calling data error:', masterUnionCallingError)
    }

    // Filter where startup = 'Master Union' (case insensitive) and count distinct client_id + date
    const masterUnionCallingSet = new Set()
    masterUnionCallingData?.forEach(record => {
      const startupValue = record.corporate_leadgen_leads?.startup
      if (startupValue && startupValue.toLowerCase() === 'master union' && record.client_id) {
        // Use 'NULL' string for null dates to include them in count
        const dateKey = record.date || 'NULL'
        masterUnionCallingSet.add(`${record.client_id}_${dateKey}`)
      }
    })

    masterUnionCallingTotal = masterUnionCallingSet.size

    // Get Franchise Discussed Total: distinct client_ids from corporate_leads_interaction 
    // where franchise_status is NOT 'No Franchise Discuss'
    const { data: franchiseDiscussedData, error: franchiseDiscussedError } = await supabaseServer
      .from('corporate_leads_interaction')
      .select('client_id, franchise_status')
      .not('franchise_status', 'ilike', 'No Franchise Discuss')

    if (franchiseDiscussedError) {
      console.error('Franchise discussed error:', franchiseDiscussedError)
    }

    // Get unique client_ids
    const franchiseDiscussedSet = new Set()
    franchiseDiscussedData?.forEach(record => {
      if (record.client_id) {
        franchiseDiscussedSet.add(record.client_id)
      }
    })

    franchiseDiscussedTotal = franchiseDiscussedSet.size

    // Get Franchise Discussed Yesterday: same logic but date = lastWorkingDay
    const { data: franchiseDiscussedYesterdayData, error: franchiseDiscussedYesterdayError } = await supabaseServer
      .from('corporate_leads_interaction')
      .select('client_id, franchise_status, date')
      .not('franchise_status', 'ilike', 'No Franchise Discuss')
      .eq('date', lastWorkingDayStr)

    if (franchiseDiscussedYesterdayError) {
      console.error('Franchise discussed yesterday error:', franchiseDiscussedYesterdayError)
    }

    // Get unique client_ids for yesterday
    const franchiseDiscussedYesterdaySet = new Set()
    franchiseDiscussedYesterdayData?.forEach(record => {
      if (record.client_id) {
        franchiseDiscussedYesterdaySet.add(record.client_id)
      }
    })

    franchiseDiscussedYesterday = franchiseDiscussedYesterdaySet.size

    // Get Form Shared Total: Count unique client_ids from corporate_leads_interaction 
    // where franchise_status = 'Application form share' (case insensitive)
    const { data: formSharedData, error: formSharedError } = await supabaseServer
      .from('corporate_leads_interaction')
      .select('client_id, franchise_status')
      .ilike('franchise_status', 'Application form share')

    if (formSharedError) {
      console.error('Form shared error:', formSharedError)
    }

    // Get unique client_ids
    const formSharedSet = new Set()
    formSharedData?.forEach(record => {
      if (record.client_id) {
        formSharedSet.add(record.client_id)
      }
    })

    formSharedTotal = formSharedSet.size

    // Get Form Shared Yesterday: same logic but date = lastWorkingDay
    const { data: formSharedYesterdayData, error: formSharedYesterdayError } = await supabaseServer
      .from('corporate_leads_interaction')
      .select('client_id, franchise_status, date')
      .ilike('franchise_status', 'Application form share')
      .eq('date', lastWorkingDayStr)

    if (formSharedYesterdayError) {
      console.error('Form shared yesterday error:', formSharedYesterdayError)
    }

    // Get unique client_ids for yesterday
    const formSharedYesterdaySet = new Set()
    formSharedYesterdayData?.forEach(record => {
      if (record.client_id) {
        formSharedYesterdaySet.add(record.client_id)
      }
    })

    formSharedYesterday = formSharedYesterdaySet.size

    // Get Client Calling Total: distinct client_id + date from corporate_leads_interaction
    // where startup = 'NO' in corporate_leadgen_leads (include NULL dates as well)
    const { data: callingData, error: callingError } = await supabaseServer
      .from('corporate_leads_interaction')
      .select('client_id, date, corporate_leadgen_leads!inner(startup)')

    if (callingError) {
      console.error('Client calling data error:', callingError)
    }

    // Filter where startup = 'NO' or NULL and count distinct client_id + date (treating NULL date as a valid value)
    const callingSet = new Set()
    callingData?.forEach(record => {
      const startupValue = record.corporate_leadgen_leads?.startup
      if ((!startupValue || startupValue.toLowerCase() === 'no') && record.client_id) {
        // Use 'NULL' string for null dates to include them in count
        const dateKey = record.date || 'NULL'
        callingSet.add(`${record.client_id}_${dateKey}`)
      }
    })

    const clientCallingTotal = callingSet.size

    // Get Client Calling Yesterday: same logic but date = lastWorkingDay
    const { data: callingYesterdayData, error: callingYesterdayError } = await supabaseServer
      .from('corporate_leads_interaction')
      .select('client_id, date, corporate_leadgen_leads!inner(startup)')
      .eq('date', lastWorkingDayStr)

    if (callingYesterdayError) {
      console.error('Client calling yesterday error:', callingYesterdayError)
    }

    const callingYesterdaySet = new Set()
    callingYesterdayData?.forEach(record => {
      const startupValue = record.corporate_leadgen_leads?.startup
      if ((!startupValue || startupValue.toLowerCase() === 'no') && record.client_id && record.date) {
        callingYesterdaySet.add(`${record.client_id}_${record.date}`)
      }
    })

    const clientCallingYesterday = callingYesterdaySet.size

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
              .or('startup.eq.NO,startup.is.null')
            
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
              const filteredData = callingData.filter(rec => 
                !rec.corporate_leadgen_leads?.startup || rec.corporate_leadgen_leads?.startup?.toLowerCase() === 'no'
              )
              
              const uniqueClients = new Map()
              filteredData.forEach(rec => {
                if (!uniqueClients.has(rec.client_id)) {
                  uniqueClients.set(rec.client_id, rec)
                }
              })
              
              const ownerIds = [...new Set(filteredData.map(c => c.leadgen_id).filter(Boolean))]
              const userNamesMap = await getLeadgenNames(ownerIds)
              
              details = Array.from(uniqueClients.values()).map(interaction => ({
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
              
              const uniqueClients = new Map()
              filteredData.forEach(rec => {
                if (!uniqueClients.has(rec.client_id)) {
                  uniqueClients.set(rec.client_id, rec)
                }
              })
              
              const ownerIds = [...new Set(filteredData.map(c => c.leadgen_id).filter(Boolean))]
              const userNamesMap = await getLeadgenNames(ownerIds)
              
              details = Array.from(uniqueClients.values()).map(interaction => ({
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
            const { data: franchiseData } = await supabaseServer
              .from('corporate_leads_interaction')
              .select('*, corporate_leadgen_leads!inner(startup, company)')
              .not('franchise_status', 'ilike', 'No Franchise Discuss')
              .eq('date', lastWorkingDayStr)
            
            if (franchiseData && franchiseData.length > 0) {
              const uniqueClients = new Map()
              franchiseData.forEach(rec => {
                if (!uniqueClients.has(rec.client_id)) {
                  uniqueClients.set(rec.client_id, rec)
                }
              })
              
              const ownerIds = [...new Set(franchiseData.map(c => c.leadgen_id).filter(Boolean))]
              const userNamesMap = await getLeadgenNames(ownerIds)
              
              details = Array.from(uniqueClients.values()).map(interaction => ({
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
            const { data: formAskData } = await supabaseServer
              .from('corporate_leads_interaction')
              .select('*, corporate_leadgen_leads!inner(startup, company)')
              .ilike('sub_status', 'Form Ask')
              .eq('date', lastWorkingDayStr)
            
            if (formAskData && formAskData.length > 0) {
              const uniqueClients = new Map()
              formAskData.forEach(rec => {
                if (!uniqueClients.has(rec.client_id)) {
                  uniqueClients.set(rec.client_id, rec)
                }
              })
              
              const ownerIds = [...new Set(formAskData.map(c => c.leadgen_id).filter(Boolean))]
              const userNamesMap = await getLeadgenNames(ownerIds)
              
              details = Array.from(uniqueClients.values()).map(interaction => ({
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
            const { data: formSharedData } = await supabaseServer
              .from('corporate_leads_interaction')
              .select('*, corporate_leadgen_leads!inner(startup, company)')
              .ilike('franchise_status', 'Application form share')
              .eq('date', lastWorkingDayStr)
            
            if (formSharedData && formSharedData.length > 0) {
              const uniqueClients = new Map()
              formSharedData.forEach(rec => {
                if (!uniqueClients.has(rec.client_id)) {
                  uniqueClients.set(rec.client_id, rec)
                }
              })
              
              const ownerIds = [...new Set(formSharedData.map(c => c.leadgen_id).filter(Boolean))]
              const userNamesMap = await getLeadgenNames(ownerIds)
              
              details = Array.from(uniqueClients.values()).map(interaction => ({
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
              const uniqueClients = new Map()
              contractShareData.forEach(rec => {
                if (!uniqueClients.has(rec.client_id)) {
                  uniqueClients.set(rec.client_id, rec)
                }
              })
              
              const ownerIds = [...new Set(contractShareData.map(c => c.leadgen_id).filter(Boolean))]
              const userNamesMap = await getLeadgenNames(ownerIds)
              
              details = Array.from(uniqueClients.values()).map(interaction => ({
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
        franchiseDiscussedTotal,
        franchiseDiscussedYesterday,
        formSharedTotal,
        formSharedYesterday
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
