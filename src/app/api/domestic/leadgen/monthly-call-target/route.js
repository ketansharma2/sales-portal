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

    // Hardcoded for now
    const monthStart = '2026-01-01'

    // Fetch monthly call target
    const { data, error } = await supabaseServer
      .from('sm_fse_targets')
      .select('monthly_calls')
      .eq('fse_id', user.id)
      .eq('month', monthStart)
      .maybeSingle()

    if (error) {
      return NextResponse.json({
        error: 'Failed to fetch monthly call target',
        details: error.message
      }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      target: data ? data.monthly_calls : 0
    })

  } catch (error) {
    return NextResponse.json({
      error: 'Internal server error',
      details: error.message
    }, { status: 500 })
  }
}