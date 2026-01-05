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

    // Use provided dates or default to current month
    let monthStart, monthEnd;
    if (fromDate && toDate) {
      monthStart = fromDate;
      monthEnd = toDate;
    } else {
      // Get current month date range
      const now = new Date()
      const currentYear = now.getFullYear()
      const currentMonth = now.getMonth() + 1
      monthStart = `${currentYear}-${String(currentMonth).padStart(2, '0')}-01`

      // Calculate month end (last day of current month)
      const nextMonth = new Date(currentYear, currentMonth, 1)
      monthEnd = new Date(nextMonth.getTime() - 1).toISOString().split('T')[0]
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
        data: { onboarded: 0, month: `${new Date().toLocaleString('en-US', { month: 'long', year: 'numeric' }).toUpperCase()}` }
      })
    }

    // Query dwr_history for current month onboarded count
    const { data: dwrData, error: dwrError } = await supabaseServer
      .from('dwr_history')
      .select('onboarded')
      .in('user_id', userIdsToQuery)
      .gte('dwr_date', monthStart)
      .lte('dwr_date', monthEnd)

    if (dwrError) {
      console.error('DWR fetch error:', dwrError)
      return NextResponse.json({
        error: 'Failed to fetch monthly data',
        details: dwrError.message
      }, { status: 500 })
    }

    // Sum onboarded count
    const totalOnboarded = dwrData?.reduce((sum, record) => sum + (parseInt(record.onboarded) || 0), 0) || 0

    return NextResponse.json({
      success: true,
      data: {
        onboarded: totalOnboarded,
        month: new Date().toLocaleString('en-US', { month: 'long', year: 'numeric' }).toUpperCase()
      }
    })

  } catch (error) {
    console.error('Monthly onboarded API error:', error)
    return NextResponse.json({
      error: 'Internal server error',
      details: error.message
    }, { status: 500 })
  }
}