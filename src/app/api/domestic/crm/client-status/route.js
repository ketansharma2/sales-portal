import { supabaseServer } from '@/lib/supabase-server'
import { NextResponse } from 'next/server'
import { getUser } from '@/lib/auth-helper';

export async function PUT(request) {
  try {
      const { user, error: authError } = getUser(request);
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json()
    const { client_id, client_status } = body

    if (!client_id || !client_status) {
      return NextResponse.json({ error: 'client_id and client_status are required' }, { status: 400 })
    }

    if (!['Active', 'Inactive'].includes(client_status)) {
      return NextResponse.json({ error: 'Invalid status. Must be Active or Inactive' }, { status: 400 })
    }

    const { data, error } = await supabaseServer
      .from('domestic_crm_clients')
      .update({ client_status })
      .eq('client_id', client_id)
      .eq('user_id', user.id)
      .select()
      .single()

    if (error) {
      console.error('Update client status error:', error)
      return NextResponse.json({ error: 'Failed to update status', details: error.message }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      data
    })

  } catch (error) {
    console.error('Update client status API error:', error)
    return NextResponse.json({ error: 'Internal server error', details: error.message }, { status: 500 })
  }
}