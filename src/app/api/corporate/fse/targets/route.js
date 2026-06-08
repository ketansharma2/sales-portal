import { supabaseServer } from '@/lib/supabase-server'
import { NextResponse } from 'next/server'
import { getUser } from '@/lib/auth-helper'

export async function GET(request) {
  try {
    // Authentication - user injected by middleware (no auth calls needed!)
    const { user, error } = getUser(request)
    if (error || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get query parameters
    const { searchParams } = new URL(request.url)
    const month = searchParams.get('month') // YYYY-MM-DD format

    // Get FSE's targets
    let targetsQuery = supabaseServer
      .from('corporate_sm_fse_targets')
      .select('*')
      .eq('fse_id', user.id)

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
    const target = targets?.[0] // Assuming one target per month per FSE
    const response = {
      success: true,
      data: target ? {
        monthly_visits: target.monthly_visits,
        monthly_onboards: target.monthly_onboards,
        monthly_calls: target.monthly_calls
      } : null
    }

    return NextResponse.json(response)

  } catch (error) {
    console.error('FSE targets GET error:', error)
    return NextResponse.json({
      error: 'Internal server error',
      details: error.message
    }, { status: 500 })
  }
}