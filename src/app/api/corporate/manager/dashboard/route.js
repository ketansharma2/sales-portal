import { supabaseServer } from '@/lib/supabase-server';
import { NextResponse } from 'next/server';

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
    const leadgen_id = searchParams.get('leadgen_id')
    const fromDate = searchParams.get('from_date')
    const toDate = searchParams.get('to_date')

    const { data: leadgenUsers, error: leadgenError } = await supabaseServer
      .from('users')
      .select('user_id, name')
      .eq('manager_id', user.id)
      .contains('role', ['LEADGEN'])

    if (leadgenError) {
      console.error('LeadGen fetch error:', leadgenError)
    }

    let leadgenIdsToQuery = []
    if (leadgen_id && leadgen_id !== 'All') {
      leadgenIdsToQuery = [leadgen_id]
    } else if (leadgenUsers && leadgenUsers.length > 0) {
      leadgenIdsToQuery = leadgenUsers.map(lg => lg.user_id)
    }

    let filterFromDate = fromDate
    let filterToDate = toDate

    if (fromDate && toDate) {
      // Use provided dates
    } else if (leadgenIdsToQuery.length > 0) {
      // Get the latest interaction date across all selected users
      const { data: latestInteraction } = await supabaseServer
        .from('corporate_leadgen_interaction')
        .select('date')
        .in('leadgen_id', leadgenIdsToQuery)
        .order('date', { ascending: false })
        .limit(1)
        .single()

      if (latestInteraction && latestInteraction.date) {
        filterFromDate = latestInteraction.date
        filterToDate = latestInteraction.date
      }
    }
    // If no latest date found, filterDates stay undefined (fetch all)

    const getLeadDateFilter = (query) => {
      if (filterFromDate && filterToDate) {
        return query.gte('sourcing_date', filterFromDate).lte('sourcing_date', filterToDate)
      }
      return query
    }

    const getInteractionDateFilter = (query) => {
      if (filterFromDate && filterToDate) {
        return query.gte('date', filterFromDate).lte('date', filterToDate)
      }
      return query
    }

    let searchedTotal = 0
    let searchedStartup = 0
    let normalLeads = 0
    let normalCalls = 0
    let contactsTotal = 0
    let contactsStartup = 0
    let callsTotal = 0
    let callsStartupVal = 0
    let newCallsTotal = 0
    let newCallsStartup = 0
    let followupCallsTotal = 0
    let followupCallsStartup = 0
    let pickedTotal = 0
    let pickedStartup = 0
    let notPickedTotal = 0
    let notPickedStartup = 0
    let contractTotal = 0
    let contractStartup = 0
    let sentToManagerTotal = 0
    let sentToManagerStartup = 0
    let onboardedTotal = 0
    let onboardedStartup = 0
    let interestedTotal = 0
    let interestedStartup = 0
    let startupLeads = 0
    let startupCalls = 0
    let masterUnionCompany = 0
    let masterUnionProfiles = 0
    let masterUnionCalling = 0
    let franchiseDiscussed = 0
    let franchiseFormAsk = 0
    let franchiseFormShared = 0
    let franchiseAccepted = 0

    if (leadgenIdsToQuery.length > 0) {
      const { data: leadsData, error: leadsError } = await getLeadDateFilter(
        supabaseServer.from('corporate_leadgen_leads').select('*')
      ).in('leadgen_id', leadgenIdsToQuery)

      if (!leadsError && leadsData) {
        searchedTotal = leadsData.length
        searchedStartup = leadsData.filter(l => l.startup === 'Yes').length
        normalLeads = leadsData.filter(l => l.startup !== 'Yes').length

        for (const lead of leadsData) {
          if (lead.status === 'Connected' || lead.status === 'Connected to Franchise') contactsTotal++
          if ((lead.status === 'Connected' || lead.status === 'Connected to Franchise') && lead.startup === 'Yes') contactsStartup++
          if (lead.franchise_status === 'Sent to Manager') {
            sentToManagerTotal++
            if (lead.startup === 'Yes') sentToManagerStartup++
          }
          if (lead.franchise_status === 'Discussed') {
            franchiseDiscussed++
            if (lead.startup === 'Yes') startupLeads++
          }
          if (lead.franchise_status === 'Form Ask') {
            franchiseFormAsk++
          }
          if (lead.franchise_status === 'Form Shared') {
            franchiseFormShared++
          }
          if (lead.franchise_status === 'Accepted') {
            franchiseAccepted++
          }
        }
      }

      const { data: interactionsData, error: interactionsError } = await getInteractionDateFilter(
        supabaseServer.from('corporate_leadgen_interaction').select('*')
      ).in('leadgen_id', leadgenIdsToQuery)

      if (!interactionsError && interactionsData) {
        callsTotal = interactionsData.length
        callsStartupVal = interactionsData.filter(i => i.startup === 'Yes').length
        newCallsTotal = interactionsData.filter(i => i.call_type === 'New').length
        newCallsStartup = interactionsData.filter(i => i.call_type === 'New' && i.startup === 'Yes').length
        followupCallsTotal = interactionsData.filter(i => i.call_type === 'Followup').length
        followupCallsStartup = interactionsData.filter(i => i.call_type === 'Followup' && i.startup === 'Yes').length
        pickedTotal = interactionsData.filter(i => i.call_status === 'Picked').length
        pickedStartup = interactionsData.filter(i => i.call_status === 'Picked' && i.startup === 'Yes').length
        notPickedTotal = interactionsData.filter(i => i.call_status === 'Not Picked').length
        notPickedStartup = interactionsData.filter(i => i.call_status === 'Not Picked' && i.startup === 'Yes').length
        contractTotal = interactionsData.filter(i => i.call_status === 'Contract Shared').length
        contractStartup = interactionsData.filter(i => i.call_status === 'Contract Shared' && i.startup === 'Yes').length
        onboardedTotal = interactionsData.filter(i => i.call_status === 'Onboarded').length
        onboardedStartup = interactionsData.filter(i => i.call_status === 'Onboarded' && i.startup === 'Yes').length
        interestedTotal = interactionsData.filter(i => i.status === 'Interested').length
        interestedStartup = interactionsData.filter(i => i.status === 'Interested' && i.startup === 'Yes').length
        startupCalls = callsStartupVal
      }

      const { data: masterData, error: masterError } = await getInteractionDateFilter(
        supabaseServer.from('corporate_master_union').select('*')
      ).in('leadgen_id', leadgenIdsToQuery)

      if (!masterError && masterData) {
        masterUnionCompany = masterData.length
        masterUnionProfiles = masterData.reduce((sum, m) => sum + (m.profiles_shared || 0), 0)
        masterUnionCalling = masterData.filter(m => m.call_status === 'Connected').length
      }
    }

    const kpiData = {
      searched: { total: searchedTotal, startup: searchedStartup },
      normal: { leads: normalLeads, calls: normalCalls },
      contacts: { total: contactsTotal, startup: contactsStartup },
      calls: { 
        total: callsTotal, 
        startup: callsStartupVal, 
        new: { total: newCallsTotal, startup: newCallsStartup }, 
        followup: { total: followupCallsTotal, startup: followupCallsStartup } 
      },
      picked: { total: pickedTotal, startup: pickedStartup },
      notPicked: { total: notPickedTotal, startup: notPickedStartup },
      contract: { total: contractTotal, startup: contractStartup },
      sentToManager: { total: sentToManagerTotal, startup: sentToManagerStartup },
      onboarded: { total: onboardedTotal, startup: onboardedStartup },
      interested: { total: interestedTotal, startup: interestedStartup },
      startup: { leads: startupLeads, calls: startupCalls },
      masterUnion: { company: masterUnionCompany, profiles: masterUnionProfiles, calling: masterUnionCalling },
      franchise: { 
        discussed: { total: franchiseDiscussed }, 
        formAsk: { total: franchiseFormAsk }, 
        formShared: { total: franchiseFormShared }, 
        accepted: { total: franchiseAccepted } 
      }
    }

    const dashboardData = {
      kpiData,
      leadgenList: leadgenUsers?.map(lg => ({
        user_id: lg.user_id,
        name: lg.name
      })) || []
    }

    return NextResponse.json({
      success: true,
      data: dashboardData
    })

  } catch (error) {
    console.error('Corporate Manager Dashboard API error:', error)
    return NextResponse.json({
      error: 'Internal server error',
      details: error.message
    }, { status: 500 })
  }
}