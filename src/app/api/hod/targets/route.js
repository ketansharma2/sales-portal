import { supabaseServer } from '@/lib/supabase-server'
import { NextResponse } from 'next/server'

// GET - Fetch all HOD targets (with optional month filter)
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
    const month = searchParams.get('month') // YYYY-MM-DD format

    // Fetch managers under this HOD by checking hod_id field
    let managersQuery = supabaseServer
      .from('users')
      .select('user_id, name, email, role, region, sector, manager_id, hod_id')
      .eq('hod_id', user.id)
      .order('name')

    const { data: managers, error: managersError } = await managersQuery

    if (managersError) {
      console.error('Managers fetch error:', managersError)
      return NextResponse.json({
        error: 'Failed to fetch managers',
        details: managersError.message
      }, { status: 500 })
    }

    // Format managers for response
    const managersList = (managers || []).map(mgr => ({
      id: mgr.user_id,
      name: mgr.name,
      email: mgr.email,
      region: mgr.region || '',
      sector: mgr.sector || ''
    }))

    // Get manager IDs under this HOD
    const managerIds = (managers || []).map(m => m.user_id)

    // Fetch targets for these managers only
    let targetsQuery = supabaseServer
      .from('hod_sm_targets')
      .select('*')
      .in('sm_id', managerIds.length > 0 ? managerIds : [''])
      .order('month', { ascending: false })

    if (month) {
      targetsQuery = targetsQuery.eq('month', month)
    }

    const { data: targets, error: targetsError } = await targetsQuery

    if (targetsError) {
      console.error('Targets fetch error:', targetsError)
      return NextResponse.json({
        error: 'Failed to fetch targets',
        details: targetsError.message
      }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      data: {
        managers: managersList,
        targets: targets || []
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

// POST - Create new targets
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

    const { month, working_days, targets } = await request.json()

    if (!month || !Array.isArray(targets) || targets.length === 0) {
      return NextResponse.json({
        error: 'Month and targets array are required'
      }, { status: 400 })
    }

    // Check if targets already exist for this month and manager(s)
    const smIds = targets.map(t => t.sm_id)
    const { data: existingTargets, error: checkError } = await supabaseServer
      .from('hod_sm_targets')
      .select('month, sm_id')
      .eq('month', month)
      .in('sm_id', smIds)

    if (checkError) {
      console.error('Check existing targets error:', checkError)
    }

    if (existingTargets && existingTargets.length > 0) {
      // Find which manager already has a target
      const existingManagerIds = existingTargets.map(et => et.sm_id)
      const existingManagers = targets.filter(t => existingManagerIds.includes(t.sm_id))
      
      return NextResponse.json({
        error: 'Target already exists for this month',
        details: `Manager(s) already have targets for ${month}. Please use edit mode to update.`,
        existing_managers: existingManagers.map(t => t.sm_id)
      }, { status: 400 })
    }

    // Prepare targets for insertion
    const targetsToInsert = targets.map(target => ({
      month,
      working_days: working_days || 24,
      sm_id: target.sm_id,
      fse_count: target.fse_count || 0,
      callers_count: target.callers_count || 0,
      total_visits: target.total_visits || 0,
      total_onboards: target.total_onboards || 0,
      total_calls: target.total_calls || 0,
      total_leads: target.total_leads || 0,
      "visits/fse": target["visits/fse"] || 0,
      "onboard/fse": target["onboard/fse"] || 0,
      "calls/caller": target["calls/caller"] || 0,
      "leads/caller": target["leads/caller"] || 0,
      remarks: target.remarks || '',
      created_by: user.id
    }))

    // Insert new targets
    const { data: insertedTargets, error: insertError } = await supabaseServer
      .from('hod_sm_targets')
      .insert(targetsToInsert)
      .select()

    if (insertError) {
      console.error('Insert targets error:', insertError)
      return NextResponse.json({
        error: 'Failed to save targets',
        details: insertError.message
      }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      data: insertedTargets,
      message: `Targets saved for ${targets.length} managers`
    })

  } catch (error) {
    console.error('HOD targets POST error:', error)
    return NextResponse.json({
      error: 'Internal server error',
      details: error.message
    }, { status: 500 })
  }
}

// PUT - Update existing target
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

    const { month, working_days, sm_id, targets } = await request.json()

    if (!month || !sm_id) {
      return NextResponse.json({
        error: 'Month and sm_id are required'
      }, { status: 400 })
    }

    // Get the target data to update
    const targetData = targets || {}

    // Update existing target
    const { data: updatedTarget, error: updateError } = await supabaseServer
      .from('hod_sm_targets')
      .update({
        working_days: working_days || 24,
        fse_count: targetData.fse_count || 0,
        callers_count: targetData.callers_count || 0,
        total_visits: targetData.total_visits || 0,
        total_onboards: targetData.total_onboards || 0,
        total_calls: targetData.total_calls || 0,
        total_leads: targetData.total_leads || 0,
        "visits/fse": targetData["visits/fse"] || 0,
        "onboard/fse": targetData["onboard/fse"] || 0,
        "calls/caller": targetData["calls/caller"] || 0,
        "leads/caller": targetData["leads/caller"] || 0,
        remarks: targetData.remarks || ''
      })
      .eq('month', month)
      .eq('sm_id', sm_id)
      .select()

    if (updateError) {
      console.error('Update target error:', updateError)
      return NextResponse.json({
        error: 'Failed to update target',
        details: updateError.message
      }, { status: 500 })
    }

    // If no target found to update, create new one
    if (!updatedTarget || updatedTarget.length === 0) {
      const { data: insertedTarget, error: insertError } = await supabaseServer
        .from('hod_sm_targets')
        .insert({
          month,
          working_days: working_days || 24,
          sm_id,
          fse_count: targetData.fse_count || 0,
          callers_count: targetData.callers_count || 0,
          total_visits: targetData.total_visits || 0,
          total_onboards: targetData.total_onboards || 0,
          total_calls: targetData.total_calls || 0,
          total_leads: targetData.total_leads || 0,
          "visits/fse": targetData["visits/fse"] || 0,
          "onboard/fse": targetData["onboard/fse"] || 0,
          "calls/caller": targetData["calls/caller"] || 0,
          "leads/caller": targetData["leads/caller"] || 0,
          remarks: targetData.remarks || '',
          created_by: user.id
        })
        .select()

      if (insertError) {
        console.error('Insert target error:', insertError)
        return NextResponse.json({
          error: 'Failed to create target',
          details: insertError.message
        }, { status: 500 })
      }

      return NextResponse.json({
        success: true,
        data: insertedTarget[0],
        message: 'Target created successfully'
      })
    }

    return NextResponse.json({
      success: true,
      data: updatedTarget[0],
      message: 'Target updated successfully'
    })

  } catch (error) {
    console.error('HOD targets PUT error:', error)
    return NextResponse.json({
      error: 'Internal server error',
      details: error.message
    }, { status: 500 })
  }
}
