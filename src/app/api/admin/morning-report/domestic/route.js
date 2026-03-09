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

    // Get current month date range
    const now = new Date()
    const currentYear = now.getFullYear()
    const currentMonth = now.getMonth() + 1
    const startDate = `${currentYear}-${String(currentMonth).padStart(2, '0')}-01`
    const endDate = `${currentYear}-${String(currentMonth).padStart(2, '0')}-${new Date(currentYear, currentMonth, 0).getDate()}`

    // Get distinct client_id + contact_date combinations where contact_mode = 'visit'
    // This counts each client once per day, even if visited multiple times
    const { data: visitData, error: visitError } = await supabaseServer
      .from('domestic_clients_interaction')
      .select('client_id, contact_date')
      .gte('contact_date', startDate)
      .lte('contact_date', endDate)
      .ilike('contact_mode', 'visit')

    if (visitError) {
      console.error('Visit data error:', visitError)
      return NextResponse.json({ error: visitError.message }, { status: 500 })
    }

    // Count distinct client_id + contact_date combinations
    const uniqueVisits = new Set()
    visitData?.forEach(record => {
      if (record.client_id && record.contact_date) {
        // Create a unique key combining client_id and contact_date
        uniqueVisits.add(`${record.client_id}_${record.contact_date}`)
      }
    })

    const totalVisits = uniqueVisits.size

    // Get total onboarded for CURRENT MONTH (unique client_ids where status = 'Onboarded')
    const { data: monthOnboardData, error: monthOnboardError } = await supabaseServer
      .from('domestic_clients_interaction')
      .select('client_id, status, contact_date')
      .gte('contact_date', startDate)
      .lte('contact_date', endDate)
      .ilike('status', 'Onboarded')

    if (monthOnboardError) {
      console.error('Month onboard error:', monthOnboardError)
    }

    // Get unique client_ids with Onboarded status for current month
    const monthOnboardClients = new Set()
    monthOnboardData?.forEach(record => {
      if (record.client_id) {
        monthOnboardClients.add(record.client_id)
      }
    })

    const totalOnboarded = monthOnboardClients.size

    // Get yesterday's date for comparison
    // If yesterday is Sunday (day 0), use Saturday instead
    const yesterday = new Date(now)
    yesterday.setDate(yesterday.getDate() - 1)
    if (yesterday.getDay() === 0) { // Sunday
        yesterday.setDate(yesterday.getDate() - 1) // Go back to Saturday
    }
    const yesterdayStr = yesterday.toISOString().split('T')[0]

    // Get yesterday's visits (distinct client + date)
    const { data: yesterdayData, error: yesterdayError } = await supabaseServer
      .from('domestic_clients_interaction')
      .select('client_id, contact_date')
      .eq('contact_date', yesterdayStr)
      .ilike('contact_mode', 'visit')

    if (yesterdayError) {
      console.error('Yesterday data error:', yesterdayError)
    }

    const yesterdayUniqueVisits = new Set()
    yesterdayData?.forEach(record => {
      if (record.client_id && record.contact_date) {
        yesterdayUniqueVisits.add(`${record.client_id}_${record.contact_date}`)
      }
    })

    const yesterdayVisits = yesterdayUniqueVisits.size

    // Get yesterday's onboarded (unique client_ids where status = 'Onboarded')
    const { data: yesterdayOnboardData, error: yesterdayOnboardError } = await supabaseServer
      .from('domestic_clients_interaction')
      .select('client_id, status, contact_date')
      .eq('contact_date', yesterdayStr)
      .ilike('status', 'Onboarded')

    if (yesterdayOnboardError) {
      console.error('Yesterday onboard error:', yesterdayOnboardError)
    }

    const yesterdayOnboardClients = new Set()
    yesterdayOnboardData?.forEach(record => {
      if (record.client_id) {
        yesterdayOnboardClients.add(record.client_id)
      }
    })

    const yesterdayOnboarded = yesterdayOnboardClients.size

    // Get company names for yesterday's onboarded clients
    const yesterdayOnboardClientIds = Array.from(yesterdayOnboardClients)
    let yesterdayOnboardNames = []

    if (yesterdayOnboardClientIds.length > 0) {
      const { data: onboardClientData, error: onboardClientError } = await supabaseServer
        .from('domestic_clients')
        .select('client_id, company_name')
        .in('client_id', yesterdayOnboardClientIds)

      if (onboardClientError) {
        console.error('Onboard client data error:', onboardClientError)
      }

      yesterdayOnboardNames = onboardClientData?.map(c => c.company_name).filter(name => name) || []
    }

    // Get yesterday's Reached Out and Interested (unique client_ids)
    const { data: yesterdayStatusData, error: yesterdayStatusError } = await supabaseServer
      .from('domestic_clients_interaction')
      .select('client_id, status, contact_date')
      .eq('contact_date', yesterdayStr)

    if (yesterdayStatusError) {
      console.error('Yesterday status error:', yesterdayStatusError)
    }

    // Get unique client_ids with their latest status for yesterday
    const yesterdayStatusMap = new Map()
    yesterdayStatusData?.forEach(record => {
      if (!yesterdayStatusMap.has(record.client_id)) {
        yesterdayStatusMap.set(record.client_id, record.status)
      }
    })

    const yesterdayReachedOut = Array.from(yesterdayStatusMap.values())
      .filter(status => status === 'Reached Out').length

    const yesterdayInterested = Array.from(yesterdayStatusMap.values())
      .filter(status => status === 'Interested').length

    // Get Individual and Repeat for last working day
    // Individual: sourcing_date = contact_date (new client)
    // Repeat: sourcing_date < contact_date (existing client)
    const { data: yesterdayVisitData, error: yesterdayVisitError } = await supabaseServer
      .from('domestic_clients_interaction')
      .select('client_id, contact_date')
      .eq('contact_date', yesterdayStr)
      .ilike('contact_mode', 'visit')

    if (yesterdayVisitError) {
      console.error('Yesterday visit clients error:', yesterdayVisitError)
    }

    // Get unique client IDs (one entry per client)
    const uniqueClientMap = new Map()
    yesterdayVisitData?.forEach(record => {
      if (!uniqueClientMap.has(record.client_id)) {
        uniqueClientMap.set(record.client_id, record.contact_date)
      }
    })

    const yesterdayClientIds = Array.from(uniqueClientMap.keys())
    
    let individualVisits = 0
    let repeatVisits = 0

    if (yesterdayClientIds.length > 0) {
      // Fetch sourcing dates for these unique clients
      const { data: clientData, error: clientError } = await supabaseServer
        .from('domestic_clients')
        .select('client_id, sourcing_date')
        .in('client_id', yesterdayClientIds)

      if (clientError) {
        console.error('Client data error:', clientError)
      }

      // Create map of client_id -> sourcing_date
      const clientSourcingMap = new Map()
      clientData?.forEach(client => {
        clientSourcingMap.set(client.client_id, client.sourcing_date)
      })

      // For each UNIQUE client, check if Individual or Repeat
      uniqueClientMap.forEach((contactDate, clientId) => {
        const sourcingDate = clientSourcingMap.get(clientId)
        if (sourcingDate === contactDate) {
          individualVisits++
        } else {
          repeatVisits++
        }
      })
    }

    return NextResponse.json({
      success: true,
      data: {
        currentMonth: now.toLocaleString('en-US', { month: 'long', year: 'numeric' }),
        totalVisits,
        yesterdayVisits,
        totalOnboarded,
        yesterdayOnboarded,
        yesterdayOnboardNames,
        individualVisits,
        repeatVisits,
        yesterdayReachedOut,
        yesterdayInterested
      }
    })

  } catch (error) {
    console.error('Morning report API error:', error)
    return NextResponse.json({
      error: 'Internal server error',
      details: error.message
    }, { status: 500 })
  }
}
