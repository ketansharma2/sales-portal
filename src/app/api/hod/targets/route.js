import { supabaseServer } from '@/lib/supabase-server'
import { NextResponse } from 'next/server'

// GET - Fetch HOD targets for domestic (manager's targets assigned by their HOD)
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

    // Fetch targets where sm_id matches the logged-in user (assigned by HOD)
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
      ctcGeneration: target.ctc_generation || 0,
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
    console.error('HOD targets GET error:', error)
    return NextResponse.json({
      error: 'Internal server error',
      details: error.message
    }, { status: 500 })
  }
}

// POST - Create new HOD target
export async function POST(request) {
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

    const body = await request.json()
    // Accept both camelCase and snake_case for working_days
    const workingDaysInput = body.workingDays !== undefined ? body.workingDays : body.working_days
    const { month, sm_id, fseCount, callersCount, visitTarget, onboardTarget, callsPerCaller, leadsPerCaller, ctc_generation, remarks } = body
    const workingDays = workingDaysInput !== undefined ? workingDaysInput : 24

    if (!month) {
      return NextResponse.json({ error: 'Month is required' }, { status: 400 })
    }

    // Fix month format if already YYYY-MM-DD (take first 7 chars)
    const fixedMonth = (month && month.length > 7) ? month.substring(0, 7) : month
    const monthStart = fixedMonth ? `${fixedMonth}-01` : undefined

    // Check if target already exists for this manager and month
    const { data: existingTarget, error: existingError } = await supabaseServer
      .from('hod_sm_targets')
      .select('id, month')
      .eq('sm_id', sm_id)
      .eq('month', monthStart)
      .single()

    if (existingTarget) {
      return NextResponse.json({ 
        error: 'Target already exists for this manager and month. Please use edit mode to update the existing target.' 
      }, { status: 400 })
    }

    // Calculate totals
    const fseCountNum = parseInt(fseCount) || 0
    const callersCountNum = parseInt(callersCount) || 0
    // visitTarget is per DAY value - multiply by working days to get monthly
    // onboardTarget is already monthly - store as-is
    const visitsPerFseNum = (parseFloat(visitTarget) || 0) * (parseInt(workingDays) || 24)
    const onboardPerFseNum = parseFloat(onboardTarget) || 0
    const callsPerCallerNum = parseFloat(callsPerCaller) || 0
    const leadsPerCallerNum = parseFloat(leadsPerCaller) || 0

    const { data, error } = await supabaseServer
      .from('hod_sm_targets')
      .insert({
        sm_id: sm_id,  // Use the manager ID from the request body
        month: monthStart,
        working_days: parseInt(workingDays) || 24,
        fse_count: fseCountNum,
        callers_count: callersCountNum,
        "visits/fse": visitsPerFseNum,
        "onboard/fse": onboardPerFseNum,
        "calls/caller": callsPerCallerNum,
        "leads/caller": leadsPerCallerNum,
        total_visits: fseCountNum * visitsPerFseNum,
        total_onboards: fseCountNum * onboardPerFseNum,
        total_calls: callersCountNum * callsPerCallerNum,
        total_leads: callersCountNum * leadsPerCallerNum,
        ctc_generation: parseInt(ctc_generation) || 0,
        remarks: remarks || '',
        created_by: user.id
      })
      .select()
      .single()

    if (error) {
      console.error('HOD target create error:', error)
      return NextResponse.json({
        error: 'Failed to create HOD target',
        details: error.message
      }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      data: {
        id: data.id,
        month: data.month ? data.month.substring(0, 7) : null,
        workingDays: data.working_days,
        fseCount: data.fse_count,
        callersCount: data.callers_count,
        visitsPerFse: data["visits/fse"],
        onboardPerFse: data["onboard/fse"],
        callsPerCaller: data["calls/caller"],
        leadsPerCaller: data["leads/caller"],
        totalVisits: data.total_visits,
        totalOnboards: data.total_onboards,
        totalCalls: data.total_calls,
        totalLeads: data.total_leads,
        ctcGeneration: data.ctc_generation || 0,
        remarks: data.remarks || ''
      }
    })

  } catch (error) {
    console.error('HOD targets POST error:', error)
    return NextResponse.json({
      error: 'Internal server error',
      details: error.message
    }, { status: 500 })
  }
}

