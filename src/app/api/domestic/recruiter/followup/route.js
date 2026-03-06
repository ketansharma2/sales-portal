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

    // Get user_id from users table (to match with recruiter_id in revenue)
    const { data: userData, error: userError } = await supabaseServer
      .from('users')
      .select('user_id')
      .eq('email', user.email)
      .single()

    const recruiterId = userError ? user.id : userData?.user_id

    if (!recruiterId) {
      return NextResponse.json({ error: 'User ID not found' }, { status: 400 })
    }

    // Fetch revenue data where recruiter_id matches current user
    const { data: revenue, error } = await supabaseServer
      .from('domestic_crm_revenue')
      .select('*')
      .eq('recruiter_id', recruiterId)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Fetch revenue error:', error)
      return NextResponse.json({ error: 'Failed to fetch revenue data' }, { status: 500 })
    }

    // Fetch candidate follow-ups for this user
    const { data: candidateFollowups, error: followupsError } = await supabaseServer
      .from('domestic_candidate_followup')
      .select('*')
      .eq('user_id', recruiterId)
      .order('created_at', { ascending: false })

    // Group follow-ups by id (which is the revenue/candidate ID)
    const followupsByCandidate = {}
    if (candidateFollowups && candidateFollowups.length > 0) {
      candidateFollowups.forEach(followup => {
        const candidateId = followup.id // This is the revenue/candidate ID
        if (!followupsByCandidate[candidateId]) {
          followupsByCandidate[candidateId] = []
        }
        followupsByCandidate[candidateId].push(followup)
      })
    }

    // Add follow-up history to each revenue record
    if (revenue && revenue.length > 0) {
      revenue.forEach(r => {
        r.followup_history = followupsByCandidate[r.id] || []
      })
    }

    return NextResponse.json({
      success: true,
      data: revenue || []
    })

  } catch (error) {
    console.error('Recruiter followup API error:', error)
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

    // Get user_id from users table
    const { data: userData, error: userError } = await supabaseServer
      .from('users')
      .select('user_id')
      .eq('email', user.email)
      .single()

    const userId = userError ? user.id : userData?.user_id

    if (!userId) {
      return NextResponse.json({ error: 'User ID not found' }, { status: 400 })
    }

    const body = await request.json()
    const { revenue_id, contact_date, remarks, next_follow_up, current_status } = body

    // Validate required fields
    if (!contact_date || !remarks || !current_status) {
      return NextResponse.json({
        error: 'Missing required fields',
        details: 'contact_date, remarks, and current_status are required'
      }, { status: 400 })
    }

    // Insert followup record (id stores the revenue/candidate ID to link followups)
    const { data, error } = await supabaseServer
      .from('domestic_candidate_followup')
      .insert({
        id: revenue_id,
        user_id: userId,
        contact_date,
        remarks,
        next_follow_up: next_follow_up || null,
        current_status
      })
      .select()

    if (error) {
      console.error('Insert followup error:', error)
      return NextResponse.json({ error: 'Failed to create followup' }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      data: data[0]
    }, { status: 201 })

  } catch (error) {
    console.error('Create followup API error:', error)
    return NextResponse.json({
      error: 'Internal server error',
      details: error.message
    }, { status: 500 })
  }
}
