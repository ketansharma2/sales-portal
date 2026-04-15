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

    const { searchParams } = new URL(request.url);
    const userIds = searchParams.get('userIds');

    if (!userIds) {
      return NextResponse.json({ error: 'userIds parameter required' }, { status: 400 })
    }

    const userIdArray = userIds.split(',').map(id => id.trim()).filter(id => id);

    if (userIdArray.length === 0) {
      return NextResponse.json({ error: 'No valid userIds provided' }, { status: 400 })
    }

    const { data, error } = await supabaseServer
      .from('cv_parsing')
      .select('portal_date')
      .in('user_id', userIdArray)
      .order('portal_date', { ascending: false })
      .limit(1)

    if (error) {
      console.error('Fetch max date error:', error)
      return NextResponse.json({ error: 'Failed to fetch date', details: error.message }, { status: 500 })
    }

    const maxDate = data && data.length > 0 ? data[0].portal_date : null

    return NextResponse.json({ 
      success: true, 
      maxDate: maxDate,
      today: new Date().toISOString().split('T')[0]
    })

  } catch (error) {
    console.error('Server error:', error)
    return NextResponse.json({ error: 'Internal server error', details: error.message }, { status: 500 })
  }
}
