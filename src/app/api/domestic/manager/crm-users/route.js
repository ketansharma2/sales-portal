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

    // Check if user has MANAGER role
    const { data: userProfile, error: profileError } = await supabaseServer
      .from('users')
      .select('role')
      .eq('user_id', user.id)
      .single()

    if (profileError || !userProfile) {
      return NextResponse.json({ error: 'User profile not found' }, { status: 404 })
    }

    if (!userProfile.role || !userProfile.role.includes('MANAGER')) {
      return NextResponse.json({ error: 'Access denied. Manager role required.' }, { status: 403 })
    }

    // Get all CRM users for Domestic sector
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
