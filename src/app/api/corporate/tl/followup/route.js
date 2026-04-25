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

    // Get user_id from users table
    const { data: userData, error: userError } = await supabaseServer
      .from('users')
      .select('user_id')
      .eq('email', user.email)
      .single()

    const tlId = userError ? user.id : userData?.user_id

    if (!tlId) {
      return NextResponse.json({ error: 'User ID not found' }, { status: 400 })
    }

    // Get recruiters under this TL (where tl_id matches current user)
    const { data: recruiters, error: recruitersError } = await supabaseServer
      .from('users')
      .select('user_id')
      .eq('tl_id', tlId)

    if (recruitersError) {
      console.error('Fetch recruiters error:', recruitersError)
      return NextResponse.json({ error: 'Failed to fetch recruiters' }, { status: 500 })
    }

    const recruiterIds = recruiters?.map(r => r.user_id) || []

    // Include TL's own user_id to fetch follow-ups they added
    const allUserIds = [...recruiterIds, tlId]

    // If no recruiters under this TL, check if TL has any direct follow-ups
    if (recruiterIds.length === 0) {
      return NextResponse.json({
        success: true,
        data: []
      })
    }

     // Fetch revenue data where recruiter_id matches any of the recruiters under this TL
     const { data: revenue, error } = await supabaseServer
       .from('corporate_revenue')
       .select('*')
       .in('recruiter_id', recruiterIds)
       .order('created_at', { ascending: false })

    if (error) {
      console.error('Fetch revenue error:', error)
      return NextResponse.json({ error: 'Failed to fetch revenue data' }, { status: 500 })
    }

    // Fetch recruiter names
    let recruiterMap = {}
    if (recruiterIds.length > 0) {
      const { data: recruiters, error: recruiterError } = await supabaseServer
        .from('users')
        .select('user_id, name')
        .in('user_id', recruiterIds)
      
      if (!recruiterError && recruiters) {
        recruiters.forEach(r => {
          recruiterMap[r.user_id] = r.name
        })
      }
    }

    // Fetch candidate follow-ups for these recruiters AND the TL
    const { data: candidateFollowups, error: followupsError } = await supabaseServer
      .from('corporate_candidate_followup')
      .select('*')
      .in('user_id', allUserIds)
      .order('created_at', { ascending: false })

    // Get all user IDs from follow-ups to fetch their names
    const followupUserIds = [...new Set((candidateFollowups || []).map(f => f.user_id).filter(Boolean))];
    
    let userMap = {}
    if (followupUserIds.length > 0) {
      const { data: followupUsers, error: usersError } = await supabaseServer
        .from('users')
        .select('user_id, name, role')
        .in('user_id', followupUserIds)
      
      if (!usersError && followupUsers) {
        followupUsers.forEach(u => {
          // Store name and role - filter to only show TL or RC
          const roleArr = Array.isArray(u.role) ? u.role : (u.role ? [u.role] : [])
          // Find first role that is TL or RC (case insensitive)
          const relevantRole = roleArr.find(r => r && (r.toUpperCase() === 'TL' || r.toUpperCase() === 'RC'))
          userMap[u.user_id] = { 
            name: u.name,
            role: relevantRole || '' 
          }
        })
      }
    }

    // Group follow-ups by id (which is the revenue/candidate ID) and add user name
    const followupsByCandidate = {}
    if (candidateFollowups && candidateFollowups.length > 0) {
      candidateFollowups.forEach(followup => {
        const candidateId = followup.id // This is the revenue/candidate ID
        if (!followupsByCandidate[candidateId]) {
          followupsByCandidate[candidateId] = []
        }
        // Add loggedBy name and role to the follow-up
        const userInfo = userMap[followup.user_id] || { name: 'Unknown', role: '' }
        followup.loggedBy = typeof userInfo === 'string' ? userInfo : userInfo.name
        followup.loggedByRole = typeof userInfo === 'string' ? '' : userInfo.role
        followupsByCandidate[candidateId].push(followup)
      })
    }

    // Add follow-up history and recruiter name to each revenue record
    if (revenue && revenue.length > 0) {
      revenue.forEach(r => {
        r.followup_history = followupsByCandidate[r.id] || []
        r.recruiter_name = recruiterMap[r.recruiter_id] || null
      })
    }

    return NextResponse.json({
      success: true,
      data: revenue || []
    })

  } catch (error) {
    console.error('TL followup API error:', error)
    return NextResponse.json({
      error: 'Internal server error',
      details: error.message
    }, { status: 500 })
  }
}
