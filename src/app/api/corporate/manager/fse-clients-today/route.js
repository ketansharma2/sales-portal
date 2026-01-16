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

    // Determine date range: use provided dates or default to current week (Monday to Saturday)
    let startDate, endDate;
    if (fromDate && toDate) {
      startDate = fromDate;
      endDate = toDate;
    } else {
      const now = new Date()
      const dayOfWeek = now.getDay() // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
      const monday = new Date(now)
      monday.setDate(now.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1)) // Monday of current week
      startDate = monday.toISOString().split('T')[0]
      const saturday = new Date(monday)
      saturday.setDate(monday.getDate() + 5) // Saturday
      endDate = saturday.toISOString().split('T')[0]
    }

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
        data: []
      })
    }

    // Fetch interactions in the date range with client details
    const { data: interactions, error: intError } = await supabaseServer
      .from('corporate_clients_interaction')
      .select(`
        user_id,
        client_id,
        contact_date,
        contact_mode,
        contact_person,
        contact_no,
        email,
        remarks,
        next_follow_up,
        status,
        sub_status,
        projection,
        corporate_clients!inner(
          company_name,
          location,
          state
        ),
        users!inner(name)
      `)
      .gte('contact_date', startDate)
      .lte('contact_date', endDate)
      .in('user_id', userIdsToQuery)
      .order('client_id', { ascending: true })
      .order('contact_date', { ascending: false })
      .order('created_at', { ascending: false })

    if (intError) {
      console.error('Interactions fetch error:', intError)
      return NextResponse.json({
        error: 'Failed to fetch today\'s clients',
        details: intError.message
      }, { status: 500 })
    }

    // Get latest interaction per client
    const latestInteractions = new Map()
    interactions?.forEach(int => {
      if (!latestInteractions.has(int.client_id)) {
        latestInteractions.set(int.client_id, int)
      }
    })

    // Format the data
    const formattedData = Array.from(latestInteractions.values()).map((int, index) => ({
      id: `${int.user_id}-${int.client_id}-${index}`,
      fse: int.users.name,
      company: int.corporate_clients.company_name,
      location: `${int.corporate_clients.location || 'N/A'}, ${int.corporate_clients.state || ''}`.trim(),
      contact_person: int.contact_person || 'N/A',
      phone: int.contact_no || 'N/A',
      latest_date: int.contact_date,
      next_followup: int.next_follow_up || null,
      status: int.status || 'Unknown',
      sub_status: int.sub_status || 'N/A',
      projection: int.projection || 'N/A'
    }))

    return NextResponse.json({
      success: true,
      data: formattedData
    })

  } catch (error) {
    console.error('FSE clients today API error:', error)
    return NextResponse.json({
      error: 'Internal server error',
      details: error.message
    }, { status: 500 })
  }
}