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

    if (userProfile.role !== 'MANAGER') {
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
        .eq('role', 'FSE')
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
        .eq('role', 'FSE')
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

    // Fetch clients contacted in the date range
    const { data: clientsData, error: clientsError } = await supabaseServer
      .from('clients')
      .select(`
        user_id,
        company,
        location,
        contact_person,
        contact_no,
        latest_contact_date,
        next_follow_up,
        status,
        sub_status,
        projection,
        users!inner(name)
      `)
      .or(`sourcing_date.gte.${startDate},latest_contact_date.gte.${startDate}`)
      .or(`sourcing_date.lte.${endDate},latest_contact_date.lte.${endDate}`)
      .in('user_id', userIdsToQuery)

    if (clientsError) {
      console.error('Clients fetch error:', clientsError)
      return NextResponse.json({
        error: 'Failed to fetch today\'s clients',
        details: clientsError.message
      }, { status: 500 })
    }

    // Format the data
    const formattedData = clientsData.map((client, index) => ({
      id: `${client.user_id}-${client.company}-${index}`,
      fse: client.users.name,
      company: client.company,
      location: client.location || 'N/A',
      contact_person: client.contact_person || 'N/A',
      phone: client.contact_no || 'N/A',
      latest_date: client.latest_contact_date,
      next_followup: client.next_follow_up || null,
      status: client.status || 'Unknown',
      sub_status: client.sub_status || 'N/A',
      projection: client.projection || 'N/A'
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