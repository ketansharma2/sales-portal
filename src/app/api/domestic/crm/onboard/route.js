import { supabaseServer } from '@/lib/supabase-server'
import { NextResponse } from 'next/server'

export async function GET(request) {
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

    // Fetch clients assigned to this CRM user
    const { data: clients, error: clientsError } = await supabaseServer
      .from('domestic_crm_clients')
      .select('*')
      .eq('user_id', user.id)
      .order('onboarding_date', { ascending: false })

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