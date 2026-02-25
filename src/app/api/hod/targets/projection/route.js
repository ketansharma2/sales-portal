import { supabaseServer } from '@/lib/supabase-server'
import { NextResponse } from 'next/server'

// GET /api/hod/targets/projection - Fetch targets for a specific month
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
    const month = searchParams.get('month') // YYYY-MM-DD format (optional)

    // Get managers under this HOD
    const { data: managers, error: managersError } = await supabaseServer
      .from('users')
      .select('id:user_id, name, email, sector, region')
      .eq('hod_id', user.id)
      .contains('role', ['MANAGER'])

    if (managersError) {
      console.error('Managers fetch error:', managersError)
      return NextResponse.json({
        error: 'Failed to fetch managers',
        details: managersError.message
      }, { status: 500 })
    }

    // Get existing targets - filter by month if provided, otherwise get all
    let targetsQuery = supabaseServer
      .from('hod_sm_targets')
      .select('*')
      .eq('created_by', user.id)
    
    // If month is provided, filter by month
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
      const { count: fseCount } = await supabaseServer
        .from('users')
        .select('*', { count: 'exact', head: true })
        .eq('manager_id', manager.id)
        .contains('role', ['FSE'])

      // Count LeadGens under this manager
      const { count: leadGenCount } = await supabaseServer
        .from('users')
        .select('*', { count: 'exact', head: true })
        .eq('manager_id', manager.id)
        .contains('role', ['LEADGEN'])

      const managerTargets = targets?.find(t => t.sm_id === manager.id)
      return {
        id: manager.id,
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
        month: month,
        targets: targets || []
      }
    })

  } catch (error) {
    console.error('HOD targets projection GET error:', error)
    return NextResponse.json({
      error: 'Internal server error',
      details: error.message
    }, { status: 500 })
  }
}
