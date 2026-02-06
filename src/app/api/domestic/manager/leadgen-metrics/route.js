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
          searched: 0,
          contacts: 0,
          calls: 0,
          picked: 0,
          notPicked: 0,
          onboarded: 0,
          interested: 0,
          contracts: 0,
          sentToManager: 0
        }
      })
    }

    // Get all leads for the leadgens
    let leadsQuery = supabaseServer
      .from('domestic_leadgen_leads')
      .select('client_id, sent_to_sm, lock_date, leadgen_id')
      .in('leadgen_id', leadgenIdsToQuery)

    if (fromDate && toDate) {
      leadsQuery = leadsQuery
        .gte('created_at', fromDate + 'T00:00:00')
        .lte('created_at', toDate + 'T23:59:59')
    }

    const { data: allLeads, error: leadsError } = await leadsQuery

    if (leadsError) {
      console.error('Leads query error:', leadsError)
      return NextResponse.json({ error: 'Failed to fetch leads' }, { status: 500 })
    }

    // Get all interactions for these leads
    let interactionsQuery = supabaseServer
      .from('domestic_leads_interaction')
      .select('*')
      .in('leadgen_id', leadgenIdsToQuery)

    if (fromDate && toDate) {
      interactionsQuery = interactionsQuery
        .gte('date', fromDate)
        .lte('date', toDate)
    }

    const { data: allInteractions, error: interactionsError } = await interactionsQuery

    if (interactionsError) {
      console.error('Interactions query error:', interactionsError)
    }

    // Count unique contact persons
    const uniqueContactPersons = new Set(
      allInteractions?.map(i => i.contact_person).filter(cp => cp) || []
    )
    const contactsTotal = uniqueContactPersons.size

    // Count total calls
    const callsTotal = allInteractions?.length || 0

    // Find latest interaction per client
    const latestInteractionsMap = new Map()
    allInteractions?.forEach(interaction => {
      const clientId = interaction.client_id
      const existing = latestInteractionsMap.get(clientId)
      if (!existing || new Date(interaction.created_at) > new Date(existing.created_at)) {
        latestInteractionsMap.set(clientId, interaction)
      }
    })

    const latestInteractions = Array.from(latestInteractionsMap.values())

    // Count searched
    const searchedTotal = allLeads?.length || 0

    // Count not picked
    const notPickedStatuses = ['not picked', 'notpick', 'np', 'no pick']
    const notPickedInteractions = latestInteractions.filter(i => 
      notPickedStatuses.includes(String(i.status).toLowerCase())
    )
    const notPickedTotal = notPickedInteractions.length

    // Calculate picked
    const pickedTotal = callsTotal - notPickedTotal

    // Count onboarded
    const onboardedInteractions = latestInteractions.filter(i => 
      String(i.status || '').toLowerCase().includes('onboard')
    )
    const onboardedTotal = onboardedInteractions.length

    // Count interested
    const interestedInteractions = latestInteractions.filter(i => 
      String(i.status || '').trim().toLowerCase() === 'interested'
    )
    const interestedTotal = interestedInteractions.length

    // Count contracts
    const contractsInteractions = latestInteractions.filter(i => 
      String(i.sub_status || '').trim().toLowerCase() === 'contract share'
    )
    const contractsTotal = contractsInteractions.length

    // Count sent to manager
    let sentToManagerLeads = allLeads?.filter(lead => lead.sent_to_sm === true) || []
    
    if (fromDate && toDate) {
      sentToManagerLeads = sentToManagerLeads.filter(lead => {
        if (!lead.lock_date) return false
        const lockDate = new Date(lead.lock_date)
        return lockDate >= new Date(fromDate) && lockDate <= new Date(toDate + 'T23:59:59')
      })
    }

    const sentTotal = sentToManagerLeads.length

    return NextResponse.json({
      success: true,
      data: {
        searched: searchedTotal,
        contacts: contactsTotal,
        calls: callsTotal,
        picked: pickedTotal,
        notPicked: notPickedTotal,
        onboarded: onboardedTotal,
        interested: interestedTotal,
        contracts: contractsTotal,
        sentToManager: sentTotal
      }
    })

  } catch (error) {
    console.error('LeadGen metrics API error:', error)
    return NextResponse.json({ error: 'Internal server error: ' + error.message }, { status: 500 })
  }
}
