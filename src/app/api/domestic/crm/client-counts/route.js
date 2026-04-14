import { supabaseServer } from '@/lib/supabase-server'
import { NextResponse } from 'next/server'

export async function GET(request) {
  try {
    const authHeader = request.headers.get('authorization')
    if (!authHeader) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authError } = await supabaseServer.auth.getUser(token)
    if (authError || !user) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
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