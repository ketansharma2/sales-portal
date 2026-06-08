import { supabaseServer } from '@/lib/supabase-server';
import { NextResponse } from 'next/server';
import { getUser } from '@/lib/auth-helper';

export async function GET(request) {
  try {
    // Authentication - user injected by middleware (no auth calls needed!)
    const { user, error: authError } = getUser(request);
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get all RC (Recruitment Consultants) users for Corporate sector
    const { data: rcUsers, error: rcError } = await supabaseServer
      .from('users')
      .select('user_id, name, email')
      .eq('sector', 'Corporate')
      .contains('role', ['RC'])
      .order('name', { ascending: true })

    if (rcError) {
      console.error('RC users fetch error:', rcError)
      return NextResponse.json({ error: 'Failed to fetch RC users' }, { status: 500 })
    }

    return NextResponse.json({ success: true, data: rcUsers || [] });
  } catch (error) {
    console.error('Server error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
