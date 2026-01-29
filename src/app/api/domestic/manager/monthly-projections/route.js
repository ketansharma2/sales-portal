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
        data: { mpGreater50: 0, mpLess50: 0, total: 0 }
      })
    }

    // Fetch interactions for each FSE in batches to avoid limits
    let allInteractions = []
    for (const userId of userIdsToQuery) {
      let offset = 0
      const batchSize = 1000
      while (true) {
        const { data: ints, error: intError } = await supabaseServer
          .from('domestic_clients_interaction')
          .select('client_id, contact_date, created_at, domestic_clients!inner(projection)')
          .eq('user_id', userId)
          .order('client_id', { ascending: true })
          .order('contact_date', { ascending: false })
          .order('created_at', { ascending: false })
          .range(offset, offset + batchSize - 1)

        if (intError || !ints || ints.length === 0) break

        allInteractions.push(...ints)
        offset += batchSize

        if (ints.length < batchSize) break
      }
    }
    const interactions = allInteractions

    // Get latest projection per client
    const latestProjections = new Map()
    interactions?.forEach(int => {
      if (!latestProjections.has(int.client_id)) {
        latestProjections.set(int.client_id, int.domestic_clients.projection)
      }
    })

    // Count by projection type
    const projectionCounts = {
      'MP > 50': 0,
      'MP < 50': 0
    }

    latestProjections.forEach(proj => {
      const normalizedProj = proj ? proj.toLowerCase() : ''
      if (normalizedProj === 'mp > 50') {
        projectionCounts['MP > 50']++
      } else if (normalizedProj === 'mp < 50') {
        projectionCounts['MP < 50']++
      }
    })

    const mpGreater50 = projectionCounts['MP > 50']
    const mpLess50 = projectionCounts['MP < 50']
    const total = mpGreater50 + mpLess50

    return NextResponse.json({
      success: true,
      data: {
        mpGreater50,
        mpLess50,
        total
      }
    })

  } catch (error) {
    console.error('Monthly projections API error:', error)
    return NextResponse.json({
      error: 'Internal server error',
      details: error.message
    }, { status: 500 })
  }
}