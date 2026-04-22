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
    const { searchParams } = new URL(request.url)
    const fromDate = searchParams.get('fromDate')
    const toDate = searchParams.get('toDate')

    if (!fromDate || !toDate) {
      return NextResponse.json({ error: 'fromDate and toDate required' }, { status: 400 })
    }

    const { count, error } = await supabaseServer
      .from('domestic_crm_emails')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', currentUserId)
      .gte('shared_date', fromDate)
      .lte('shared_date', toDate)

    if (error) {
      console.error('Tracker shared error:', error)
      return NextResponse.json({ error: 'Failed to fetch tracker shared' }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      tracker_shared: count || 0
    })

  } catch (error) {
    console.error('Tracker shared API error:', error)
    return NextResponse.json({
      error: 'Internal server error',
      details: error.message
    }, { status: 500 })
  }
}