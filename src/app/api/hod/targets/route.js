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
          total_visits: managerTargets.total_visits,
          total_onboards: managerTargets.total_onboards,
          total_calls: managerTargets.total_calls,
          working_days: managerTargets.working_days,
          "visit/day": managerTargets["visit/day"],
          "onboard/month": managerTargets["onboard/month"],
          "calls/day": managerTargets["calls/day"]
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

    // Validate targets array
    for (const target of targets) {
      if (target.sm_id == null || target.total_visits == null || target.total_onboards == null || target.total_calls == null) {
        return NextResponse.json({
          error: 'Each target must have sm_id, total_visits, total_onboards, total_calls'
        }, { status: 400 })
      }
    }

    // Delete existing targets for this month and HOD
    const { error: deleteError } = await supabaseServer
      .from('hod_sm_targets')
      .delete()
      .eq('created_by', user.id)
      .eq('month', month)

    if (deleteError) {
      console.error('Delete existing targets error:', deleteError)
      // Continue anyway
    }

    // Insert new targets
    const targetsToInsert = targets.map(target => ({
      month,
      working_days,
      sm_id: target.sm_id,
      total_visits: target.total_visits,
      total_onboards: target.total_onboards,
      total_calls: target.total_calls,
      "visit/day": target["visit/day"],
      "onboard/month": target["onboard/month"],
      "calls/day": target["calls/day"],
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