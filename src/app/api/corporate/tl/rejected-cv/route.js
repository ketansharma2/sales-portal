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

    const { searchParams } = new URL(request.url);
    const fromDate = searchParams.get('fromDate');
    const toDate = searchParams.get('toDate');

    // Step 1: Get rejected CVs
    let query = supabaseServer
      .from('candidates_conversation')
      .select('conversation_id, user_id, req_id, sent_date, cv_status, call_respond, remarks, tl_remarks, parsing_id')
      .eq('sent_to_tl', currentUserId)
      .eq('cv_status', 'Rejected');

    if (fromDate && toDate) {
      query = query.gte('sent_date', fromDate).lte('sent_date', toDate);
    } else if (fromDate) {
      query = query.eq('sent_date', fromDate);
    }

    query = query.order('sent_date', { ascending: false });

    const { data, error } = await query;

    if (error) {
      console.error('Fetch rejected CV error:', error);
      return NextResponse.json({ error: 'Failed to fetch rejected CVs', details: error.message }, { status: 500 })
    }

    if (!data || data.length === 0) {
      return NextResponse.json({ success: true, data: [], count: 0 })
    }

    // Get unique parsing_ids, user_ids, req_ids for joining
    const parsingIds = [...new Set(data.map(item => item.parsing_id).filter(Boolean))]
    const rcUserIds = [...new Set(data.map(item => item.user_id).filter(Boolean))]
    const reqIds = [...new Set(data.map(item => item.req_id).filter(Boolean))]

    // Step 2: Fetch cv_parsing data
    let cvParsingMap = new Map()
    if (parsingIds.length > 0) {
      const { data: cvData } = await supabaseServer
        .from('cv_parsing')
        .select('id, name, email, mobile, location, qualification, experience, cv_url, redacted_cv_url')
        .in('id', parsingIds)
      
      if (cvData) {
        cvParsingMap = new Map(cvData.map(item => [item.id, item]))
      }
    }

    // Step 3: Fetch RC user names
    let rcUserMap = new Map()
    if (rcUserIds.length > 0) {
      const { data: rcUserData } = await supabaseServer
        .from('users')
        .select('user_id, name')
        .in('user_id', rcUserIds)
      
      if (rcUserData) {
        rcUserMap = new Map(rcUserData.map(item => [item.user_id, item.name]))
      }
    }

    // Step 4: Fetch requirement details
    let reqMap = new Map()
    if (reqIds.length > 0) {
      const { data: reqData } = await supabaseServer
        .from('corporate_crm_reqs')
        .select('req_id, job_title, slot')
        .in('req_id', reqIds)
      
      if (reqData) {
        reqMap = new Map(reqData.map(item => [item.req_id, item]))
      }
    }

    // Transform data
    const transformedData = data.map((item, idx) => {
      const cvData = cvParsingMap.get(item.parsing_id)
      const reqData = reqMap.get(item.req_id)
      return {
        sno: idx + 1,
        conversation_id: item.conversation_id,
        sent_date: item.sent_date,
        candidate_name: cvData?.name || '-',
        candidate_email: cvData?.email || '-',
        candidate_phone: cvData?.mobile || '-',
        candidate_location: cvData?.location || '-',
        qualification: cvData?.qualification || '-',
        experience: cvData?.experience || '-',
        cv_url: cvData?.cv_url || null,
        redacted_cv_url: cvData?.redacted_cv_url || null,
        profile: reqData?.job_title || '-',
        slot: reqData?.slot || '-',
        rc_name: rcUserMap.get(item.user_id) || '-',
        call_respond: item.call_respond || '-',
        remarks: item.remarks || '-',
        tl_remarks: item.tl_remarks || '-'
      }
    })

    return NextResponse.json({
      success: true,
      data: transformedData,
      count: transformedData.length
    })

  } catch (error) {
    console.error('Rejected CV API error:', error)
    return NextResponse.json({
      error: 'Internal server error',
      details: error.message
    }, { status: 500 })
  }
}
