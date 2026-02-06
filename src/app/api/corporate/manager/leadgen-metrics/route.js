import { supabaseServer } from '@/lib/supabase-server'
import { NextResponse } from 'next/server'

export async function GET(request) {
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
      .select('role, manager_id')
      .eq('user_id', user.id)
      .single()

    if (profileError || !userProfile) {
      return NextResponse.json({ error: 'User profile not found' }, { status: 404 })
    }

    if (!userProfile.role || !userProfile.role.includes('MANAGER')) {
      return NextResponse.json({ error: 'Access denied. Manager role required.' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const selectedLeadgenId = searchParams.get('leadgen_id')
    const fromDate = searchParams.get('from_date')
    const toDate = searchParams.get('to_date')

    let leadgenIdsToQuery = []

    if (selectedLeadgenId && selectedLeadgenId !== 'All') {
      const { data: leadgenCheck, error: leadgenCheckError } = await supabaseServer
        .from('users')
        .select('user_id, name, manager_id')
        .eq('user_id', selectedLeadgenId)
        .contains('role', ['LEADGEN'])
        .eq('manager_id', user.id)
        .single()

      if (leadgenCheckError || !leadgenCheck) {
        return NextResponse.json({ error: 'Invalid LeadGen selection' }, { status: 403 })
      }
      leadgenIdsToQuery = [selectedLeadgenId]
    } else {
      const { data: leadgenTeam, error: leadgenError } = await supabaseServer
        .from('users')
        .select('user_id, name, manager_id')
        .contains('role', ['LEADGEN'])
        .eq('manager_id', user.id)

      if (leadgenError) {
        return NextResponse.json({ error: 'Failed to fetch LeadGen team' }, { status: 500 })
      }
      leadgenIdsToQuery = leadgenTeam?.map(lg => lg.user_id) || []
    }

    if (leadgenIdsToQuery.length === 0) {
      return NextResponse.json({
        success: true,
        data: {
          searched: { total: 0, startup: 0 },
          contacts: { total: 0, startup: 0 },
          calls: { total: 0, startup: 0 },
          picked: { total: 0, startup: 0 },
          notPicked: { total: 0, startup: 0 },
          accepted: { total: 0, startup: 0 },
          onboarded: { total: 0, startup: 0 },
          interested: { total: 0, startup: 0 },
          contracts: { total: 0, startup: 0 },
          discussed: { total: 0, startup: 0 },
          formShared: { total: 0, startup: 0 },
          sentToManager: { total: 0, startup: 0 }
        }
      })
    }

    // Helper function to check startup
    const isStartup = (startup) => {
      return startup === true || 
             String(startup).toLowerCase() === 'yes' ||
             String(startup) === '1' ||
             String(startup).toLowerCase() === 'true'
    }

    // Query interactions directly for contacts (matching contacts-count API exactly with !inner join)
    let contactsQuery = supabaseServer
      .from('corporate_leads_interaction')
      .select('*, corporate_leadgen_leads!inner(startup)')
      .in('leadgen_id', leadgenIdsToQuery)

    if (fromDate && toDate) {
      contactsQuery = contactsQuery
        .gte('date', fromDate)
        .lte('date', toDate)
    }

    const { data: contactsData, error: contactsError } = await contactsQuery

    if (contactsError) {
      console.error('Contacts query error:', contactsError)
    }

    // Count contacts - matching contacts-count API exactly
    const uniqueContactPersons = new Set(
      contactsData?.map(i => i.contact_person).filter(cp => cp) || []
    )
    const contactsTotal = uniqueContactPersons.size

    // Count startup contacts - matching contacts-count API exactly
    const startupContactPersons = new Set(
      contactsData
        ?.filter(i => {
          const startup = i.corporate_leadgen_leads?.startup
          return startup === true || 
                 String(startup).toLowerCase() === 'yes' ||
                 String(startup) === '1' ||
                 String(startup).toLowerCase() === 'true'
        })
        ?.map(i => i.contact_person)
        .filter(cp => cp) || []
    )
    const contactsStartup = startupContactPersons.size

    // DEBUG: Check all leads that match isStartup criteria
    console.log('DEBUG leadgenIdsToQuery:', leadgenIdsToQuery)
    
    const { data: allLeads, error: allLeadsError } = await supabaseServer
      .from('corporate_leadgen_leads')
      .select('client_id, startup')
      .in('leadgen_id', leadgenIdsToQuery)
    
    if (allLeadsError) {
      console.error('DEBUG allLeadsError:', allLeadsError)
    }
    
    const startupLeadsDebug = allLeads?.filter(l => {
      const startup = l.startup
      return startup === true || 
             String(startup).toLowerCase() === 'yes' ||
             String(startup) === '1' ||
             String(startup).toLowerCase() === 'true'
    }) || []
    
    console.log('DEBUG allLeads count:', allLeads?.length)
    console.log('DEBUG leads matching isStartup criteria:', startupLeadsDebug.length)
    console.log('DEBUG startup leads client_ids:', startupLeadsDebug.map(l => l.client_id))

    // DEBUG: Check which startup leads have interactions
    const startupLeadClientIds = new Set(startupLeadsDebug.map(l => l.client_id))
    const { data: interactionsForStartupLeads } = await supabaseServer
      .from('corporate_leads_interaction')
      .select('client_id, contact_person')
      .in('leadgen_id', leadgenIdsToQuery)
      .in('client_id', Array.from(startupLeadClientIds))
    
    console.log('DEBUG interactions for startup leads:', interactionsForStartupLeads?.length)
    const uniqueStartupContactsFromInteractions = new Set(interactionsForStartupLeads?.map(i => i.contact_person).filter(cp => cp) || [])
    console.log('DEBUG unique startup contacts from interactions:', uniqueStartupContactsFromInteractions.size)
    console.log('DEBUG unique startup contacts list:', Array.from(uniqueStartupContactsFromInteractions))

    // DEBUG: Log counts
    console.log('DEBUG contactsData count:', contactsData?.length)
    console.log('DEBUG uniqueContactPersons:', uniqueContactPersons.size)
    console.log('DEBUG startupContactPersons:', startupContactPersons.size)
    console.log('DEBUG startup contact persons list:', Array.from(startupContactPersons))
    console.log('DEBUG leadgenIdsToQuery:', leadgenIdsToQuery)

    // Get all leads with their interactions for other metrics
    const { data: rawData, error: queryError } = await supabaseServer
      .from('corporate_leadgen_leads')
      .select(`
        client_id,
        startup,
        sent_to_sm,
        lock_date,
        corporate_leads_interaction!left (
          id,
          date,
          status,
          sub_status,
          franchise_status,
          created_at,
          contact_no,
          contact_person
        )
      `)
      .in('leadgen_id', leadgenIdsToQuery)
      .order('created_at', { ascending: false })

    if (queryError) {
      console.error('Query error:', queryError)
      return NextResponse.json({ error: 'Failed to fetch data' }, { status: 500 })
    }

    // Filter leads based on date range if provided
    let leadsToConsider = rawData || []
    if (fromDate && toDate) {
      const { data: interactionsInRange } = await supabaseServer
        .from('corporate_leads_interaction')
        .select('client_id')
        .in('leadgen_id', leadgenIdsToQuery)
        .gte('date', fromDate)
        .lte('date', toDate)
      
      const clientIdsInRange = new Set(interactionsInRange?.map(i => i.client_id) || [])
      leadsToConsider = (rawData || []).filter(lead => clientIdsInRange.has(lead.client_id))
    }

    // Flatten all interactions
    const allInteractions = leadsToConsider.flatMap(l => 
      l.corporate_leads_interaction?.map(i => ({ ...i, startup: l.startup })) || []
    )

    // Count searched
    const searchedTotal = leadsToConsider.length
    const searchedStartup = leadsToConsider.filter(l => isStartup(l.startup)).length

    // Count total calls
    const callsTotal = allInteractions.length
    const callsStartup = allInteractions.filter(i => isStartup(i.startup)).length

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

    const latestInteractions = Array.from(latestInteractionsMap.values())

    // Count not picked
    const notPickedStatuses = ['not picked', 'notpick', 'np', 'no pick']
    const notPickedInteractions = latestInteractions.filter(i => 
      notPickedStatuses.includes(String(i.status).toLowerCase())
    )
    const notPickedTotal = notPickedInteractions.length
    const notPickedStartup = notPickedInteractions.filter(i => isStartup(i.startup)).length

    // Calculate picked
    const pickedTotal = callsTotal - notPickedTotal
    const pickedStartup = callsStartup - notPickedStartup

    // Count accepted - matching franchise-accepted API
    let acceptedQuery = supabaseServer
      .from('corporate_leads_interaction')
      .select('client_id, franchise_status, created_at, corporate_leadgen_leads(startup)')
      .in('leadgen_id', leadgenIdsToQuery)

    if (fromDate && toDate) {
      acceptedQuery = acceptedQuery
        .gte('date', fromDate)
        .lte('date', toDate)
    }

    const { data: acceptedInteractionsData } = await acceptedQuery

    const acceptedMap = new Map()
    acceptedInteractionsData?.forEach(i => {
      const clientId = i.client_id
      const existing = acceptedMap.get(clientId)
      if (!existing || new Date(i.created_at) > new Date(existing.created_at)) {
        acceptedMap.set(clientId, i)
      }
    })

    const acceptedClientIds = new Set()
    const startupAcceptedClientIds = new Set()

    acceptedMap.forEach((i) => {
      const fs = String(i.franchise_status || '').toLowerCase()
      if (fs.includes('form filled')) {
        acceptedClientIds.add(i.client_id)
        
        const startup = i.corporate_leadgen_leads?.startup
        if (isStartup(startup)) {
          startupAcceptedClientIds.add(i.client_id)
        }
      }
    })

    const acceptedTotal = acceptedClientIds.size
    const acceptedStartup = startupAcceptedClientIds.size

    // Count onboarded
    const onboardedInteractions = latestInteractions.filter(i => 
      String(i.status || '').toLowerCase().includes('onboard')
    )
    const onboardedTotal = onboardedInteractions.length
    const onboardedStartup = onboardedInteractions.filter(i => isStartup(i.startup)).length

    // Count interested
    const interestedInteractions = latestInteractions.filter(i => 
      String(i.status || '').trim().toLowerCase() === 'interested'
    )
    const interestedTotal = interestedInteractions.length
    const interestedStartup = interestedInteractions.filter(i => isStartup(i.startup)).length

    // Count contracts
    const contractsInteractions = latestInteractions.filter(i => 
      String(i.sub_status || '').trim().toLowerCase() === 'contract share'
    )
    const contractsTotal = contractsInteractions.length
    const contractsStartup = contractsInteractions.filter(i => isStartup(i.startup)).length

    // Count discussed - matching franchise-discussed API
    // IMPORTANT: This is an "ever" metric - count all clients that EVER had franchise discussed
    // regardless of the selected date range
    let discussedQuery = supabaseServer
      .from('corporate_leads_interaction')
      .select('client_id, franchise_status, created_at, corporate_leadgen_leads(startup)')
      .in('leadgen_id', leadgenIdsToQuery)
      .not('franchise_status', 'ilike', 'No Franchise Discuss')

    // NOTE: No date filter here - this is an "ever" metric

    const { data: discussedInteractionsData } = await discussedQuery

    const discussedClientIds = new Set(
      discussedInteractionsData?.map(i => i.client_id) || []
    )
    const discussedTotal = discussedClientIds.size

    // Count startup discussed
    const { data: leadStartups } = await supabaseServer
      .from('corporate_leadgen_leads')
      .select('client_id, startup')
      .in('client_id', Array.from(discussedClientIds))

    const startupClientIds = new Set(
      leadStartups?.filter(l => isStartup(l.startup)).map(l => l.client_id) || []
    )
    const discussedStartup = startupClientIds.size

    // Count form shared - matching franchise-form-shared API
    // IMPORTANT: This is an "ever" metric - count all clients that EVER had application form shared
    // regardless of the selected date range
    let formSharedQuery = supabaseServer
      .from('corporate_leads_interaction')
      .select('client_id, franchise_status, created_at, date, corporate_leadgen_leads(startup)')
      .in('leadgen_id', leadgenIdsToQuery)

    // NOTE: No date filter here - this is an "ever" metric

    const { data: formSharedInteractionsData } = await formSharedQuery

    const formSharedMap = new Map()
    formSharedInteractionsData?.forEach(i => {
      const clientId = i.client_id
      const existing = formSharedMap.get(clientId)
      if (!existing || new Date(i.created_at) > new Date(existing.created_at)) {
        formSharedMap.set(clientId, i)
      }
    })

    const formSharedClientIds = new Set()
    const startupFormSharedClientIds = new Set()

    formSharedMap.forEach((i) => {
      const fs = String(i.franchise_status || '').toLowerCase()
      if (fs.includes('application form share') || fs === 'application form share') {
        formSharedClientIds.add(i.client_id)
        
        const startup = i.corporate_leadgen_leads?.startup
        if (isStartup(startup)) {
          startupFormSharedClientIds.add(i.client_id)
        }
      }
    })

    const formSharedTotal = formSharedClientIds.size
    const formSharedStartup = startupFormSharedClientIds.size

    // Count sent to manager - matching sent-to-manager-count API
    let sentToManagerLeads = leadsToConsider.filter(lead => lead.sent_to_sm === true)
    
    if (fromDate && toDate) {
      sentToManagerLeads = sentToManagerLeads.filter(lead => {
        if (!lead.lock_date) return false
        const lockDate = new Date(lead.lock_date)
        return lockDate >= new Date(fromDate) && lockDate <= new Date(toDate + 'T23:59:59')
      })
    }

    const sentTotal = sentToManagerLeads.length
    const sentStartup = sentToManagerLeads.filter(l => isStartup(l.startup)).length

    return NextResponse.json({
      success: true,
      data: {
        searched: { total: searchedTotal, startup: searchedStartup },
        contacts: { total: contactsTotal, startup: contactsStartup },
        calls: { total: callsTotal, startup: callsStartup },
        picked: { total: pickedTotal, startup: pickedStartup },
        notPicked: { total: notPickedTotal, startup: notPickedStartup },
        accepted: { total: acceptedTotal, startup: acceptedStartup },
        onboarded: { total: onboardedTotal, startup: onboardedStartup },
        interested: { total: interestedTotal, startup: interestedStartup },
        contracts: { total: contractsTotal, startup: contractsStartup },
        discussed: { total: discussedTotal, startup: discussedStartup },
        formShared: { total: formSharedTotal, startup: formSharedStartup },
        sentToManager: { total: sentTotal, startup: sentStartup }
      }
    })

  } catch (error) {
    console.error('LeadGen metrics API error:', error)
    return NextResponse.json({ error: 'Internal server error: ' + error.message }, { status: 500 })
  }
}
