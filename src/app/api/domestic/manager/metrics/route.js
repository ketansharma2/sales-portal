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

    // Check if user has MANAGER role
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

    // Fetch FSE team members under this manager
    const { data: team, error: teamError } = await supabaseServer
      .from('users')
      .select('user_id')
      .contains('role', ['FSE'])
      .eq('manager_id', user.id)

    if (teamError) {
      console.error('Team fetch error:', teamError)
      return NextResponse.json({
        error: 'Failed to fetch team',
        details: teamError.message
      }, { status: 500 })
    }

    if (!team || team.length === 0) {
      return NextResponse.json({
        success: true,
        data: {
          total: 0,
          individual: 0,
          repeat: 0,
          interested: 0,
          notInterested: 0,
          reachedOut: 0,
          onboard: 0
        }
      })
    }

    // Get today's date for filtering
    const today = new Date().toISOString().split('T')[0]
    const currentMonth = new Date().getMonth() + 1
    const currentYear = new Date().getFullYear()
    const startDate = `${currentYear}-${String(currentMonth).padStart(2, '0')}-01`

    // Initialize aggregated metrics
    const aggregatedMetrics = {
      total: 0,
      individual: 0,
      repeat: 0,
      interested: 0,
      notInterested: 0,
      reachedOut: 0,
      onboard: 0
    }

    // Fetch metrics for each FSE and aggregate them
    const fseMetricsPromises = team.map(async (fse) => {
      try {
        // Get today's date for filtering
        const today = new Date().toISOString().split('T')[0]
        const currentMonth = new Date().getMonth() + 1
        const currentYear = new Date().getFullYear()
        const startDate = `${currentYear}-${String(currentMonth).padStart(2, '0')}-01`

        // Get total interactions (visits) - unique clients with visit mode
        const { data: visitInteractions, error: visitError } = await supabaseServer
          .from('domestic_clients_interaction')
          .select('client_id, contact_mode, status, created_at')
          .eq('user_id', fse.user_id)
          .ilike('contact_mode', 'visit')
          .gte('contact_date', startDate)
          .lte('contact_date', today)
          .order('created_at', { ascending: false })

        if (visitError) {
          console.error(`Visit interactions error for FSE ${fse.user_id}:`, visitError)
          return { total: 0, individual: 0, repeat: 0, interested: 0, notInterested: 0, reachedOut: 0, onboard: 0 }
        }

        // Get unique clients visited today
        const uniqueVisitClients = new Set(visitInteractions.map(i => i.client_id)).size
        
        // Get individual visits (clients sourced today)
        const { count: individualVisitsCount, error: individualError } = await supabaseServer
          .from('domestic_clients')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', fse.user_id)
          .gte('sourcing_date', startDate)
          .lte('sourcing_date', today)

        // Get all interactions for status breakdown (unique latest per client)
        const { data: allInteractions, error: interactionsError } = await supabaseServer
          .from('domestic_clients_interaction')
          .select('client_id, status, contact_mode')
          .eq('user_id', fse.user_id)
          .gte('contact_date', startDate)
          .lte('contact_date', today)
          .order('client_id', { ascending: true })
          .order('contact_date', { ascending: false })
          .order('created_at', { ascending: false })

        if (interactionsError) {
          console.error(`All interactions error for FSE ${fse.user_id}:`, interactionsError)
          return { total: uniqueVisitClients, individual: individualVisitsCount || 0, repeat: 0, interested: 0, notInterested: 0, reachedOut: 0, onboard: 0 }
        }

        // Get latest status per client
        const latestStatuses = new Map()
        allInteractions?.forEach(interaction => {
          if (!latestStatuses.has(interaction.client_id)) {
            latestStatuses.set(interaction.client_id, {
              status: interaction.status,
              contactMode: interaction.contact_mode
            })
          }
        })

        // Count statuses
        const statusCounts = {
          interested: 0,
          notInterested: 0,
          reachedOut: 0,
          onboard: 0
        }

        latestStatuses.forEach((data) => {
          const status = data.status?.toLowerCase() || ''
          if (status === 'interested') statusCounts.interested++
          else if (status === 'not interested') statusCounts.notInterested++
          else if (status === 'reached out') statusCounts.reachedOut++
          else if (status === 'onboarded') statusCounts.onboard++
        })

        // Calculate repeat visits (total visits - individual visits)
        const repeatVisits = Math.max(0, uniqueVisitClients - (individualVisitsCount || 0))

        return {
          total: uniqueVisitClients,
          individual: individualVisitsCount || 0,
          repeat: repeatVisits,
          interested: statusCounts.interested,
          notInterested: statusCounts.notInterested,
          reachedOut: statusCounts.reachedOut,
          onboard: statusCounts.onboard
        }
      } catch (error) {
        console.error(`Error processing FSE ${fse.user_id}:`, error)
        return { total: 0, individual: 0, repeat: 0, interested: 0, notInterested: 0, reachedOut: 0, onboard: 0 }
      }
    })

    // Wait for all FSE metrics to complete
    const fseMetricsResults = await Promise.all(fseMetricsPromises)

    // Aggregate metrics from all FSEs
    fseMetricsResults.forEach(metrics => {
      aggregatedMetrics.total += metrics.total
      aggregatedMetrics.individual += metrics.individual
      aggregatedMetrics.repeat += metrics.repeat
      aggregatedMetrics.interested += metrics.interested
      aggregatedMetrics.notInterested += metrics.notInterested
      aggregatedMetrics.reachedOut += metrics.reachedOut
      aggregatedMetrics.onboard += metrics.onboard
    })

    return NextResponse.json({
      success: true,
      data: aggregatedMetrics
    })

  } catch (error) {
    console.error('Manager metrics API error:', error)
    return NextResponse.json({
      error: 'Internal server error',
      details: error.message
    }, { status: 500 })
  }
}