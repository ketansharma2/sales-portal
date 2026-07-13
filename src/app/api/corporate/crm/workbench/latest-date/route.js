import { supabaseServer } from '@/lib/supabase-server';
import { NextResponse } from 'next/server';
import { getUser } from '@/lib/auth-helper';

export async function GET(request) {
  try {
      const { user, error: authError } = getUser(request);
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
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
