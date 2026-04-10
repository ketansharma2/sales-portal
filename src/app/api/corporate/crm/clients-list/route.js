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

    // Fetch clients with client_id and company_name
    const { data: clients, error } = await supabaseServer
      .from('corporate_crm_clients')
      .select('client_id, company_name')
      .eq('user_id', currentUserId)
      .order('company_name', { ascending: true })

    if (error) {
      console.error('Fetch clients error:', error)
      return NextResponse.json({ error: 'Failed to fetch clients', details: error.message }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      data: clients || []
    })

  } catch (error) {
    console.error('Clients API error:', error)
    return NextResponse.json({ error: 'Internal server error', details: error.message }, { status: 500 })
  }
}