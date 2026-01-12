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

    // Get manager's targets
    let targetsQuery = supabaseServer
      .from('hod_sm_targets')
      .select('*')
      .eq('sm_id', user.id)

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

    // Format response
    const target = targets?.[0] // Assuming one target per month per manager
    const response = {
      success: true,
      data: {
        month: month || new Date().toISOString().split('T')[0].substring(0, 7) + '-01',
        workingDays: target?.working_days || 24,
        totalVisits: target?.total_visits || 0,
        totalOnboards: target?.total_onboards || 0,
        totalCalls: target?.total_calls || 0,
        visitPerDay: target?.["visit/day"] || 0,
        onboardPerMonth: target?.["onboard/month"] || 0,
        callsPerDay: target?.["calls/day"] || 0
      }
    }

    return NextResponse.json(response)

  } catch (error) {
    console.error('Manager targets GET error:', error)
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

    const { month, targets } = await request.json()

    if (!month || !Array.isArray(targets)) {
      return NextResponse.json({
        error: 'Month and targets array are required'
      }, { status: 400 })
    }

    // Validate targets array
    for (const target of targets) {
      if (!target.user_id || target.visits == null || target.onboards == null || target.calls == null) {
        return NextResponse.json({
          error: 'Each target must have user_id, visits, onboards, calls'
        }, { status: 400 })
      }
    }

    // Delete existing targets for this month and manager
    const { error: deleteError } = await supabaseServer
      .from('sm_fse_targets')
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
      fse_id: target.user_id,
      monthly_visits: target.visits,
      monthly_onboards: target.onboards,
      monthly_calls: target.calls,
      created_by: user.id
    }))

    const { data: insertedTargets, error: insertError } = await supabaseServer
      .from('sm_fse_targets')
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
      message: `Targets published for ${targets.length} team members`
    })

  } catch (error) {
    console.error('Manager targets POST error:', error)
    return NextResponse.json({
      error: 'Internal server error',
      details: error.message
    }, { status: 500 })
  }
}