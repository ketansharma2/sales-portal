import { supabaseServer } from '@/lib/supabase-server';
import { NextResponse } from 'next/server';

export async function GET(request) {
  try {
    const authHeader = request.headers.get('authorization')
    if (!authHeader) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authError } = await supabaseServer.auth.getUser(token)
    if (authError || !user) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }

    const currentUserId = user.user_id || user.id

    const { searchParams } = new URL(request.url);
    const fromDate = searchParams.get('fromDate');
    const toDate = searchParams.get('toDate');

    let query = supabaseServer
      .from('corporate_crm_emails')
      .select('id', { count: 'exact' })
      .eq('user_id', currentUserId)

    if (fromDate && toDate) {
      query = query.gte('shared_date', fromDate).lte('shared_date', toDate)
    } else if (fromDate) {
      query = query.eq('shared_date', fromDate)
    }

    const { count: trackerShared, error } = await query

    if (error) {
      console.error('Tracker shared API error:', error)
      return NextResponse.json({ error: 'Failed to fetch tracker shared data', details: error.message }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      tracker_shared: trackerShared || 0
    })

  } catch (error) {
    console.error('Tracker shared API error:', error)
    return NextResponse.json({
      error: 'Internal server error',
      details: error.message
    }, { status: 500 })
  }
}
