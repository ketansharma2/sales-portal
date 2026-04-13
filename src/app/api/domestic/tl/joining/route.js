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

    const { data: convData, error: convError } = await supabaseServer
      .from('candidates_conversation')
      .select('conversation_id')
      .eq('sent_to_tl', currentUserId)
      .not('sent_to_crm', 'is', null);

    if (convError) {
      console.error('Fetch conversation error:', convError);
      return NextResponse.json({ error: 'Failed to fetch conversations', details: convError.message }, { status: 500 })
    }

    const conversationIds = convData?.map(item => item.conversation_id).filter(Boolean) || [];

    if (conversationIds.length === 0) {
      return NextResponse.json({
        success: true,
        data: [],
        count: 0
      })
    }

    const { data: emailData, error: emailError } = await supabaseServer
      .from('domestic_crm_emails')
      .select('id, conversation_id')
      .in('conversation_id', conversationIds);

    if (emailError) {
      console.error('Fetch email error:', emailError);
      return NextResponse.json({ error: 'Failed to fetch emails', details: emailError.message }, { status: 500 })
    }

    const emailIds = emailData?.map(item => item.id).filter(Boolean) || [];

    if (emailIds.length === 0) {
      return NextResponse.json({
        success: true,
        data: [],
        count: 0
      })
    }

    let interviewQuery = supabaseServer
      .from('domestic_crm_interview')
      .select('*')
      .in('email_draft_id', emailIds)
      .eq('interview_status', 'Joining');

    if (fromDate && toDate) {
      interviewQuery = interviewQuery.gte('date', fromDate).lte('date', toDate);
    } else if (fromDate) {
      interviewQuery = interviewQuery.eq('date', fromDate);
    }

    interviewQuery = interviewQuery.order('date', { ascending: false });

    const { data: interviewData, error: interviewError } = await interviewQuery;

    if (interviewError) {
      console.error('Fetch interview error:', interviewError);
      return NextResponse.json({ error: 'Failed to fetch interviews', details: interviewError.message }, { status: 500 })
    }

    if (!interviewData || interviewData.length === 0) {
      return NextResponse.json({
        success: true,
        data: [],
        count: 0
      })
    }

    const reqIds = [...new Set(interviewData.map(item => item.req_id).filter(Boolean))]

    let reqMap = new Map()
    if (reqIds.length > 0) {
      const { data: reqData } = await supabaseServer
        .from('domestic_crm_reqs')
        .select('req_id, job_title, slot')
        .in('req_id', reqIds)
      
      if (reqData) {
        reqMap = new Map(reqData.map(item => [item.req_id, item]))
      }
    }

    const transformedData = interviewData.map((item, idx) => {
      const reqData = reqMap.get(item.req_id)
      return {
        sno: idx + 1,
        conversation_id: item.id,
        date: item.date,
        candidate_name: item.candidate_name || item.candidate_email || '-',
        candidate_email: item.candidate_email || '-',
        candidate_phone: item.candidate_phone || '-',
        profile: reqData?.job_title || '-',
        slot: reqData?.slot || '-',
        interview_status: item.interview_status
      }
    })

    return NextResponse.json({
      success: true,
      data: transformedData,
      count: transformedData.length
    })

  } catch (error) {
    console.error('Joining API error:', error)
    return NextResponse.json({
      error: 'Internal server error',
      details: error.message
    }, { status: 500 })
  }
}