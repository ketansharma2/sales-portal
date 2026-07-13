import { supabaseServer } from '@/lib/supabase-server';
import { NextResponse } from 'next/server';
import { getUser } from '@/lib/auth-helper';

export async function PUT(request) {
  try {
      const { user, error: authError } = getUser(request);
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json()
    const { id, rc_remarks } = body

    if (!id) {
      return NextResponse.json({ error: 'workbench_id is required' }, { status: 400 })
    }

    const { data, error } = await supabaseServer
      .from('domestic_workbench')
      .update({
        rc_remarks: rc_remarks || null,
        status: 'Done'
      })
      .eq('workbench_id', id)
      .select()
      .single()

    if (error) {
      console.error('Update remarks error:', error)
      return NextResponse.json({ error: 'Failed to update remarks', details: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, data })

  } catch (error) {
    console.error('Server error:', error)
    return NextResponse.json({ error: 'Internal server error', details: error.message }, { status: 500 })
  }
}