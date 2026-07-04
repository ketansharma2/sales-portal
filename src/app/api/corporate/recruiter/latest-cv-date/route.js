import { supabaseServer } from '@/lib/supabase-server';
import { NextResponse } from 'next/server';
import { getUser } from '@/lib/auth-helper';

export async function GET(request) {
  try {
    // Authentication
      const { user, error: authError } = getUser(request);
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const currentUserId = user.user_id || user.id

    // Get the max portal_date for the user
    const { data, error } = await supabaseServer
      .from('cv_parsing')
      .select('portal_date')
      .eq('user_id', currentUserId)
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