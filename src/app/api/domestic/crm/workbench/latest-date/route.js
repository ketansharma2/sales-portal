import { supabaseServer } from '@/lib/supabase-server'
import { NextResponse } from 'next/server'
import { getUser } from '@/lib/auth-helper';

export async function GET(request) {
  try {
      const { user, error: authError } = getUser(request);
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url)
    const userIds = searchParams.get('userIds')

    if (!userIds) {
      return NextResponse.json({ error: 'userIds required' }, { status: 400 })
    }

    const rcIds = userIds.split(',')

    const { data: workbenchData, error } = await supabaseServer
      .from('domestic_workbench')
      .select('date')
      .in('sent_to_rc', rcIds)
      .not('date', 'is', null)
      .order('date', { ascending: false })
      .limit(1)

    if (error) {
      console.error('Latest date error:', error)
      return NextResponse.json({ error: 'Failed to fetch latest date' }, { status: 500 })
    }

    const maxDate = workbenchData?.[0]?.date || null

    return NextResponse.json({
      success: true,
      maxDate
    })

  } catch (error) {
    console.error('Latest date API error:', error)
    return NextResponse.json({
      error: 'Internal server error',
      details: error.message
    }, { status: 500 })
  }
}