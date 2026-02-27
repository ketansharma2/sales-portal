import { supabaseServer } from '@/lib/supabase-server'
import { NextResponse } from 'next/server'

// GET - Fetch projection targets for HOD
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
    const { data: managers, error: managersError } = await supabaseServer
      .from('users')
      .select('user_id, name, email, role, region, sector, manager_id, hod_id')
      .eq('hod_id', user.id)
      .order('name')

    if (managersError) {
      console.error('Managers fetch error:', managersError)
      return NextResponse.json({
        error: 'Failed to fetch managers',
        details: managersError.message
      }, { status: 500 })
    }

    // Format managers for response with FSE and Caller counts
    const managersList = await Promise.all((managers || []).map(async (mgr) => {
      // Count FSEs under this manager
      const { count: fseCount } = await supabaseServer
        .from('users')
        .select('*', { count: 'exact', head: true })
        .eq('manager_id', mgr.user_id)
        .contains('role', ['FSE'])
      
      // Count Callers/Leadgens under this manager
      const { count: callerCount } = await supabaseServer
        .from('users')
        .select('*', { count: 'exact', head: true })
        .eq('manager_id', mgr.user_id)
        .contains('role', ['LEADGEN'])
      
      return {
        id: mgr.user_id,
        name: mgr.name,
        email: mgr.email,
        region: mgr.region || '',
        sector: mgr.sector || '',
        fseCount: fseCount || 0,
        callerCount: callerCount || 0
      }
    }))

    // Get manager IDs under this HOD
    const managerIds = (managers || []).map(m => m.user_id)

    // Fetch all projection targets (all months) for these managers
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
      console.error('Projection targets fetch error:', targetsError)
      return NextResponse.json({
        error: 'Failed to fetch projection targets',
        details: targetsError.message
      }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      data: {
        month: month || null,
        managers: managersList,
        targets: targets || []
      }
    })

  } catch (error) {
    console.error('HOD projection targets GET error:', error)
    return NextResponse.json({
      error: 'Internal server error',
      details: error.message
    }, { status: 500 })
  }
}
