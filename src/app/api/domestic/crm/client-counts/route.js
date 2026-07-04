import { supabaseServer } from '@/lib/supabase-server'
import { NextResponse } from 'next/server'
import { getUser } from '@/lib/auth-helper';

export async function GET(request) {
  try {
      const { user, error: authError } = getUser(request);
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const currentUserId = user.user_id || user.id

    const { data: clients, error } = await supabaseServer
      .from('domestic_crm_clients')
      .select('client_status')
      .eq('user_id', currentUserId)

    if (error) {
      console.error('Fetch clients error:', error)
      return NextResponse.json({ error: 'Failed to fetch clients', details: error.message }, { status: 500 })
    }

    const activeCount = (clients || []).filter(c => c.client_status === 'Active').length
    const nonActiveCount = (clients || []).filter(c => c.client_status === 'Inactive' || c.client_status === null).length

    return NextResponse.json({
      success: true,
      active: activeCount,
      nonActive: nonActiveCount
    })

  } catch (error) {
    console.error('Client counts API error:', error)
    return NextResponse.json({ error: 'Internal server error', details: error.message }, { status: 500 })
  }
}