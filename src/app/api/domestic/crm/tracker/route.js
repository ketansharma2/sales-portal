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

    const { searchParams } = new URL(request.url)
    const branchId = searchParams.get('branch_id')

    if (!branchId) {
      return NextResponse.json({ error: 'Branch ID is required' }, { status: 400 })
    }

    // Fetch trackers for the branch by joining with requirements
    const { data: trackers, error } = await supabaseServer
      .from('domestic_crm_tracker')
      .select(`
        *,
        domestic_crm_reqs!inner(job_title, branch_id)
      `)
      .eq('domestic_crm_reqs.branch_id', branchId)
      .order('tracker_date', { ascending: false })

    if (error) {
      console.error('Fetch trackers error:', error)
      return NextResponse.json({
        error: 'Failed to fetch trackers',
        details: error.message
      }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      data: trackers
    })

  } catch (error) {
    console.error('Get trackers API error:', error)
    return NextResponse.json({
      error: 'Internal server error',
      details: error.message
    }, { status: 500 })
  }
}

export async function POST(request) {
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
    const { req_id, tracker_date, shared, interviewed, selected, joining, not_selected, feedback } = body

    // Validate required fields
    if (!req_id) {
      return NextResponse.json({ error: 'Requirement ID is required' }, { status: 400 })
    }

    // Insert into domestic_crm_tracker table
    const { data: newTracker, error: insertError } = await supabaseServer
      .from('domestic_crm_tracker')
      .insert({
        req_id,
        tracker_date: tracker_date || new Date().toISOString().split('T')[0],
        shared: parseInt(shared) || 0,
        interviewed: parseInt(interviewed) || 0,
        selected: parseInt(selected) || 0,
        joining: parseInt(joining) || 0,
        not_selected: parseInt(not_selected) || 0,
        feedback
      })
      .select()
      .single()

    if (insertError) {
      console.error('Insert tracker error:', insertError)
      return NextResponse.json({
        error: 'Failed to create tracker',
        details: insertError.message
      }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      data: newTracker
    })

  } catch (error) {
    console.error('Create tracker API error:', error)
    return NextResponse.json({
      error: 'Internal server error',
      details: error.message
    }, { status: 500 })
  }
}