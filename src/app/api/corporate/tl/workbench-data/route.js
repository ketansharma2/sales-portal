import { supabaseServer } from '@/lib/supabase-server';
import { NextResponse } from 'next/server';

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
    const recruiterId = searchParams.get('recruiter_id')

    // First check current user's role from users table
    const { data: currentUserData } = await supabaseServer
      .from('users')
      .select('user_id, name, email, role')
      .eq('user_id', currentUserId)
      .single()
    
    const currentUserRole = currentUserData?.role || []
    const isCurrentUserRC = currentUserRole.includes('RC')

    // Get RC users under this TL
    let rcUsersQuery = supabaseServer
      .from('users')
      .select('user_id, name, email, role')
      .eq('sector', 'Corporate')
      .eq('tl_id', currentUserId)
      .contains('role', ['RC'])

    const { data: rcUsersData } = await rcUsersQuery
    let rcUserIds = rcUsersData?.map(u => u.user_id) || []
    
    // If current user is RC, add them to the list
    if (isCurrentUserRC) {
      const currentUserAlreadyInList = rcUserIds.some(id => id === currentUserId)
      if (!currentUserAlreadyInList) {
        rcUserIds.unshift(currentUserId)
      }
    }

    // If specific recruiter is selected, use only that user
    if (recruiterId) {
      rcUserIds = [recruiterId]
    }

    if (rcUserIds.length === 0) {
      return NextResponse.json({ success: true, data: [] })
    }

    // Build query to fetch workbench data for RCs with date filter
    let query = supabaseServer
      .from('corporate_workbench')
      .select('*')
      .in('sent_to_rc', rcUserIds)

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

    // Get unique req_ids and rc_ids
    const reqIds = [...new Set(workbenchData.map(item => item.req_id).filter(Boolean))] || []
    const rcIds = [...new Set(workbenchData.map(item => item.sent_to_rc).filter(Boolean))] || []

    // Fetch requirements for job details
    let reqsData = []
    if (reqIds.length > 0) {
      const { data: requirements, error: reqError } = await supabaseServer
        .from('corporate_crm_reqs')
        .select('req_id, job_title, package, location, experience, employment_type, working_days, timings, tool_req, job_summary, rnr, req_skills, preferred_qual, company_offers, contact_details, jd_link')
        .in('req_id', reqIds)
      
      if (reqError) {
        console.error('Fetch requirements error:', reqError)
      }
      reqsData = requirements || []
    }

    // Fetch RC users for names
    let usersData = []
    if (rcIds.length > 0) {
      const { data: users } = await supabaseServer
        .from('users')
        .select('user_id, name')
        .in('user_id', rcIds)
      
      usersData = users || []
    }

    // Fetch STI data for all workbench ids
    const workbenchIds = workbenchData?.map(item => item.workbench_id).filter(Boolean) || []
    let stiData = []
    if (workbenchIds.length > 0) {
      const { data: stiRecords } = await supabaseServer
        .from('corporate_workbench_sti')
        .select('workbench_id, advance_sti')
        .in('workbench_id', workbenchIds)
      
      stiData = stiRecords || []
    }

    // Calculate STI sum per workbench_id
    const stiSumMap = new Map()
    stiData.forEach(item => {
      const current = stiSumMap.get(item.workbench_id) || 0
      stiSumMap.set(item.workbench_id, current + (parseFloat(item.advance_sti) || 0))
    })

    // Create lookup maps
    const reqsMap = new Map(reqsData.map(r => [r.req_id, r]))
    const usersMap = new Map(usersData.map(u => [u.user_id, u.name]))

    // Transform data with joins
    const transformedData = await Promise.all(workbenchData.map(async (item) => {
      const req = reqsMap.get(item.req_id)
      const rcName = usersMap.get(item.sent_to_rc) || 'Unknown RC'
      const totalSti = stiSumMap.get(item.workbench_id) || 0

      // Fetch conversation stats for this req_id, user_id and date
      let conversationStats = { conversion: 0, asset: 0, tracker_sent: 0, cv_sourced: 0, cv_naukri: 0, cv_indeed: 0, cv_other: 0 }
      
      if (item.req_id && item.date) {
        // Get conversation stats
        const convQuery = supabaseServer
          .from('candidates_conversation')
          .select('candidate_status')
          .eq('req_id', item.req_id)
          .eq('user_id', item.sent_to_rc)
          .eq('calling_date', item.date)
        
        const { data: convData } = await convQuery
        
        if (convData && convData.length > 0) {
          conversationStats = {
            conversion: convData.filter(c => c.candidate_status === 'Conversion').length,
            asset: convData.filter(c => c.candidate_status === 'Asset').length,
            tracker_sent: convData.length,
            cv_sourced: 0,
            cv_naukri: 0,
            cv_indeed: 0,
            cv_other: 0
          }
        }
        
        // Get CV sourced: count cv_parsing where portal_date = item.date
        const cvParsingQuery = supabaseServer
          .from('cv_parsing')
          .select('portal')
          .eq('req_id', item.req_id)
          .eq('user_id', item.sent_to_rc)
          .eq('portal_date', item.date)
        
        const { data: cvParsingData } = await cvParsingQuery
        
        if (cvParsingData && cvParsingData.length > 0) {
          const portalCounts = cvParsingData.reduce((acc, row) => {
            const portal = row.portal?.toLowerCase() || ''
            if (portal.includes('naukri')) {
              acc.cv_naukri++
            } else if (portal.includes('indeed')) {
              acc.cv_indeed++
            } else {
              acc.cv_other++
            }
            acc.cv_sourced++
            return acc
          }, { cv_sourced: 0, cv_naukri: 0, cv_indeed: 0, cv_other: 0 })
          
          conversationStats = {
            ...conversationStats,
            ...portalCounts
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
        sent_to_rc: item.sent_to_rc,
        rc_name: rcName,
        slot: item.slot || '',
        advance_sti: totalSti,
        rc_remarks: item.rc_remarks || '',
        conversion: conversationStats.conversion,
        asset: conversationStats.asset,
        tracker_sent: conversationStats.tracker_sent,
        cv_sourced: conversationStats.cv_sourced,
        cv_naukri: conversationStats.cv_naukri,
        cv_indeed: conversationStats.cv_indeed,
        cv_other: conversationStats.cv_other,
        location: req?.location || '',
        experience: req?.experience || '',
        employment_type: req?.employment_type || '',
        working_days: req?.working_days || '',
        timings: req?.timings || '',
        tool_requirement: req?.tool_req || '',
        job_summary: req?.job_summary || '',
        rnr: req?.rnr || '',
        req_skills: req?.req_skills || '',
        preferred_qual: req?.preferred_qual || '',
        company_offers: req?.company_offers || '',
        contact_details: req?.contact_details || '',
        jd_link: req?.jd_link || '',
        rc_remarks: item.rc_remarks || '',
        tl_remarks: item.tl_remarks || ''
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
