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

    // Get query parameters
    const { searchParams } = new URL(request.url)
    const month = searchParams.get('month') // YYYY-MM-DD format

    // Get managers under this HOD
    const { data: managers, error: managersError } = await supabaseServer
      .from('users')
      .select('user_id, name, email, sector, region')
      .eq('hod_id', user.id)
      .contains('role', ['MANAGER'])

    if (managersError) {
      console.error('Managers fetch error:', managersError)
      return NextResponse.json({
        error: 'Failed to fetch managers',
        details: managersError.message
      }, { status: 500 })
    }

    // Get existing targets for the month
    let targetsQuery = supabaseServer
      .from('hod_sm_targets')
      .select('*')
      .eq('created_by', user.id)

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

    // Get counts for each manager
    const managersWithCounts = await Promise.all(managers?.map(async (manager) => {
      // Count FSEs under this manager
      const { count: fseCount, error: fseError } = await supabaseServer
        .from('users')
        .select('*', { count: 'exact', head: true })
        .eq('manager_id', manager.user_id)
        .contains('role', ['FSE'])

      // Count LeadGens under this manager
      const { count: leadGenCount, error: leadGenError } = await supabaseServer
        .from('users')
        .select('*', { count: 'exact', head: true })
        .eq('manager_id', manager.user_id)
        .contains('role', ['LEADGEN'])

      const managerTargets = targets?.find(t => t.sm_id === manager.user_id)
      return {
        id: manager.user_id,
        name: manager.name,
        email: manager.email,
        sector: manager.sector,
        region: manager.region,
        fseCount: fseCount || 0,
        leadGenCount: leadGenCount || 0,
        targets: managerTargets ? {
          fse_count: managerTargets.fse_count,
          callers_count: managerTargets.callers_count,
          total_visits: managerTargets.total_visits,
          total_onboards: managerTargets.total_onboards,
          total_calls: managerTargets.total_calls,
          total_leads: managerTargets.total_leads,
          working_days: managerTargets.working_days,
          "visits/fse": managerTargets["visits/fse"],
          "onboard/fse": managerTargets["onboard/fse"],
          "calls/caller": managerTargets["calls/caller"],
          "leads/caller": managerTargets["leads/caller"]
        } : null
      }
    }) || [])

    return NextResponse.json({
      success: true,
      data: {
        managers: managersWithCounts,
        month: month || new Date().toISOString().split('T')[0].substring(0, 7) + '-01', // First day of current month
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

    if (!month || !working_days || !Array.isArray(targets)) {
      return NextResponse.json({
        error: 'Month, working_days, and targets array are required'
      }, { status: 400 })
    }

    // Check if target already exists for this manager and month
    const existingTarget = await supabaseServer
      .from('hod_sm_targets')
      .select('id')
      .eq('created_by', user.id)
      .eq('month', month)
      .eq('sm_id', targets[0].sm_id)
      .single()

    if (existingTarget.data) {
      return NextResponse.json({
        error: 'Target already exists for this manager and month. Please use edit mode to update.'
      }, { status: 409 })
    }

    // Validate targets array (only required columns that exist in DB)
    for (const target of targets) {
      if (target.sm_id == null || target.total_visits == null) {
        return NextResponse.json({
          error: 'Each target must have sm_id and total_visits'
        }, { status: 400 })
      }
    }

    // For POST (create): Simply insert new target - no deletion
    // Insert new targets (only core columns that exist in database)
    const targetsToInsert = targets.map(target => ({
      month,
      working_days,
      sm_id: target.sm_id,
      fse_count: target.fse_count,
      callers_count: target.callers_count,
      total_visits: target.total_visits,
      total_onboards: target.total_onboards,
      total_calls: target.total_calls,
      total_leads: target.total_leads,
      created_by: user.id
    }))

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
      message: `Targets published for ${targets.length} managers`
    })

  } catch (error) {
    console.error('HOD targets POST error:', error)
    return NextResponse.json({
      error: 'Internal server error',
      details: error.message
    }, { status: 500 })
  }
}

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
    const { month, working_days, sm_id, targets } = body

    if (!month || !working_days || !sm_id || !targets) {
      return NextResponse.json({
        error: 'Month, working_days, sm_id, and targets are required'
      }, { status: 400 })
    }

    // Update existing target for this month, HOD, and specific manager
    const { data: updatedTarget, error: updateError } = await supabaseServer
      .from('hod_sm_targets')
      .update({
        month,
        working_days,
        fse_count: targets.fse_count,
        callers_count: targets.callers_count,
        total_visits: targets.total_visits,
        total_onboards: targets.total_onboards,
        total_calls: targets.total_calls,
        total_leads: targets.total_leads
      })
      .eq('created_by', user.id)
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

    return NextResponse.json({
      success: true,
      data: updatedTarget,
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