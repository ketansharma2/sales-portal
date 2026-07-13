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

    // Check if user has HOD role
    const { data: userProfile, error: profileError } = await supabaseServer
      .from('users')
      .select('role')
      .eq('user_id', user.id)
      .single()

    if (profileError || !userProfile) {
      return NextResponse.json({ error: 'User profile not found' }, { status: 404 })
    }

    if (!userProfile.role || !userProfile.role.includes('HOD')) {
      return NextResponse.json({ error: 'Access denied. HOD role required.' }, { status: 403 })
    }

    // Get leadgen team members under this manager
    const { data: leadgenUsers, error: leadgenError } = await supabaseServer
      .from('users')
      .select('user_id, name, email')
      .contains('role', ['LEADGEN'])
       .eq('sector', 'Corporate')
      .order('name', { ascending: true })

    console.log('Leadgen query result:', { leadgenUsers, leadgenError });

    if (leadgenError) {
      console.error('Leadgen users fetch error:', leadgenError)
      return NextResponse.json({ error: 'Failed to fetch leadgen users' }, { status: 500 })
    }

    return NextResponse.json({ success: true, data: leadgenUsers || [] });
  } catch (error) {
    console.error('Server error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}