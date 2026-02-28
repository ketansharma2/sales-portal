import { supabaseServer } from '@/lib/supabase-server'
import { NextResponse } from 'next/server'

// POST - Create new target for team member
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

    // Parse request body
    const body = await request.json()
    const { month, fseId, monthlyVisits, monthlyOnboards, monthlyCalls, monthlyLeads, workingDays, remarks } = body

    // Validate required fields
    if (!month || !fseId) {
      return NextResponse.json({ 
        error: 'Missing required fields', 
        details: 'month and fseId are required' 
      }, { status: 400 })
    }

    // Convert month to YYYY-MM-DD format (first day of month)
    const monthDate = `${month}-01`

    // Check if target already exists for this user and month
    const { data: existingTarget, error: checkError } = await supabaseServer
      .from('corporate_sm_fse_targets')
      .select('id')
      .eq('fse_id', fseId)
      .eq('month', monthDate)
      .single()

    if (existingTarget) {
      return NextResponse.json({
        error: 'Target already exists for this member in ' + month,
        details: 'Please edit the existing target instead',
        existingTargetId: existingTarget.id
      }, { status: 409 })
    }

    // Insert into corporate_sm_fse_targets table
    const { data, error } = await supabaseServer
      .from('corporate_sm_fse_targets')
      .insert({
        month: monthDate,
        fse_id: fseId,
        monthly_visits: monthlyVisits || 0,
        monthly_onboards: monthlyOnboards || 0,
        monthly_calls: monthlyCalls || 0,
        monthly_leads: monthlyLeads || 0,
        working_days: workingDays || 24,
        remarks: remarks || '',
        created_by: user.id
      })
      .select()

    if (error) {
      console.error('Target insert error:', error)
      return NextResponse.json({
        error: 'Failed to create target',
        details: error.message
      }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: 'Target created successfully',
      data: data?.[0]
    })

  } catch (error) {
    console.error('Corporate member targets POST error:', error)
    return NextResponse.json({
      error: 'Internal server error',
      details: error.message
    }, { status: 500 })
  }
}

// GET - Fetch targets for team members
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
    const fseId = searchParams.get('fseId') // Optional filter by fseId

    // Build query
    let query = supabaseServer
      .from('corporate_sm_fse_targets')
      .select('*')
      .order('month', { ascending: false })

    // If month is provided, filter by that month
    if (month) {
      const monthStart = `${month}-01`
      query = query.eq('month', monthStart)
    }

    // If fseId is provided, filter by that fse
    if (fseId) {
      query = query.eq('fse_id', fseId)
    }

    const { data: targets, error } = await query

    if (error) {
      console.error('Targets fetch error:', error)
      return NextResponse.json({
        error: 'Failed to fetch targets',
        details: error.message
      }, { status: 500 })
    }

    // Get fse details for each target
    const fseIds = (targets || []).map(t => t.fse_id)
    let fseDetails = {}
    
    if (fseIds.length > 0) {
      const { data: fses } = await supabaseServer
        .from('users')
        .select('user_id, name, role')
        .in('user_id', fseIds)
      
      if (fses) {
        fses.forEach(fse => {
          fseDetails[fse.user_id] = fse
        })
      }
    }

    // Transform data for frontend
    const transformedTargets = (targets || []).map(target => {
      const fse = fseDetails[target.fse_id] || {}
      return {
        id: target.id,
        month: target.month ? target.month.substring(0, 7) : null,
        fseId: target.fse_id,
        fseName: fse.name || 'Unknown',
        fseRole: fse.role?.includes('FSE') ? 'FSE' : 'LeadGen',
        monthlyVisits: target.monthly_visits,
        monthlyOnboards: target.monthly_onboards,
        monthlyCalls: target.monthly_calls,
        monthlyLeads: target.monthly_leads,
        workingDays: target.working_days,
        remarks: target.remarks,
        createdBy: target.created_by
      }
    })

    return NextResponse.json({
      success: true,
      data: {
        targets: transformedTargets,
        count: transformedTargets.length
      }
    })

  } catch (error) {
    console.error('Corporate member targets GET error:', error)
    return NextResponse.json({
      error: 'Internal server error',
      details: error.message
    }, { status: 500 })
  }
}

// PUT - Update existing target for team member
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

    // Parse request body
    const body = await request.json()
    const { month, fseId, monthlyVisits, monthlyOnboards, monthlyCalls, monthlyLeads, workingDays, remarks, targetId } = body

    // Validate required fields
    if (!targetId || !month || !fseId) {
      return NextResponse.json({ 
        error: 'Missing required fields', 
        details: 'targetId, month and fseId are required' 
      }, { status: 400 })
    }

    // Convert month to YYYY-MM-DD format (first day of month)
    const monthDate = `${month}-01`

    // Update the target
    const { data, error } = await supabaseServer
      .from('corporate_sm_fse_targets')
      .update({
        month: monthDate,
        monthly_visits: monthlyVisits || 0,
        monthly_onboards: monthlyOnboards || 0,
        monthly_calls: monthlyCalls || 0,
        monthly_leads: monthlyLeads || 0,
        working_days: workingDays || 24,
        remarks: remarks || ''
      })
      .eq('id', targetId)
      .eq('fse_id', fseId)
      .select()

    if (error) {
      console.error('Target update error:', error)
      return NextResponse.json({
        error: 'Failed to update target',
        details: error.message
      }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: 'Target updated successfully',
      data: data?.[0]
    })

  } catch (error) {
    console.error('Corporate member targets PUT error:', error)
    return NextResponse.json({
      error: 'Internal server error',
      details: error.message
    }, { status: 500 })
  }
}
