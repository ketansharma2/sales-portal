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

    let baseQuery = supabaseServer
      .from('candidates_conversation')
      .select('conversation_id', { count: 'exact' })
      .eq('sent_to_tl', currentUserId);

    if (fromDate && toDate) {
      baseQuery = baseQuery.gte('sent_date', fromDate).lte('sent_date', toDate);
    } else if (fromDate) {
      baseQuery = baseQuery.eq('sent_date', fromDate);
    }

    const { count: totalTrackersReceived, error: totalError } = await baseQuery;

    let rejectedQuery = supabaseServer
      .from('candidates_conversation')
      .select('conversation_id', { count: 'exact' })
      .eq('sent_to_tl', currentUserId)
      .eq('cv_status', 'Rejected');

    if (fromDate && toDate) {
      rejectedQuery = rejectedQuery.gte('sent_date', fromDate).lte('sent_date', toDate);
    } else if (fromDate) {
      rejectedQuery = rejectedQuery.eq('sent_date', fromDate);
    }

    const { count: rejectedCv, error: rejectedError } = await rejectedQuery;

    let sentToCrmQuery = supabaseServer
      .from('candidates_conversation')
      .select('conversation_id', { count: 'exact' })
      .eq('sent_to_tl', currentUserId)
      .not('sent_to_crm', 'is', null);

    if (fromDate && toDate) {
      sentToCrmQuery = sentToCrmQuery.gte('sent_date', fromDate).lte('sent_date', toDate);
    } else if (fromDate) {
      sentToCrmQuery = sentToCrmQuery.eq('sent_date', fromDate);
    }

    const { count: sentToCrm, error: sentToCrmError } = await sentToCrmQuery;

    let notRespondingQuery = supabaseServer
      .from('candidates_conversation')
      .select('conversation_id', { count: 'exact' })
      .eq('sent_to_tl', currentUserId)
      .eq('call_respond', 'No');

    if (fromDate && toDate) {
      notRespondingQuery = notRespondingQuery.gte('sent_date', fromDate).lte('sent_date', toDate);
    } else if (fromDate) {
      notRespondingQuery = notRespondingQuery.eq('sent_date', fromDate);
    }

    const { count: notResponding, error: notRespondingError } = await notRespondingQuery;

    const pipelineCv = (totalTrackersReceived || 0) - (rejectedCv || 0) - (sentToCrm || 0) - (notResponding || 0);

    const { data: convData } = await supabaseServer
      .from('candidates_conversation')
      .select('conversation_id')
      .eq('sent_to_tl', currentUserId)
      .not('sent_to_crm', 'is', null);

    const conversationIds = convData?.map(item => item.conversation_id).filter(Boolean) || [];

    let joining = 0;
    if (conversationIds.length > 0) {
      const { data: emailData } = await supabaseServer
        .from('domestic_crm_emails')
        .select('id')
        .in('conversation_id', conversationIds);

      const emailIds = emailData?.map(item => item.id).filter(Boolean) || [];

      if (emailIds.length > 0) {
        let joiningQuery = supabaseServer
          .from('domestic_crm_interview')
          .select('id', { count: 'exact' })
          .in('email_draft_id', emailIds)
          .eq('interview_status', 'Joining');

        if (fromDate && toDate) {
          joiningQuery = joiningQuery.gte('date', fromDate).lte('date', toDate);
        } else if (fromDate) {
          joiningQuery = joiningQuery.eq('date', fromDate);
        }

        const { count: joiningCount, error: joiningError } = await joiningQuery;
        
        if (!joiningError) {
          joining = joiningCount || 0;
        }
      }
    }

    let jdMatchQuery = supabaseServer
      .from('candidates_conversation')
      .select('conversation_id', { count: 'exact' })
      .eq('sent_to_tl', currentUserId)
      .eq('cv_status', 'JD Match');

    if (fromDate && toDate) {
      jdMatchQuery = jdMatchQuery.gte('sent_date', fromDate).lte('sent_date', toDate);
    } else if (fromDate) {
      jdMatchQuery = jdMatchQuery.eq('sent_date', fromDate);
    }

    const { count: jdMatchCount, error: jdMatchError } = await jdMatchQuery;

    const today = new Date();
    const twoDaysAgo = new Date(today);
    twoDaysAgo.setDate(today.getDate() - 2);
    const twoDaysAgoStr = twoDaysAgo.toISOString().split('T')[0];

    const { count: delayedPipelineCv, error: delayedError } = await supabaseServer
      .from('candidates_conversation')
      .select('conversation_id', { count: 'exact' })
      .eq('sent_to_tl', currentUserId)
      .is('sent_to_crm', null)
      .lt('sent_date', twoDaysAgoStr);

    return NextResponse.json({
      success: true,
      data: {
        trackerSentToCrm: sentToCrm || 0,
        pipelineCv: pipelineCv > 0 ? pipelineCv : 0,
        rejectedCv: rejectedCv || 0,
        notResponding: notResponding || 0,
        joining: joining,
        totalTrackersReceived: totalTrackersReceived || 0,
        jdMatchCount: jdMatchCount || 0,
        delayedPipelineCv: delayedPipelineCv || 0
      }
    })

  } catch (error) {
    console.error('TL metrics API error:', error)
    return NextResponse.json({
      error: 'Internal server error',
      details: error.message
    }, { status: 500 })
  }
}