// PUT - Update existing HOD target
export async function PUT(request) {
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

    const body = await request.json()
    // Accept both camelCase and snake_case for working_days
    const workingDaysInput = body.workingDays !== undefined ? body.workingDays : body.working_days
    // Accept both field names: visitTarget (frontend) and visitsPerFse (backend)
    const visitTargetInput = body.visitTarget ?? body.visitsPerFse
    const {
      id,
      month,
      fseCount,
      callersCount,
      visitsPerFse = visitTargetInput,
      onboardPerFse,
      callsPerCaller,
      leadsPerCaller,
      ctc_generation,
      remarks
    } = body
    
    // Handle workingDays separately to accept both formats
    let workingDays = workingDaysInput !== undefined ? workingDaysInput : 24

    if (!id) {
      return NextResponse.json({ error: 'Target ID is required' }, { status: 400 })
    }

    // Check if target exists and was created by this user (HOD)
    const { data: existingTarget, error: fetchError } = await supabaseServer
      .from('hod_sm_targets')
      .select('sm_id, created_by')
      .eq('id', id)
      .single()

    if (fetchError || !existingTarget) {
      return NextResponse.json({ error: 'Target not found' }, { status: 404 })
    }

    // HOD can update targets they created (created_by = user.id)
    // This allows HOD to update targets for any manager under them
    if (existingTarget.created_by !== user.id) {
      return NextResponse.json({ error: 'Access denied. You can only update targets you created.' }, { status: 403 })
    }

    // Fix month format - handle both YYYY-MM and YYYY-MM-DD
    const fixedMonth = month ? (month.length > 7 ? month.substring(0, 7) : month) : null
    const monthStart = fixedMonth ? `${fixedMonth}-01` : undefined

    // Calculate totals
    // visitsPerFse is per DAY value - multiply by working days to get monthly
    // onboardPerFse is already monthly - store as-is
    const fseCountNum = parseInt(fseCount) || 0
    const callersCountNum = parseInt(callersCount) || 0
    const visitsPerFseNum = ((parseFloat(visitsPerFse) || 0) * (parseInt(workingDays) || 24))
    const onboardPerFseNum = parseFloat(onboardPerFse) || 0
    const callsPerCallerNum = parseFloat(callsPerCaller) || 0
    const leadsPerCallerNum = parseFloat(leadsPerCaller) || 0

    const updateData = {}
    if (monthStart) updateData.month = monthStart
    if (workingDays !== undefined) updateData.working_days = parseInt(workingDays) || 24
    if (fseCount !== undefined) updateData.fse_count = fseCountNum
    if (callersCount !== undefined) updateData.callers_count = callersCountNum
    if (visitsPerFse !== undefined) updateData["visits/fse"] = visitsPerFseNum
    if (onboardPerFse !== undefined) updateData["onboard/fse"] = onboardPerFseNum
    if (callsPerCaller !== undefined) updateData["calls/caller"] = callsPerCallerNum
    if (leadsPerCaller !== undefined) updateData["leads/caller"] = leadsPerCallerNum
    if (ctc_generation !== undefined) updateData.ctc_generation = parseInt(ctc_generation) || 0

    // Recalculate totals
    updateData.total_visits = fseCountNum * visitsPerFseNum
    updateData.total_onboards = fseCountNum * onboardPerFseNum
    updateData.total_calls = callersCountNum * callsPerCallerNum
    updateData.total_leads = callersCountNum * leadsPerCallerNum
    if (remarks !== undefined) updateData.remarks = remarks

    const { data, error } = await supabaseServer
      .from('hod_sm_targets')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('HOD target update error:', error)
      return NextResponse.json({
        error: 'Failed to update HOD target',
        details: error.message
      }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      data: {
        id: data.id,
        month: data.month ? data.month.substring(0, 7) : null,
        workingDays: data.working_days,
        fseCount: data.fse_count,
        callersCount: data.callers_count,
        visitsPerFse: data["visits/fse"],
        onboardPerFse: data["onboard/fse"],
        callsPerCaller: data["calls/caller"],
        leadsPerCaller: data["leads/caller"],
        totalVisits: data.total_visits,
        totalOnboards: data.total_onboards,
        totalCalls: data.total_calls,
        totalLeads: data.total_leads,
        ctcGeneration: data.ctc_generation || 0,
        remarks: data.remarks || ''
      }
    })

  } catch (error) {
    console.error('HOD targets PUT error:', error)
    return NextResponse.json({
      error: 'Internal server error',
      details: error.message
    }, { status: 500 })
  }
}
