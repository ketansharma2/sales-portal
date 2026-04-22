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
    const tlId = searchParams.get('tl_id')
    const rcId = searchParams.get('rc_id')

    let query = supabaseServer
      .from('domestic_workbench')
      .select('*')
      .order('created_at', { ascending: false })

    if (fromDate && toDate) {
      query = query.gte('date', fromDate).lte('date', toDate)
    } else if (fromDate) {
      query = query.eq('date', fromDate)
    }

    if (tlId) {
      query = query.eq('sent_to_tl', tlId)
    }

    if (rcId) {
      query = query.eq('sent_to_rc', rcId)
    }

    const { data: workbenchData, error: fetchError } = await query

    if (fetchError) {
      console.error('Fetch CRM workbench error:', fetchError)
      return NextResponse.json({
        error: 'Failed to fetch workbench data',
        details: fetchError.message
      }, { status: 500 })
    }

    const reqIds = [...new Set(workbenchData.map(item => item.req_id).filter(Boolean))]
    const recruiterIds = [...new Set(workbenchData.map(item => item.sent_to_rc).filter(Boolean))]
    const tlIds = [...new Set(workbenchData.map(item => item.sent_to_tl).filter(Boolean))]

    let reqsData = []
    if (reqIds.length > 0) {
      const { data: requirements } = await supabaseServer
        .from('domestic_crm_reqs')
        .select('req_id, branch_id, job_title, experience, package, openings, location, employment_type, working_days, timings, tool_req, job_summary, rnr, req_skills, preferred_qual, company_offers, contact_details')
        .in('req_id', reqIds)
      
      reqsData = requirements || []
    }

    const branchIds = [...new Set(reqsData.map(r => r.branch_id).filter(Boolean))] || []
    let branchesData = []
    if (branchIds.length > 0) {
      const { data: branches } = await supabaseServer
        .from('domestic_crm_branch')
        .select('branch_id, client_id')
        .in('branch_id', branchIds)
      
      branchesData = branches || []
    }
    const branchesMap = new Map(branchesData.map(b => [b.branch_id, b.client_id]))

    const clientIds = [...new Set(branchesData.map(b => b.client_id).filter(Boolean))] || []
    let clientsData = []
    if (clientIds.length > 0) {
      const { data: clients } = await supabaseServer
        .from('domestic_crm_clients')
        .select('client_id, company_name')
        .in('client_id', clientIds)
      
      clientsData = clients || []
    }
    const clientsMap = new Map(clientsData.map(c => [c.client_id, c.company_name]))

    let usersData = []
    const allUserIds = [...recruiterIds, ...tlIds]
    if (allUserIds.length > 0) {
      const { data: users } = await supabaseServer
        .from('users')
        .select('user_id, name, email')
        .in('user_id', allUserIds)
      
      usersData = users || []
    }
    const usersMap = new Map(usersData.map(u => [u.user_id, u]))

    const workbenchIds = workbenchData?.map(item => item.workbench_id).filter(Boolean) || []
    let stiData = []
    if (workbenchIds.length > 0) {
      const { data: stiRecords } = await supabaseServer
        .from('domestic_workbench_sti')
        .select('workbench_id, advance_sti')
        .in('workbench_id', workbenchIds)
      
      stiData = stiRecords || []
    }

    const stiSumMap = new Map()
    stiData.forEach(item => {
      const current = stiSumMap.get(item.workbench_id) || 0
      stiSumMap.set(item.workbench_id, current + (parseFloat(item.advance_sti) || 0))
    })

    const countsPromises = workbenchData.map(async (item) => {
      if (!item.req_id || !item.sent_to_rc || !item.date) return { workbench_id: item.workbench_id, tracker_sent: 0, today_asset: 0, today_conversion: 0, cv_naukri: 0, cv_indeed: 0, cv_other: 0, totalCv: 0, tracker_shared: 0 };
      
      const { data: conversationData } = await supabaseServer
        .from('candidates_conversation')
        .select('conversation_id')
        .eq('req_id', item.req_id)
        .eq('user_id', item.sent_to_rc)
        .eq('calling_date', item.date);
      
      const conversationIds = conversationData?.map(c => c.conversation_id).filter(Boolean) || [];
      
      const { count: trackerCount } = await supabaseServer
        .from('candidates_conversation')
        .select('*', { count: 'exact', head: true })
        .eq('req_id', item.req_id)
        .eq('user_id', item.sent_to_rc)
        .eq('calling_date', item.date)
        .not('sent_to_crm', 'is', null)
        .eq('crm_sent_date', item.date);
      
      const { count: assetCount } = await supabaseServer
        .from('candidates_conversation')
        .select('*', { count: 'exact', head: true })
        .eq('req_id', item.req_id)
        .eq('user_id', item.sent_to_rc)
        .eq('calling_date', item.date)
        .eq('candidate_status', 'Asset');
      
      const { count: conversionCount } = await supabaseServer
        .from('candidates_conversation')
        .select('*', { count: 'exact', head: true })
        .eq('req_id', item.req_id)
        .eq('user_id', item.sent_to_rc)
        .eq('calling_date', item.date)
        .eq('candidate_status', 'Conversion');
      
      let trackerShared = 0;
      if (conversationIds.length > 0) {
        const { count: sharedCount } = await supabaseServer
          .from('domestic_crm_emails')
          .select('id', { count: 'exact', head: true })
          .eq('user_id', currentUserId)
          .eq('req_id', item.req_id)
          .in('conversation_id', conversationIds)
          .gte('shared_date', item.date)
          .lte('shared_date', item.date);
        
        trackerShared = sharedCount || 0;
      }
      
      const { data: trackerRows } = await supabaseServer
        .from('candidates_conversation')
        .select('parsing_id')
        .eq('req_id', item.req_id)
        .eq('user_id', item.sent_to_rc)
        .eq('calling_date', item.date)
        .not('parsing_id', 'is', null);
      
      const parsingIds = [...new Set(trackerRows?.map(r => r.parsing_id).filter(Boolean))];
      
      let cv_naukri = 0, cv_indeed = 0, cv_other = 0;
      if (parsingIds.length > 0) {
        const { data: cvData } = await supabaseServer
          .from('cv_parsing')
          .select('portal')
          .in('id', parsingIds)
          .eq('portal_date', item.date);
        
        cv_naukri = cvData?.filter(c => c.portal === 'Naukri').length || 0;
        cv_indeed = cvData?.filter(c => c.portal === 'Indeed').length || 0;
        cv_other = cvData?.filter(c => c.portal === 'Other').length || 0;
      }
      
      return { 
        workbench_id: item.workbench_id, 
        tracker_sent: trackerCount || 0, 
        today_asset: assetCount || 0, 
        today_conversion: conversionCount || 0,
        cv_naukri,
        cv_indeed,
        cv_other,
        totalCv: cv_naukri + cv_indeed + cv_other,
        tracker_shared: trackerShared
      };
    });
    const countsResults = await Promise.all(countsPromises);
    const trackerSentMap = new Map(countsResults.map(r => [r.workbench_id, r.tracker_sent]));
    const todayAssetMap = new Map(countsResults.map(r => [r.workbench_id, r.today_asset]));
    const todayConversionMap = new Map(countsResults.map(r => [r.workbench_id, r.today_conversion]));
    const cvNaukriMap = new Map(countsResults.map(r => [r.workbench_id, r.cv_naukri]));
    const cvIndeedMap = new Map(countsResults.map(r => [r.workbench_id, r.cv_indeed]));
    const cvOtherMap = new Map(countsResults.map(r => [r.workbench_id, r.cv_other]));
    const totalCvMap = new Map(countsResults.map(r => [r.workbench_id, r.totalCv]));
    const trackerSharedMap = new Map(countsResults.map(r => [r.workbench_id, r.tracker_shared]));

    const reqsMap = new Map(reqsData.map(r => [r.req_id, r]))

    const transformedData = workbenchData.map(item => {
      const req = reqsMap.get(item.req_id)
      const tlUser = usersMap.get(item.sent_to_tl)
      const rcUser = usersMap.get(item.sent_to_rc)
      
      const branchClientId = req?.branch_id ? branchesMap.get(req.branch_id) : null
      const clientName = branchClientId ? clientsMap.get(branchClientId) || 'Unknown Client' : 'Unknown Client'

      return {
        id: item.workbench_id,
        date: item.date,
        req_id: item.req_id,
        client_name: clientName,
        job_title: req?.job_title || 'Unknown Requirement',
        experience: req?.experience || '',
        package: item.package || req?.package || '',
        openings: req?.openings || 0,
        requirement: item.req,
        sent_to_tl: item.sent_to_tl,
        sent_to_rc: item.sent_to_rc,
        tl_name: tlUser?.name || '',
        recruiter_name: rcUser?.name || '',
        slot: item.slot || '',
        user_id: item.user_id,
        created_at: item.created_at,
        tracker_sent: trackerSentMap.get(item.workbench_id) || 0,
        today_asset: todayAssetMap.get(item.workbench_id) || 0,
        today_conversion: todayConversionMap.get(item.workbench_id) || 0,
        cv_naukri: cvNaukriMap.get(item.workbench_id) || 0,
        cv_indeed: cvIndeedMap.get(item.workbench_id) || 0,
        cv_other: cvOtherMap.get(item.workbench_id) || 0,
        totalCv: totalCvMap.get(item.workbench_id) || 0,
        tracker_shared: trackerSharedMap.get(item.workbench_id) || 0,
        tl_remarks: item.tl_remarks || '',
        rc_remarks: item.rc_remarks || '',
        advance_sti: stiSumMap.get(item.workbench_id) || 0,
        location: req?.location || '',
        employment_type: req?.employment_type || '',
        working_days: req?.working_days || '',
        timings: req?.timings || '',
        tool_requirement: req?.tool_req || '',
        job_summary: req?.job_summary || '',
        rnr: req?.rnr || '',
        req_skills: req?.req_skills || '',
        preferred_qual: req?.preferred_qual || '',
        company_offers: req?.company_offers || '',
        contact_details: req?.contact_details || ''
      }
    })

    return NextResponse.json({
      success: true,
      data: transformedData
    })

  } catch (error) {
    console.error('Fetch CRM workbench API error:', error)
    return NextResponse.json({
      error: 'Internal server error',
      details: error.message
    }, { status: 500 })
  }
}