import { supabaseServer } from '@/lib/supabase-server'
import { NextResponse } from 'next/server'
import { getUser } from '@/lib/auth-helper';

export async function GET(request) {
  try {
    // Authentication
      const { user, error: authError } = getUser(request);
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Hardcoded for now
    const monthStart = '2026-01-01'
    console.log('Month:', monthStart)

    // Fetch monthly call target
    const { data, error } = await supabaseServer
      .from('corporate_sm_fse_targets')
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