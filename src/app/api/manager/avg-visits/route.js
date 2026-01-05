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

    // Get fse_id
    const { searchParams } = new URL(request.url)
    const fseId = searchParams.get('fse_id')
    const fromDate = searchParams.get('from_date')
    const toDate = searchParams.get('to_date')
    if (!fseId) {
      return NextResponse.json({ error: 'FSE ID is required' }, { status: 400 })
    }

    let avgVisit = 0

    if (fromDate && toDate) {
      // Fetch total_visit for date range and calculate average
      const { data: dwrData, error: dwrError } = await supabaseServer
        .from('dwr_history')
        .select('total_visit')
        .eq('user_id', fseId)
        .gte('dwr_date', fromDate)
        .lte('dwr_date', toDate)

      if (dwrError) {
        console.error('DWR fetch error:', dwrError)
        return NextResponse.json({
          error: 'Failed to fetch avg visit',
          details: dwrError.message
        }, { status: 500 })
      }

      if (dwrData && dwrData.length > 0) {
        const total = dwrData.reduce((sum, d) => sum + (parseFloat(d.total_visit) || 0), 0)
        avgVisit = total / dwrData.length
      }
    } else {
      // Fetch latest avg_visit
      const { data: dwrData, error: dwrError } = await supabaseServer
        .from('dwr_history')
        .select('avg_visit')
        .eq('user_id', fseId)
        .order('dwr_date', { ascending: false })
        .limit(1)

      if (dwrError) {
        console.error('DWR fetch error:', dwrError)
        return NextResponse.json({
          error: 'Failed to fetch avg visit',
          details: dwrError.message
        }, { status: 500 })
      }

      avgVisit = dwrData?.[0]?.avg_visit || 0
    }

    return NextResponse.json({
      success: true,
      data: avgVisit
    })

  } catch (error) {
    console.error('Avg visits API error:', error)
    return NextResponse.json({
      error: 'Internal server error',
      details: error.message
    }, { status: 500 })
  }
}