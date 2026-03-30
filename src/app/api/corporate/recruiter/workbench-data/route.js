import { supabaseServer } from '@/lib/supabase-server';
import { NextResponse } from 'next/server';

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

    const currentUserId = user.user_id || user.id
    const { searchParams } = new URL(request.url)
    const fromDate = searchParams.get('fromDate')
    const toDate = searchParams.get('toDate')

    // Build query to fetch workbench data for the user with date filter
    let query = supabaseServer
      .from('corporate_workbench')
      .select('*')
      .eq('sent_to_rc', currentUserId)

    // Add date range filter if provided
    if (fromDate && toDate) {
      query = query.gte('date', fromDate).lte('date', toDate)
    }

    const { data: workbenchData, error: workbenchError } = await query

    if (workbenchError) {
      console.error('Fetch workbench error:', workbenchError)
      return NextResponse.json({ error: 'Failed to fetch workbench data', details: workbenchError.message }, { status: 500 })
    }

    if (!workbenchData || workbenchData.length === 0) {
      return NextResponse.json({ success: true, data: [] })
    }

    // Get unique req_ids and tl_ids
    const reqIds = [...new Set(workbenchData.map(item => item.req_id).filter(Boolean))] || []
    const tlIds = [...new Set(workbenchData.map(item => item.sent_to_tl).filter(Boolean))] || []

    // Fetch requirements for job details
    let reqsData = []
    if (reqIds.length > 0) {
      const { data: requirements } = await supabaseServer
        .from('corporate_crm_reqs')
        .select('req_id, job_title, package')
        .in('req_id', reqIds)
      
      reqsData = requirements || []
    }

    // Fetch TL users for names
    let usersData = []
    if (tlIds.length > 0) {
      const { data: users } = await supabaseServer
        .from('users')
        .select('user_id, name')
        .in('user_id', tlIds)
      
      usersData = users || []
    }

    // Create lookup maps
    const reqsMap = new Map(reqsData.map(r => [r.req_id, r]))
    const usersMap = new Map(usersData.map(u => [u.user_id, u]))

    // Transform data with joins
    const transformedData = await Promise.all(workbenchData.map(async (item) => {
      const req = reqsMap.get(item.req_id)
      const tl = usersMap.get(item.sent_to_tl)

      // Fetch conversation stats for this req_id and date
      let conversationStats = { conversion: 0, asset: 0, tracker_sent: 0 }
      
      if (item.req_id && item.date) {
        const convQuery = supabaseServer
          .from('candidates_conversation')
          .select('candidate_status')
          .eq('req_id', item.req_id)
          .eq('user_id', currentUserId)
          .eq('calling_date', item.date)
        
        const { data: convData } = await convQuery
        
        if (convData && convData.length > 0) {
          conversationStats = {
            conversion: convData.filter(c => c.candidate_status === 'Conversion').length,
            asset: convData.filter(c => c.candidate_status === 'Asset').length,
            tracker_sent: convData.length
          }
        }
      }

      return {
        workbench_id: item.workbench_id,
        date: item.date,
        req_id: item.req_id,
        job_title: req?.job_title || '',
        package: req?.package || item.package || '',
        requirement: item.req || 0,
        sent_to_tl: item.sent_to_tl,
        tl_name: tl?.name || 'Unknown TL',
        slot: item.slot || '',
        advance_sti: item.advance_sti || 0,
        rc_remarks: item.rc_remarks || '',
        conversion: conversationStats.conversion,
        asset: conversationStats.asset,
        tracker_sent: conversationStats.tracker_sent,
        cv_naukri: 0,
        cv_indeed: 0,
        cv_other: 0
      }
    }))

    return NextResponse.json({ 
      success: true, 
      data: transformedData
    })

  } catch (error) {
    console.error('Server error:', error)
    return NextResponse.json({ error: 'Internal server error', details: error.message }, { status: 500 })
  }
}