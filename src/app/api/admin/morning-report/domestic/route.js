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

    // Get current month date range
    const now = new Date()
    const currentYear = now.getFullYear()
    const currentMonth = now.getMonth() + 1
    const startDate = `${currentYear}-${String(currentMonth).padStart(2, '0')}-01`
    const endDate = `${currentYear}-${String(currentMonth).padStart(2, '0')}-${new Date(currentYear, currentMonth, 0).getDate()}`

    // If filter is provided, return detailed data
    if (filter !== 'all') {
      let details = []
      let filterTitle = 'All Records'
      
      // Get yesterday's date for comparison
      const yesterday = new Date(now)
      yesterday.setDate(yesterday.getDate() - 1)
      if (yesterday.getDay() === 0) { // Sunday
          yesterday.setDate(yesterday.getDate() - 1) // Go back to Saturday
      }
      const yesterdayStr = yesterday.toISOString().split('T')[0]

      // Get the most recent contact_date available in the database
      // Fetch only dates that are NOT today, ordered by descending, limit 1
      const today = new Date().toISOString().split('T')[0]
      
      const { data: latestDateDataArray } = await supabaseServer
        .from('domestic_clients_interaction')
        .select('contact_date')
        .neq('contact_date', today)  // Exclude today's date
        .order('contact_date', { ascending: false })
        .limit(1)
        .single()

      let lastWorkingDayStr = latestDateDataArray?.contact_date || yesterdayStr

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

      switch (filter) {
        case 'yesterday-visits':
          filterTitle = 'Yesterday Visits'
          // Get all clients visited on last working day
          const { data: visitInteractions } = await supabaseServer
            .from('domestic_clients_interaction')
            .select('client_id, user_id, contact_date, contact_mode, contact_person, contact_no, email, remarks, next_follow_up, status, sub_status')
            .eq('contact_date', lastWorkingDayStr)
            .ilike('contact_mode', 'visit')
          
          const visitedClientIds = [...new Set(visitInteractions?.map(r => r.client_id).filter(Boolean) || [])]
          
          if (visitedClientIds.length > 0) {
            const { data: visitedClients } = await supabaseServer
              .from('domestic_clients')
              .select('*')
              .in('client_id', visitedClientIds)
            
            const { data: allVisitInteractions } = await supabaseServer
              .from('domestic_clients_interaction')
              .select('client_id, user_id, contact_date, contact_person, contact_no, email, remarks, next_follow_up, status, sub_status')
              .in('client_id', visitedClientIds)
              .eq('contact_date', lastWorkingDayStr)
            
            const visitInteractionsMap = new Map()
            allVisitInteractions?.forEach(interaction => {
              if (!visitInteractionsMap.has(interaction.client_id)) {
                visitInteractionsMap.set(interaction.client_id, interaction)
              }
            })
            
            // Get user names for owners using user_id from interactions
            const visitedOwnerIds = [...new Set(allVisitInteractions?.map(c => c.user_id).filter(Boolean) || [])]
            const userNamesMap = await getUserNames(visitedOwnerIds)
            
            details = visitedClients?.map(client => {
              const interaction = visitInteractionsMap.get(client.client_id)
              const ownerName = userNamesMap.get(interaction?.user_id) || interaction?.user_id || 'Unknown'
              return {
                id: client.client_id,
                client_id: client.client_id,
                companyName: client.company_name,
                contactName: interaction?.contact_person || client.contact_person || '',
                contactNumber: interaction?.contact_no || client.contact_no || '',
                email: interaction?.email || '',
                lastInteraction: interaction?.remarks || '',
                lastInteractionDate: interaction?.contact_date || '',
                nextFollowup: interaction?.next_follow_up || '',
                status: interaction?.status || '',
                substatus: interaction?.sub_status || '',
                projection: client.projection || '',
                owner: ownerName
              }
            }) || []
          }
          break

        case 'individual-repeat':
          filterTitle = 'Individual / Repeat Visits'
          // Get Individual and Repeat clients for last working day
          const { data: irVisitData, error: irVisitError } = await supabaseServer
            .from('domestic_clients_interaction')
            .select('client_id, user_id, contact_date, contact_person, contact_no, email, remarks, next_follow_up, status, sub_status')
            .eq('contact_date', lastWorkingDayStr)
            .ilike('contact_mode', 'visit')
          
          const irUniqueClientMap = new Map()
          irVisitData?.forEach(record => {
            if (!irUniqueClientMap.has(record.client_id)) {
              irUniqueClientMap.set(record.client_id, record.contact_date)
            }
          })

          const irClientIds = Array.from(irUniqueClientMap.keys())
          
          if (irClientIds.length > 0) {
            // Get client data - use * like yesterday-visits
            const { data: irClientData, error: irClientError } = await supabaseServer
              .from('domestic_clients')
              .select('*')
              .in('client_id', irClientIds)
            
            // Get interactions on the same day - like yesterday-visits does
            const { data: irInteractions, error: irInteractionsError } = await supabaseServer
              .from('domestic_clients_interaction')
              .select('client_id, user_id, contact_date, contact_person, contact_no, email, remarks, next_follow_up, status, sub_status')
              .in('client_id', irClientIds)
              .eq('contact_date', lastWorkingDayStr)
            
            // Debug
            console.log('irClientData:', irClientData)
            console.log('irInteractions:', irInteractions)
            
            const irInteractionsMap = new Map()
            irInteractions?.forEach(interaction => {
              if (!irInteractionsMap.has(interaction.client_id)) {
                irInteractionsMap.set(interaction.client_id, interaction)
              }
            })

            const clientSourcingMap = new Map()
            irClientData?.forEach(client => {
              clientSourcingMap.set(client.client_id, client.sourcing_date)
            })

            // Get user names for owners using user_id from interactions
            const irOwnerIds = [...new Set(irInteractions?.map(c => c.user_id).filter(Boolean) || [])]
            const irUserNamesMap = await getUserNames(irOwnerIds)
            
            details = irClientData?.map(client => {
              const interaction = irInteractionsMap.get(client.client_id)
              const sourcingDate = clientSourcingMap.get(client.client_id)
              const contactDate = irUniqueClientMap.get(client.client_id)
              
              // Handle null/undefined dates and compare properly
              let visitType = 'Repeat'
              if (sourcingDate && contactDate) {
                // Compare just the date part (YYYY-MM-DD) to handle any format differences
                const sourcingStr = String(sourcingDate).split('T')[0]
                const contactStr = String(contactDate).split('T')[0]
                visitType = (sourcingStr === contactStr) ? 'Individual' : 'Repeat'
              }
              
              const ownerName = irUserNamesMap.get(interaction?.user_id) || interaction?.user_id || 'Unknown'
              return {
                id: client.client_id,
                client_id: client.client_id,
                companyName: client.company_name,
                contactName: interaction?.contact_person || client.contact_person || '',
                contactNumber: interaction?.contact_no || client.contact_no || '',
                email: interaction?.email || '',
                lastInteraction: interaction?.remarks || '',
                lastInteractionDate: interaction?.contact_date || '',
                nextFollowup: interaction?.next_follow_up || '',
                status: visitType,
                substatus: interaction?.sub_status || '',
                projection: client.projection || '',
                owner: ownerName
              }
            }) || []
          }
          break

        case 'total-onboard':
          filterTitle = 'Total Onboard (Current Month)'
          // Get all clients with Onboarded status in current month
          const { data: onboardData } = await supabaseServer
            .from('domestic_clients_interaction')
            .select('client_id, user_id, status, contact_date')
            .gte('contact_date', startDate)
            .lte('contact_date', endDate)
            .ilike('status', 'Onboarded')
          
          // Get unique client IDs
          const onboardClientIds = [...new Set(onboardData?.map(r => r.client_id).filter(Boolean) || [])]
          
          if (onboardClientIds.length > 0) {
            const { data: clientData } = await supabaseServer
              .from('domestic_clients')
              .select('*')
              .in('client_id', onboardClientIds)
            
            // Get latest interactions for each client
            const { data: allInteractions } = await supabaseServer
              .from('domestic_clients_interaction')
              .select('client_id, user_id, contact_date, contact_person, contact_no, email, remarks, next_follow_up, status, sub_status')
              .in('client_id', onboardClientIds)
              .order('contact_date', { ascending: false })
            
            // Group interactions by client_id and get the latest
            const latestInteractionsMap = new Map()
            allInteractions?.forEach(interaction => {
              if (!latestInteractionsMap.has(interaction.client_id)) {
                latestInteractionsMap.set(interaction.client_id, interaction)
              }
            })
            
            // Get user names for owners using user_id from interactions
            const onboardOwnerIds = [...new Set(allInteractions?.map(c => c.user_id).filter(Boolean) || [])]
            const onboardUserNamesMap = await getUserNames(onboardOwnerIds)
            
            details = clientData?.map(client => {
              const interaction = latestInteractionsMap.get(client.client_id)
              const ownerName = onboardUserNamesMap.get(interaction?.user_id) || interaction?.user_id || 'Unknown'
              return {
                id: client.client_id,
                client_id: client.client_id,
                companyName: client.company_name,
                contactName: interaction?.contact_person || client.contact_person || '',
                contactNumber: interaction?.contact_no || client.contact_no || '',
                email: interaction?.email || '',
                lastInteraction: interaction?.remarks || '',
                lastInteractionDate: interaction?.contact_date || '',
                nextFollowup: interaction?.next_follow_up || '',
                status: 'Onboarded',
                substatus: interaction?.sub_status || '',
                projection: client.projection || '',
                owner: ownerName
              }
            }) || []
          }
          break

        case 'onboarded-yesterday':
          filterTitle = 'Onboarded (Yesterday)'
          // Get clients with Onboarded status on last working day
          const { data: yesterdayOnboardData } = await supabaseServer
            .from('domestic_clients_interaction')
            .select('client_id, user_id, status, contact_date')
            .eq('contact_date', lastWorkingDayStr)
            .ilike('status', 'Onboarded')
          
          const yesterdayOnboardClientIds = [...new Set(yesterdayOnboardData?.map(r => r.client_id).filter(Boolean) || [])]
          
          if (yesterdayOnboardClientIds.length > 0) {
            const { data: yesterdayClientData } = await supabaseServer
              .from('domestic_clients')
              .select('*')
              .in('client_id', yesterdayOnboardClientIds)
            
            const { data: yesterdayInteractions } = await supabaseServer
              .from('domestic_clients_interaction')
              .select('client_id, user_id, contact_date, contact_person, contact_no, email, remarks, next_follow_up, status, sub_status')
              .in('client_id', yesterdayOnboardClientIds)
              .eq('contact_date', lastWorkingDayStr)
            
            const yesterdayInteractionsMap = new Map()
            yesterdayInteractions?.forEach(interaction => {
              yesterdayInteractionsMap.set(interaction.client_id, interaction)
            })
            
            // Get user names for owners using user_id from interactions
            const yesterdayOnboardOwnerIds = [...new Set(yesterdayInteractions?.map(c => c.user_id).filter(Boolean) || [])]
            const yesterdayOnboardUserNamesMap = await getUserNames(yesterdayOnboardOwnerIds)
            
            details = yesterdayClientData?.map(client => {
              const interaction = yesterdayInteractionsMap.get(client.client_id)
              const ownerName = yesterdayOnboardUserNamesMap.get(interaction?.user_id) || interaction?.user_id || 'Unknown'
              return {
                id: client.client_id,
                client_id: client.client_id,
                companyName: client.company_name,
                contactName: interaction?.contact_person || client.contact_person || '',
                contactNumber: interaction?.contact_no || client.contact_no || '',
                email: interaction?.email || '',
                lastInteraction: interaction?.remarks || '',
                lastInteractionDate: interaction?.contact_date || '',
                nextFollowup: interaction?.next_follow_up || '',
                status: 'Onboarded',
                substatus: interaction?.sub_status || '',
                projection: client.projection || '',
                owner: ownerName
              }
            }) || []
          }
          break

        case 'reached-out':
          filterTitle = 'Reached Out (Yesterday)'
          // Get clients with Reached Out status on last working day
          const { data: reachedOutData } = await supabaseServer
            .from('domestic_clients_interaction')
            .select('client_id, user_id, status, contact_date')
            .eq('contact_date', lastWorkingDayStr)
            .ilike('status', 'Reached Out')
          
          const reachedOutClientIds = [...new Set(reachedOutData?.map(r => r.client_id).filter(Boolean) || [])]
          
          if (reachedOutClientIds.length > 0) {
            const { data: reachedOutClients } = await supabaseServer
              .from('domestic_clients')
              .select('*')
              .in('client_id', reachedOutClientIds)
            
            const { data: reachedOutInteractions } = await supabaseServer
              .from('domestic_clients_interaction')
              .select('client_id, user_id, contact_date, contact_person, contact_no, email, remarks, next_follow_up, status, sub_status')
              .in('client_id', reachedOutClientIds)
              .eq('contact_date', lastWorkingDayStr)
            
            const reachedOutMap = new Map()
            reachedOutInteractions?.forEach(interaction => {
              reachedOutMap.set(interaction.client_id, interaction)
            })
            
            // Get user names for owners using user_id from interactions
            const reachedOutOwnerIds = [...new Set(reachedOutInteractions?.map(c => c.user_id).filter(Boolean) || [])]
            const reachedOutUserNamesMap = await getUserNames(reachedOutOwnerIds)
            
            details = reachedOutClients?.map(client => {
              const interaction = reachedOutMap.get(client.client_id)
              const ownerName = reachedOutUserNamesMap.get(interaction?.user_id) || interaction?.user_id || 'Unknown'
              return {
                id: client.client_id,
                client_id: client.client_id,
                companyName: client.company_name,
                contactName: interaction?.contact_person || client.contact_person || '',
                contactNumber: interaction?.contact_no || client.contact_no || '',
                email: interaction?.email || '',
                lastInteraction: interaction?.remarks || '',
                lastInteractionDate: interaction?.contact_date || '',
                nextFollowup: interaction?.next_follow_up || '',
                status: 'Reached Out',
                substatus: interaction?.sub_status || '',
                projection: client.projection || '',
                owner: ownerName
              }
            }) || []
          }
          break

        case 'interested':
          filterTitle = 'Interested (Yesterday)'
          // Get clients with Interested status on last working day
          const { data: interestedData } = await supabaseServer
            .from('domestic_clients_interaction')
            .select('client_id, user_id, status, contact_date')
            .eq('contact_date', lastWorkingDayStr)
            .ilike('status', 'Interested')
          
          const interestedClientIds = [...new Set(interestedData?.map(r => r.client_id).filter(Boolean) || [])]
          
          if (interestedClientIds.length > 0) {
            const { data: interestedClients } = await supabaseServer
              .from('domestic_clients')
              .select('*')
              .in('client_id', interestedClientIds)
            
            const { data: interestedInteractions } = await supabaseServer
              .from('domestic_clients_interaction')
              .select('client_id, user_id, contact_date, contact_person, contact_no, email, remarks, next_follow_up, status, sub_status')
              .in('client_id', interestedClientIds)
              .eq('contact_date', lastWorkingDayStr)
            
            const interestedMap = new Map()
            interestedInteractions?.forEach(interaction => {
              interestedMap.set(interaction.client_id, interaction)
            })
            
            // Get user names for owners using user_id from interactions
            const interestedOwnerIds = [...new Set(interestedInteractions?.map(c => c.user_id).filter(Boolean) || [])]
            const interestedUserNamesMap = await getUserNames(interestedOwnerIds)
            
            details = interestedClients?.map(client => {
              const interaction = interestedMap.get(client.client_id)
              const ownerName = interestedUserNamesMap.get(interaction?.user_id) || interaction?.user_id || 'Unknown'
              return {
                id: client.client_id,
                client_id: client.client_id,
                companyName: client.company_name,
                contactName: interaction?.contact_person || client.contact_person || '',
                contactNumber: interaction?.contact_no || client.contact_no || '',
                email: interaction?.email || '',
                lastInteraction: interaction?.remarks || '',
                lastInteractionDate: interaction?.contact_date || '',
                nextFollowup: interaction?.next_follow_up || '',
                status: 'Interested',
                substatus: interaction?.sub_status || '',
                projection: client.projection || '',
                owner: ownerName
              }
            }) || []
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

    // Original code for summary data (when no filter or filter is 'yesterday-visits' or 'individual-repeat')
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

    // Get the most recent contact_date available in the database
    // Exclude today's date to get the last working day's data
    const today=new Date().toISOString().split('T')[0]
    const { data: latestDateDataSummary, error: latestDateError } = await supabaseServer
      .from('domestic_clients_interaction')
      .select('contact_date')
      .neq('contact_date', today)  // Exclude today's date
      .order('contact_date', { ascending: false })
      .limit(1)
      .single()

    let lastWorkingDayStr = latestDateDataSummary?.contact_date || yesterdayStr

    if (latestDateError) {
      console.error('Latest date error:', latestDateError)
    }

    // Get last working day's visits (distinct client + date)
    const { data: yesterdayData, error: yesterdayError } = await supabaseServer
      .from('domestic_clients_interaction')
      .select('client_id, contact_date')
      .eq('contact_date', lastWorkingDayStr)
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

    // Get last working day's onboarded (unique client_ids where status = 'Onboarded')
    const { data: yesterdayOnboardData, error: yesterdayOnboardError } = await supabaseServer
      .from('domestic_clients_interaction')
      .select('client_id, status, contact_date')
      .eq('contact_date', lastWorkingDayStr)
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

    // Get last working day's Reached Out and Interested (unique client_ids)
    const { data: yesterdayStatusData, error: yesterdayStatusError } = await supabaseServer
      .from('domestic_clients_interaction')
      .select('client_id, status, contact_date')
      .eq('contact_date', lastWorkingDayStr)

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
      .eq('contact_date', lastWorkingDayStr)
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
        yesterdayInterested,
        lastWorkingDay: lastWorkingDayStr
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
