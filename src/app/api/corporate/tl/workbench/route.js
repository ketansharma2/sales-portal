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

    // Get current user's ID
    const currentUserId = user.user_id || user.id

    // Build query for workbench data filtered by sent_to_tl
    let query = supabaseServer
      .from('corporate_workbench')
      .select('*')
      .eq('sent_to_tl', currentUserId)
      .order('created_at', { ascending: false })

    const { data: workbenchData, error: fetchError } = await query

    if (fetchError) {
      console.error('Fetch TL workbench error:', fetchError)
      return NextResponse.json({
        error: 'Failed to fetch workbench data',
        details: fetchError.message
      }, { status: 500 })
    }

    // Fetch related data separately
    const clientIds = [...new Set(workbenchData.map(item => item.client_id).filter(Boolean))]
    const reqIds = [...new Set(workbenchData.map(item => item.req_id).filter(Boolean))]
    const recruiterIds = [...new Set(workbenchData.map(item => item.sent_to_rc).filter(Boolean))]

    // Fetch clients
    const { data: clientsData } = await supabaseServer
      .from('corporate_crm_clients')
      .select('client_id, company_name')
      .in('client_id', clientIds)

    // Fetch requirements
    const { data: reqsData } = await supabaseServer
      .from('corporate_crm_reqs')
      .select('req_id, job_title, experience, package, openings, location, employment_type, working_days, timings, tool_req, job_summary, rnr, req_skills, preferred_qual, company_offers, contact_details')
      .in('req_id', reqIds)

    // Fetch recruiters
    const { data: recruitersData } = await supabaseServer
      .from('users')
      .select('user_id, name, email')
      .in('user_id', recruiterIds)

    // Fetch tracker sent, today_asset, today_conversion, and CV counts for each workbench item
    const countsPromises = workbenchData.map(async (item) => {
      if (!item.req_id || !item.sent_to_rc || !item.date) return { workbench_id: item.workbench_id, tracker_sent: 0, today_asset: 0, today_conversion: 0, cv_naukri: 0, cv_indeed: 0, cv_other: 0, totalCv: 0 };
      
      // Tracker sent count
      const { count: trackerCount } = await supabaseServer
        .from('candidates_conversation')
        .select('*', { count: 'exact', head: true })
        .eq('req_id', item.req_id)
        .eq('user_id', item.sent_to_rc)
        .eq('calling_date', item.date);
      
      // Today Asset count (candidate_status = 'Asset')
      const { count: assetCount } = await supabaseServer
        .from('candidates_conversation')
        .select('*', { count: 'exact', head: true })
        .eq('req_id', item.req_id)
        .eq('user_id', item.sent_to_rc)
        .eq('calling_date', item.date)
        .eq('candidate_status', 'Asset');
      
      // Today Conversion count (candidate_status = 'Conversion')
      const { count: conversionCount } = await supabaseServer
        .from('candidates_conversation')
        .select('*', { count: 'exact', head: true })
        .eq('req_id', item.req_id)
        .eq('user_id', item.sent_to_rc)
        .eq('calling_date', item.date)
        .eq('candidate_status', 'Conversion');
      
      // Get unique parsing_ids from tracker rows
      const { data: trackerRows } = await supabaseServer
        .from('candidates_conversation')
        .select('parsing_id')
        .eq('req_id', item.req_id)
        .eq('user_id', item.sent_to_rc)
        .eq('calling_date', item.date)
        .not('parsing_id', 'is', null);
      
      const parsingIds = [...new Set(trackerRows?.map(r => r.parsing_id).filter(Boolean))];
      
      // Get CV counts by portal from cv_parsing table
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
        totalCv: cv_naukri + cv_indeed + cv_other
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

    // Create lookup maps
    const clientsMap = new Map(clientsData?.map(c => [c.client_id, c]) || [])
    const reqsMap = new Map(reqsData?.map(r => [r.req_id, r]) || [])
    const recruitersMap = new Map(recruitersData?.map(r => [r.user_id, r]) || [])

    // Transform data for UI
    const transformedData = workbenchData.map(item => {
      const client = clientsMap.get(item.client_id)
      const req = reqsMap.get(item.req_id)
      const recruiter = recruitersMap.get(item.sent_to_rc)

      return {
        id: item.workbench_id,
        date: item.date,
        client_id: item.client_id,
        client_name: client?.company_name || 'Unknown Client',
        req_id: item.req_id,
        job_title: req?.job_title || 'Unknown Requirement',
        experience: req?.experience || '',
        package: item.package || req?.package || '',
        openings: req?.openings || 0,
        requirement: item.req,
        sent_to_tl: item.sent_to_tl,
        sent_to_rc: item.sent_to_rc,
        recruiter_name: recruiter?.name || '',
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
        // TL remarks
        tl_remarks: item.tl_remarks || '',
        rc_remarks: item.rc_remarks || '',
        advance_sti: item.advance_sti || '',
        // JD details from requirements
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
    console.error('Fetch TL workbench API error:', error)
    return NextResponse.json({
      error: 'Internal server error',
      details: error.message
    }, { status: 500 })
  }
}
