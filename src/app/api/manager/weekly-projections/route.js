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

    // Get query parameters
    const { searchParams } = new URL(request.url)
    const selectedFseId = searchParams.get('fse_id')
    const fromDate = searchParams.get('from_date')
    const toDate = searchParams.get('to_date')


    let userIdsToQuery = []

    if (selectedFseId && selectedFseId !== 'all') {
      // Verify the selected FSE belongs to this manager
      const { data: fseCheck, error: fseCheckError } = await supabaseServer
        .from('users')
        .select('user_id')
        .eq('user_id', selectedFseId)
        .contains('role', ['FSE'])
        .eq('manager_id', user.id)
        .single()

      if (fseCheckError || !fseCheck) {
        return NextResponse.json({
          error: 'Invalid FSE selection or access denied'
        }, { status: 403 })
      }

      userIdsToQuery = [selectedFseId]
    } else {
      // Get all FSE team user IDs
      const { data: fseTeam, error: fseError } = await supabaseServer
        .from('users')
        .select('user_id')
        .contains('role', ['FSE'])
        .eq('manager_id', user.id)

      if (fseError) {
        console.error('FSE team fetch error:', fseError)
        return NextResponse.json({
          error: 'Failed to fetch FSE team',
          details: fseError.message
        }, { status: 500 })
      }

      userIdsToQuery = fseTeam?.map(fse => fse.user_id) || []
    }

    if (userIdsToQuery.length === 0) {
      return NextResponse.json({
        success: true,
        data: { wpGreater50: 0, wpLess50: 0, total: 0 }
      })
    }

    // Query clients for weekly projections
    let query = supabaseServer
      .from('clients')
      .select('user_id, company, projection')
      .in('user_id', userIdsToQuery)
      .in('projection', ['WP > 50', 'WP < 50'])

    if (fromDate && toDate) {
      query = query.gte('latest_contact_date', fromDate).lte('latest_contact_date', toDate)
    }

    const { data: clientsData, error: clientsError } = await query

    if (clientsError) {
      console.error('Clients fetch error:', clientsError)
      return NextResponse.json({
        error: 'Failed to fetch projection data',
        details: clientsError.message
      }, { status: 500 })
    }

    // Count unique clients by projection type
    const projectionCounts = {
      'WP > 50': 0,
      'WP < 50': 0
    }

    // Use a Set to ensure uniqueness based on user_id + company
    const uniqueClients = new Set()

    clientsData?.forEach(client => {
      const uniqueKey = `${client.user_id}-${client.company}`
      if (!uniqueClients.has(uniqueKey)) {
        uniqueClients.add(uniqueKey)
        if (projectionCounts.hasOwnProperty(client.projection)) {
          projectionCounts[client.projection]++
        }
      }
    })

    const wpGreater50 = projectionCounts['WP > 50']
    const wpLess50 = projectionCounts['WP < 50']
    const total = wpGreater50 + wpLess50

    return NextResponse.json({
      success: true,
      data: {
        wpGreater50,
        wpLess50,
        total
      }
    })

  } catch (error) {
    console.error('Weekly projections API error:', error)
    return NextResponse.json({
      error: 'Internal server error',
      details: error.message
    }, { status: 500 })
  }
}