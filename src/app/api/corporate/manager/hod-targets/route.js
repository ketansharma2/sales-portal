import { supabaseServer } from '@/lib/supabase-server'
import { NextResponse } from 'next/server'

// GET - Fetch HOD assigned targets for corporate manager
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

    // Get query parameters
    const { searchParams } = new URL(request.url)
    const month = searchParams.get('month') // YYYY-MM format (optional)

    // Fetch targets where sm_id matches the logged-in user's ID
    let query = supabaseServer
      .from('hod_sm_targets')
      .select('*')
      .eq('sm_id', user.id)
      .order('month', { ascending: false })

    // If month is provided (YYYY-MM), filter by that month
    if (month) {
      const monthStart = `${month}-01`
      query = query.eq('month', monthStart)
    }

    const { data: targets, error: targetsError } = await query

    if (targetsError) {
      console.error('HOD targets fetch error:', targetsError)
      return NextResponse.json({
        error: 'Failed to fetch HOD targets',
        details: targetsError.message
      }, { status: 500 })
    }

    // Transform data for frontend
    const transformedTargets = (targets || []).map(target => ({
      id: target.id,
      month: target.month ? target.month.substring(0, 7) : null,
      workingDays: target.working_days,
      smId: target.sm_id,
      fseCount: target.fse_count,
      callersCount: target.callers_count,
      visitsPerFse: target["visits/fse"],
      onboardPerFse: target["onboard/fse"],
      callsPerCaller: target["calls/caller"],
      leadsPerCaller: target["leads/caller"],
      totalVisits: target.total_visits,
      totalOnboards: target.total_onboards,
      totalCalls: target.total_calls,
      totalLeads: target.total_leads,
      remarks: target.remarks || '',
      createdBy: target.created_by
    }))

    return NextResponse.json({
      success: true,
      data: {
        targets: transformedTargets,
        count: transformedTargets.length
      }
    })

  } catch (error) {
    console.error('Corporate manager HOD targets GET error:', error)
    return NextResponse.json({
      error: 'Internal server error',
      details: error.message
    }, { status: 500 })
  }
}
