import { supabaseServer } from '@/lib/supabase-server'
import { NextResponse } from 'next/server'
import { getUser } from '@/lib/auth-helper'

export async function GET(request) {
  try {
    // Authentication - user injected by middleware (no auth calls needed!)
    const { user, error: authError } = getUser(request);
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
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