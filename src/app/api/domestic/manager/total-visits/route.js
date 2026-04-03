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
      .select('user_id, name, email, role')
      .contains('role', ['FSE'])
      .eq('manager_id', user.id)
      .order('name')

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
          totalVisits: 0,
          fseCount: 0
        }
      })
    }

    // Calculate total visits for each FSE and sum them up
    let totalManagerVisits = 0
    const fseVisitsPromises = team.map(async (fse) => {
      try {
        // Count unique clients with at least 1 visit for this FSE
        const { count: visitsCount, error: visitsError } = await supabaseServer
          .from('domestic_clients_interaction')
          .select('client_id', { count: 'exact', head: true })
          .eq('user_id', fse.user_id)
          .ilike('contact_mode', 'visit')

        if (visitsError) {
          console.error(`Visits fetch error for FSE ${fse.name}:`, visitsError)
          return 0
        }

        // Get unique client IDs from visit interactions
        const { data: visitInteractions, error: dataError } = await supabaseServer
          .from('domestic_clients_interaction')
          .select('client_id')
          .eq('user_id', fse.user_id)
          .ilike('contact_mode', 'visit')

        if (dataError) {
          console.error(`Visit interactions fetch error for FSE ${fse.name}:`, dataError)
          return 0
        }

        const uniqueVisitClients = new Set(visitInteractions.map(i => i.client_id)).size
        return uniqueVisitClients
      } catch (error) {
        console.error(`Error processing FSE ${fse.name}:`, error)
        return 0
      }
    })

    // Wait for all FSE visit calculations to complete
    const fseVisitCounts = await Promise.all(fseVisitsPromises)
    totalManagerVisits = fseVisitCounts.reduce((sum, count) => sum + count, 0)

    return NextResponse.json({
      success: true,
      data: {
        totalVisits: totalManagerVisits,
        fseCount: team.length
      }
    })

  } catch (error) {
    console.error('Total visits API error:', error)
    return NextResponse.json({
      error: 'Internal server error',
      details: error.message
    }, { status: 500 })
  }
}