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

    // Get candidate_id from query params
    const { searchParams } = new URL(request.url)
    const candidateId = searchParams.get('candidate_id')

    if (!candidateId) {
      return NextResponse.json({ error: 'Candidate ID is required' }, { status: 400 })
    }

    // Fetch candidate follow-ups for this specific revenue/candidate ID
    const { data: followups, error } = await supabaseServer
      .from('corporate_candidate_followup')
      .select('*')
      .eq('id', candidateId)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Fetch candidate followup error:', error)
      return NextResponse.json({ error: 'Failed to fetch follow-ups' }, { status: 500 })
    }

    // Get all unique user IDs to fetch names
    const userIds = [...new Set((followups || []).map(f => f.user_id).filter(Boolean))]

    let userMap = {}
    if (userIds.length > 0) {
      const { data: users, error: usersError } = await supabaseServer
        .from('users')
        .select('user_id, name')
        .in('user_id', userIds)

      if (!usersError && users) {
        users.forEach(u => {
          userMap[u.user_id] = u.name
        })
      }
    }

    // Add loggedBy name to each follow-up
    const followupsWithNames = (followups || []).map(followup => ({
      ...followup,
      loggedBy: userMap[followup.user_id] || 'Unknown'
    }))

    return NextResponse.json({
      success: true,
      data: followupsWithNames
    })

  } catch (error) {
    console.error('Candidate followup API error:', error)
    return NextResponse.json({
      error: 'Internal server error',
      details: error.message
    }, { status: 500 })
  }
}
