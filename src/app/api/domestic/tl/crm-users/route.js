import { supabaseServer } from '@/lib/supabase-server';
import { NextResponse } from 'next/server';
import { getUser } from '@/lib/auth-helper';

export async function GET(request) {
  try {
      const { user, error: authError } = getUser(request);
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: crmUsers, error: crmError } = await supabaseServer
      .from('users')
      .select('user_id, name, email')
      .eq('sector', 'Domestic')
      .contains('role', ['CRM'])
      .order('name', { ascending: true })

    if (crmError) {
      console.error('CRM users fetch error:', crmError)
      return NextResponse.json({ error: 'Failed to fetch CRM users' }, { status: 500 })
    }

    return NextResponse.json({ success: true, data: crmUsers || [] });
  } catch (error) {
    console.error('Server error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}