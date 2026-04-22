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
      const { data: requirements, error: reqError } = await supabaseServer
        .from('corporate_crm_reqs')
        .select('req_id, branch_id, job_title, package, location, experience, employment_type, working_days, timings, tool_req, job_summary, rnr, req_skills, preferred_qual, company_offers, contact_details, jd_link')
        .in('req_id', reqIds)
      
      if (reqError) {
        console.error('Fetch requirements error:', reqError)
      }
      reqsData = requirements || []
      console.log('reqIds:', reqIds, 'reqsData:', reqsData)
    }

    // Fetch branch to client mapping
    const branchIds = [...new Set(reqsData.map(r => r.branch_id).filter(Boolean))] || []
    let branchesData = []
    if (branchIds.length > 0) {
      const { data: branches } = await supabaseServer
        .from('corporate_crm_branch')
        .select('branch_id, client_id')
        .in('branch_id', branchIds)
      
      branchesData = branches || []
    }
    const branchesMap = new Map(branchesData.map(b => [b.branch_id, b.client_id]))

    // Fetch client names
    const clientIds = [...new Set(branchesData.map(b => b.client_id).filter(Boolean))] || []
    let clientsData = []
    if (clientIds.length > 0) {
      const { data: clients } = await supabaseServer
        .from('corporate_crm_clients')
        .select('client_id, company_name')
        .in('client_id', clientIds)
      
      clientsData = clients || []
    }
    const clientsMap = new Map(clientsData.map(c => [c.client_id, c.company_name]))

    // Fetch TL users for names
    let usersData = []
    if (tlIds.length > 0) {
      const { data: users } = await supabaseServer
        .from('users')
        .select('user_id, name')
        .in('user_id', tlIds)
      
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
    const usersMap = new Map(usersData.map(u => [u.user_id, u]))
    
    console.log('reqsMap:', reqsMap)

    // Transform data with joins
    const transformedData = await Promise.all(workbenchData.map(async (item) => {
      const req = reqsMap.get(item.req_id)
      const tl = usersMap.get(item.sent_to_tl)
      const totalSti = stiSumMap.get(item.workbench_id) || 0
      const clientName = req?.branch_id ? clientsMap.get(branchesMap.get(req.branch_id)) || '' : ''
      
      console.log('item.req_id:', item.req_id, 'req:', req)

      // Fetch conversation stats for this req_id and date
      let conversationStats = { conversion: 0, asset: 0, tracker_sent: 0, cv_sourced: 0, cv_naukri: 0, cv_indeed: 0, cv_other: 0 }
      
      if (item.req_id && item.date) {
        const convQuery = supabaseServer
          .from('candidates_conversation')
          .select('candidate_status, sent_to_tl, calling_date, parsing_id, sent_date')
          .eq('req_id', item.req_id)
          .eq('user_id', currentUserId)
          .eq('calling_date', item.date)

        const { data: convData } = await convQuery

        if (convData && convData.length > 0) {
          const filteredConvData = convData.filter(conv => {
            if (!conv.sent_to_tl) return false
            if (!conv.calling_date || !conv.sent_date) return false
            const callingDateStr = conv.calling_date.split('T')[0]
            const sentDateStr = conv.sent_date.split('T')[0]
            return callingDateStr === sentDateStr
          })

          conversationStats = {
            conversion: filteredConvData.filter(c => c.candidate_status === 'Conversion').length,
            asset: filteredConvData.filter(c => c.candidate_status === 'Asset').length,
            tracker_sent: filteredConvData.length,
            cv_sourced: 0,
            cv_naukri: 0,
            cv_indeed: 0,
            cv_other: 0
          }
        }

        const parsingIds = [
          ...new Set(
            (convData || [])
              .map(c => c.parsing_id)
              .filter(id => id)
          )
        ]

        let parsingData = []

        if (parsingIds.length > 0) {
          const { data, error } = await supabaseServer
            .from('cv_parsing')
            .select('id, portal, portal_date')
            .in('id', parsingIds)

          if (error) console.log(error)

          parsingData = data || []
        }

        const matchedData = (convData || []).map(conv => {
          const match = parsingData.find(p => {
            const pDate = p.portal_date?.split('T')[0]
            const cDate = conv.calling_date?.split('T')[0]
            return p.id === conv.parsing_id && pDate === cDate
          })
          return match
            ? { ...conv, portal: match.portal }
            : null
        }).filter(Boolean)

        if (matchedData.length > 0) {
          const uniqueMatchedData = [...new Map(matchedData.map(item => [item.parsing_id, item])).values()]

          const portalCounts = uniqueMatchedData.reduce(
            (acc, row) => {
              const portal = row.portal?.toLowerCase() || ''
              if (portal.includes('naukri')) acc.cv_naukri++
              else if (portal.includes('indeed')) acc.cv_indeed++
              else acc.cv_other++
              acc.cv_sourced++
              return acc
            },
            { cv_sourced: 0, cv_naukri: 0, cv_indeed: 0, cv_other: 0 }
          )

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
        client_name: clientName,
        job_title: req?.job_title || '',
        package: req?.package || item.package || '',
        requirement: item.req || 0,
        sent_to_tl: item.sent_to_tl,
        tl_name: tl?.name || 'Unknown TL',
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
        // JD Details from corporate_crm_reqs
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
        jd_link: req?.jd_link || ''
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