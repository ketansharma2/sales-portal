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

    const { searchParams } = new URL(request.url)
    const revenue_id = searchParams.get('revenue_id')

    if (!revenue_id) {
      return NextResponse.json({ error: 'Missing required field: revenue_id' }, { status: 400 })
    }

    const { data: tracks, error: tracksError } = await supabaseServer
      .from('domestic_retention_logs')
      .select('*')
      .eq('revenue_id', revenue_id)
      .order('created_at', { ascending: false })

    if (tracksError) {
      console.error('Fetch domestic retention track error:', tracksError)
      return NextResponse.json({ error: 'Failed to fetch retention tracking logs' }, { status: 500 })
    }

    // Remap fields to match what the frontend expects (like corporate style)
    const mappedTracks = (tracks || []).map(t => ({
      ...t,
      date: t.log_date,
      next_follow_up: t.next_followup_date,
      remarks: t.remark
    }))

    return NextResponse.json({ success: true, data: mappedTracks })

  } catch (error) {
    console.error('Domestic retention-track GET error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request) {
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
    const body = await request.json()
    const { revenue_id, date, next_followup_date, retention_status, remark, retention_amount } = body

    if (!revenue_id || !date) {
      return NextResponse.json({ error: 'Missing required fields: revenue_id and date' }, { status: 400 })
    }

    const { data: revenue, error: revError } = await supabaseServer
      .from('domestic_revenue')
      .select('revenue_id')
      .eq('revenue_id', revenue_id)
      .single()

    if (revError || !revenue) {
      return NextResponse.json({ error: 'Revenue record not found' }, { status: 404 })
    }

    const insertData = {
      revenue_id,
      user_id: currentUserId,
      log_date: date,
      next_followup_date: next_followup_date || null,
      retention_status: retention_status || 'In Progress',
      remark: remark || null,
      retention_amount: retention_amount || null,
      logged_by: 'Current User',
      created_at: new Date().toISOString()
    }

    const { data: track, error: insertError } = await supabaseServer
      .from('domestic_retention_logs')
      .insert(insertData)
      .select()
      .single()

    if (insertError) {
      console.error('Insert domestic retention track error:', insertError)
      return NextResponse.json({ error: 'Failed to save retention tracking log' }, { status: 500 })
    }

    return NextResponse.json({ success: true, data: { ...track, ...insertData } }, { status: 201 })

  } catch (error) {
    console.error('Domestic retention-track POST error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
