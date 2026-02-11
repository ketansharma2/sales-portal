import { supabaseServer } from '@/lib/supabase-server';
import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    // Authentication - commented out for testing
    // const authHeader = request.headers.get('authorization')
    // if (!authHeader) {
    //   return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    // }
    // const token = authHeader.replace('Bearer ', '')
    // const { data: { user }, error: authError } = await supabaseServer.auth.getUser(token)
    // if (authError || !user) {
    //   return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    // }

    // // Check if user has MANAGER role
    // const { data: userProfile, error: profileError } = await supabaseServer
    //   .from('users')
    //   .select('role')
    //   .eq('user_id', user.id)
    //   .single()

    // if (profileError || !userProfile) {
    //   return NextResponse.json({ error: 'User profile not found' }, { status: 404 })
    // }

    // if (!userProfile.role || !userProfile.role.includes('MANAGER')) {
    //   return NextResponse.json({ error: 'Access denied. Manager role required.' }, { status: 403 })
    // }

    const { client_id, fse_id, date } = await request.json();

    if (!client_id || !fse_id || !date) {
      return NextResponse.json({ error: 'client_id, fse_id, and date are required' }, { status: 400 })
    }

    // Insert into domestic_sm_fse_visits
    const { data, error } = await supabaseServer
      .from('domestic_sm_fse_visits')
      .insert({
        client_id,
        fse_id,
        date,
        sm_status: 'scheduled',
        fse_status: 'pending'
      })
      .select()

    if (error) {
      console.error('Insert error:', error)
      return NextResponse.json({ error: 'Failed to assign FSE' }, { status: 500 })
    }

    return NextResponse.json({ success: true, data })

  } catch (error) {
    console.error('Server error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
