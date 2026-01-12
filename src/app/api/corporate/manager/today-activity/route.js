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

    // Get today's date
    const today = new Date().toISOString().split('T')[0]

    let userIdsToQuery = []

    if (selectedFseId && selectedFseId !== 'all') {
      // Verify the selected FSE belongs to this manager
      const { data: fseCheck, error: fseCheckError } = await supabaseServer
        .from('users')
        .select('user_id, name')
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
      // Get all FSE team user IDs and names
      const { data: fseTeam, error: fseError } = await supabaseServer
        .from('users')
        .select('user_id, name')
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
        data: []
      })
    }

    // Fetch today's DWR data
    const { data: dwrData, error: dwrError } = await supabaseServer
      .from('corporate_dwr_history')
      .select('user_id, total_visit, onboarded')
      .eq('dwr_date', today)
      .in('user_id', userIdsToQuery)

    if (dwrError) {
      console.error('DWR fetch error:', dwrError)
      return NextResponse.json({
        error: 'Failed to fetch today\'s activity',
        details: dwrError.message
      }, { status: 500 })
    }

    // Get FSE details for names and roles
    const { data: fseDetails, error: fseDetailsError } = await supabaseServer
      .from('users')
      .select('user_id, name, role')
      .in('user_id', userIdsToQuery)

    if (fseDetailsError) {
      console.error('FSE details fetch error:', fseDetailsError)
      return NextResponse.json({
        error: 'Failed to fetch FSE details',
        details: fseDetailsError.message
      }, { status: 500 })
    }

    // Combine data
    const activityData = fseDetails.map(fse => {
      const dwr = dwrData.find(d => d.user_id === fse.user_id)
      if (dwr) {
        const totalVisits = dwr.total_visit || 0
        const onboarded = dwr.onboarded || 0
        return {
          id: fse.user_id,
          name: fse.name,
          role: fse.role,
          visitsToday: totalVisits,
          onboardedToday: onboarded,
          status: totalVisits > 0 ? 'Active' : 'Absent',
          avatar: fse.name.charAt(0).toUpperCase()
        }
      } else {
        return {
          id: fse.user_id,
          name: fse.name,
          role: fse.role,
          visitsToday: 'N/A',
          onboardedToday: 'N/A',
          status: 'No Data',
          avatar: fse.name.charAt(0).toUpperCase()
        }
      }
    })

    return NextResponse.json({
      success: true,
      data: activityData
    })

  } catch (error) {
    console.error('Today\'s activity API error:', error)
    return NextResponse.json({
      error: 'Internal server error',
      details: error.message
    }, { status: 500 })
  }
}