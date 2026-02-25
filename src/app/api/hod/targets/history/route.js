import { supabaseServer } from '@/lib/supabase-server'
import { NextResponse } from 'next/server'

// GET /api/hod/targets/history - Fetch all targets (for history tab)
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

    // Get query parameters for optional filtering
    const { searchParams } = new URL(request.url)
    const month = searchParams.get('month') // YYYY-MM-DD format (optional)

    // Get all targets for this HOD (no month filter by default)
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

    // Get all managers under this HOD (for display purposes)
    const { data: managers, error: managersError } = await supabaseServer
      .from('users')
      .select('id:user_id, name, email, sector, region')
      .eq('hod_id', user.id)
      .contains('role', ['MANAGER'])

    if (managersError) {
      console.error('Managers fetch error:', managersError)
    }

    // Create a map of manager details for quick lookup
    const managerMap = {}
    managers?.forEach(mgr => {
      managerMap[mgr.user_id] = {
        name: mgr.name,
        email: mgr.email,
        sector: mgr.sector,
        region: mgr.region
      }
    })

    return NextResponse.json({
      success: true,
      data: {
        targets: targets || [],
        managers: managers || []
      }
    })

  } catch (error) {
    console.error('HOD targets history GET error:', error)
    return NextResponse.json({
      error: 'Internal server error',
      details: error.message
    }, { status: 500 })
  }
}
