import { supabaseServer } from '@/lib/supabase-server';
import { NextResponse } from 'next/server';

export async function PUT(request) {
  try {
    // Authentication
    const authHeader = request.headers.get('authorization')
    if (!authHeader) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authError } = await supabaseServer.auth.getUser(token)
    if (authError || !user) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }

    const body = await request.json()
    const { id, rc_remarks } = body

    if (!id) {
      return NextResponse.json({ error: 'workbench_id is required' }, { status: 400 })
    }

    // Update rc_remarks and status in corporate_workbench
    const { data, error } = await supabaseServer
      .from('corporate_workbench')
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