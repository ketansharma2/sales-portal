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

    // Build base query
    let baseQuery = supabaseServer
      .from('candidates_conversation')
      .select('conversation_id', { count: 'exact' })
      .eq('sent_to_tl', currentUserId);

    if (fromDate && toDate) {
      baseQuery = baseQuery.gte('sent_date', fromDate).lte('sent_date', toDate);
    } else if (fromDate) {
      baseQuery = baseQuery.eq('sent_date', fromDate);
    }

    // 1. Total trackers received
    const { count: totalTrackersReceived, error: totalError } = await baseQuery;

    if (totalError) {
      console.error('Fetch total trackers error:', totalError);
    }

    // 2. Rejected CV: cv_status = 'Rejected'
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

    if (rejectedError) {
      console.error('Fetch rejected error:', rejectedError);
    }

    // 3. Sent to CRM: sent_to_crm is not null
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

    if (sentToCrmError) {
      console.error('Fetch sent to CRM error:', sentToCrmError);
    }

    // 4. Not responding: call_respond = 'No'
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

    if (notRespondingError) {
      console.error('Fetch not responding error:', notRespondingError);
    }

    // 5. Pipeline CV = Total - Rejected - Sent to CRM - Not responding
    const pipelineCv = (totalTrackersReceived || 0) - (rejectedCv || 0) - (sentToCrm || 0) - (notResponding || 0);

    // 6. Joining: Get from corporate_crm_interview (same logic as joining route)
    // First get conversation_ids sent to CRM by this TL
    const { data: convData } = await supabaseServer
      .from('candidates_conversation')
      .select('conversation_id')
      .eq('sent_to_tl', currentUserId)
      .not('sent_to_crm', 'is', null);

    const conversationIds = convData?.map(item => item.conversation_id).filter(Boolean) || [];

    let joining = 0;
    if (conversationIds.length > 0) {
      // Get email ids from corporate_crm_emails
      const { data: emailData } = await supabaseServer
        .from('corporate_crm_emails')
        .select('id')
        .in('conversation_id', conversationIds);

      const emailIds = emailData?.map(item => item.id).filter(Boolean) || [];

      if (emailIds.length > 0) {
        // Get joining count from corporate_crm_interview
        let joiningQuery = supabaseServer
          .from('corporate_crm_interview')
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

    // 7. JD Match: cv_status = 'JD Match'
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

    if (jdMatchError) {
      console.error('Fetch JD match error:', jdMatchError);
    }

    return NextResponse.json({
      success: true,
      data: {
        trackerSentToCrm: sentToCrm || 0,
        pipelineCv: pipelineCv > 0 ? pipelineCv : 0,
        rejectedCv: rejectedCv || 0,
        notResponding: notResponding || 0,
        joining: joining,
        totalTrackersReceived: totalTrackersReceived || 0,
        jdMatchCount: jdMatchCount || 0
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
