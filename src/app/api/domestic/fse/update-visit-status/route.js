import { supabaseServer } from '@/lib/supabase-server';
import { NextResponse } from 'next/server';
import { getUser } from '@/lib/auth-helper';

export async function POST(request) {
  try {
    // Authentication
      const { user, error: authError } = getUser(request);
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user has FSE role
    const { data: userProfile, error: profileError } = await supabaseServer
      .from('users')
      .select('role')
      .eq('user_id', user.id)
      .single()

    if (profileError || !userProfile) {
      return NextResponse.json({ error: 'User profile not found' }, { status: 404 })
    }

    if (!userProfile.role || !userProfile.role.includes('FSE')) {
      return NextResponse.json({ error: 'Access denied. FSE role required.' }, { status: 403 })
    }

    const body = await request.json();
    const { id, status } = body;

    if (!id || !status) {
      return NextResponse.json({ error: 'Missing id or status' }, { status: 400 });
    }

    const fse_id = user.id

    // Update the fse_status
    const { data, error } = await supabaseServer
      .from('domestic_sm_fse_visits')
      .update({ fse_status: status })
      .eq('id', id)
      .eq('fse_id', fse_id); // Ensure only the FSE can update their own assignments

    if (error) {
      console.error('Update error:', error);
      return NextResponse.json({ error: 'Failed to update status' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: 'Status updated successfully'
    });

  } catch (error) {
    console.error('Server error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}