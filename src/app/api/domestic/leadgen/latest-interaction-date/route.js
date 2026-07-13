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

    // Get the latest interaction date
    const { data, error } = await supabaseServer
      .from('domestic_leads_interaction')
      .select('date')
      .eq('leadgen_id', user.id)
      .order('date', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (error) {
      return NextResponse.json({
        error: 'Failed to fetch latest interaction date',
        details: error.message
      }, { status: 500 })
    }

    const latestDate = data ? new Date(data.date).toLocaleDateString('en-US', { weekday: 'short', day: 'numeric', month: 'short' }) : 'No data'

    return NextResponse.json({
      success: true,
      latestDate
    })

  } catch (error) {
    return NextResponse.json({
      error: 'Internal server error',
      details: error.message
    }, { status: 500 })
  }
}