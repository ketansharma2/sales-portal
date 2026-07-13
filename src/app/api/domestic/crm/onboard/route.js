import { supabaseServer } from '@/lib/supabase-server'
import { NextResponse } from 'next/server'
import { getUser } from '@/lib/auth-helper';

export async function GET(request) {
  try {
    // Authentication
      const { user, error: authError } = getUser(request);
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Fetch clients assigned to this CRM user
    const { data: clients, error: clientsError } = await supabaseServer
      .from('domestic_crm_clients')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (clientsError) {
      console.error('Fetch CRM clients error:', clientsError)
      return NextResponse.json({
        error: 'Failed to fetch clients',
        details: clientsError.message
      }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      data: clients || [],
      count: clients?.length || 0
    })

  } catch (error) {
    console.error('CRM onboard API error:', error)
    return NextResponse.json({
      error: 'Internal server error',
      details: error.message
    }, { status: 500 })
  }
}