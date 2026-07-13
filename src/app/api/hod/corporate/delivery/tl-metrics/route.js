import { supabaseServer } from '@/lib/supabase-server';
import { NextResponse } from 'next/server';
import { getUser } from '@/lib/auth-helper';

export async function GET(request) {
  try {
      const { user, error: authError } = getUser(request);
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // ✅ Get parameters from frontend
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('tl_id');  // TL user_id from frontend
    const fromDate = searchParams.get('from');
    const toDate = searchParams.get('to');
    
    // ✅ Use passed user_id or fallback to authenticated user
    const targetUserId = userId

    // Build base query with date filters
    let baseQuery = supabaseServer
      .from('candidates_conversation')
      .select('conversation_id', { count: 'exact' });
    console.log('Building query for TL metrics with user_id:', targetUserId, 'fromDate:', fromDate, 'toDate:', toDate); 
    // ✅ Only add sent_to_tl filter if userId is provided
    if (userId) {
      baseQuery = baseQuery.eq('sent_to_tl', userId);
    }

    // Apply date filters
    if (fromDate && toDate) {
      baseQuery = baseQuery.gte('sent_date', fromDate).lte('sent_date', toDate);
    } else if (fromDate) {
      baseQuery = baseQuery.gte('sent_date', fromDate);
    } else if (toDate) {
      baseQuery = baseQuery.lte('sent_date', toDate);
    }

    // 1. Total trackers received
    const { count: totalTrackersReceived, error: totalError } = await baseQuery;

    // 2. Rejected CV
    let rejectedQuery = supabaseServer
      .from('candidates_conversation')
      .select('conversation_id', { count: 'exact' })   
      .eq('cv_status', 'Rejected');

     if (userId) {
      rejectedQuery = rejectedQuery.eq('sent_to_tl', userId);
    }
    if (fromDate && toDate) {
      rejectedQuery = rejectedQuery.gte('sent_date', fromDate).lte('sent_date', toDate);
    } else if (fromDate) {
      rejectedQuery = rejectedQuery.gte('sent_date', fromDate);
    } else if (toDate) {
      rejectedQuery = rejectedQuery.lte('sent_date', toDate);
    }
    const { count: rejectedCv } = await rejectedQuery;

    // 3. Sent to CRM
    let sentToCrmQuery = supabaseServer
      .from('candidates_conversation')
      .select('conversation_id', { count: 'exact' })
      .not('sent_to_crm', 'is', null);

      if (userId) {
        sentToCrmQuery = sentToCrmQuery.eq('sent_to_tl', userId);
      }

    if (fromDate && toDate) {
      sentToCrmQuery = sentToCrmQuery.gte('sent_date', fromDate).lte('sent_date', toDate);
    } else if (fromDate) {
      sentToCrmQuery = sentToCrmQuery.gte('sent_date', fromDate);
    } else if (toDate) {
      sentToCrmQuery = sentToCrmQuery.lte('sent_date', toDate);
    }
    const { count: sentToCrm } = await sentToCrmQuery;

    // 4. Not responding
    let notRespondingQuery = supabaseServer
      .from('candidates_conversation')
      .select('conversation_id', { count: 'exact' })
  
      .eq('call_respond', 'No');

        if (userId) {
      notRespondingQuery = notRespondingQuery.eq('sent_to_tl', userId);
    }

    if (fromDate && toDate) {
      notRespondingQuery = notRespondingQuery.gte('sent_date', fromDate).lte('sent_date', toDate);
    } else if (fromDate) {
      notRespondingQuery = notRespondingQuery.gte('sent_date', fromDate);
    } else if (toDate) {
      notRespondingQuery = notRespondingQuery.lte('sent_date', toDate);
    }
    const { count: notResponding } = await notRespondingQuery;

    // 5. Pipeline CV
    const pipelineCv = (totalTrackersReceived || 0) - (rejectedCv || 0) - (sentToCrm || 0) - (notResponding || 0);

    // 6. Joining count
  let convQuery = supabaseServer
  .from('candidates_conversation')
  .select('conversation_id')
  .not('sent_to_crm', 'is', null);

if (userId) {
  convQuery = convQuery.eq('sent_to_tl', userId);
}

const { data: convData } = await convQuery;

    const conversationIds = convData?.map(item => item.conversation_id).filter(Boolean) || [];
    
    let joining = 0;
    if (conversationIds.length > 0) {
      let emailQuery = supabaseServer
        .from('corporate_crm_emails')
        .select('id')
        .in('conversation_id', conversationIds);
      
      const { data: emailData } = await emailQuery;
      const emailIds = emailData?.map(item => item.id).filter(Boolean) || [];

      if (emailIds.length > 0) {
        let joiningQuery = supabaseServer
          .from('corporate_crm_interview')
          .select('id', { count: 'exact' })
          .in('email_draft_id', emailIds)
          .eq('interview_status', 'Joining');

        if (fromDate && toDate) {
          joiningQuery = joiningQuery.gte('date', fromDate).lte('date', toDate);
        } else if (fromDate) {
          joiningQuery = joiningQuery.gte('date', fromDate);
        } else if (toDate) {
          joiningQuery = joiningQuery.lte('date', toDate);
        }
        
        const { count: joiningCount } = await joiningQuery;
        joining = joiningCount || 0;
      }
    }

    // 7. JD Match
    let jdMatchQuery = supabaseServer
      .from('candidates_conversation')
      .select('conversation_id', { count: 'exact' })
      .eq('cv_status', 'JD Match');
  if (userId) {
      jdMatchQuery = jdMatchQuery.eq('sent_to_tl', userId);
    }
    if (fromDate && toDate) {
      jdMatchQuery = jdMatchQuery.gte('sent_date', fromDate).lte('sent_date', toDate);
    } else if (fromDate) {
      jdMatchQuery = jdMatchQuery.gte('sent_date', fromDate);
    } else if (toDate) {
      jdMatchQuery = jdMatchQuery.lte('sent_date', toDate);
    }
    const { count: jdMatchCount } = await jdMatchQuery;

    // 8. Delayed Pipeline CV (no date filter - always check last 2 days)
    const today = new Date();
    const twoDaysAgo = new Date(today);
    twoDaysAgo.setDate(today.getDate() - 2);
    const twoDaysAgoStr = twoDaysAgo.toISOString().split('T')[0];

    let delayedQuery = supabaseServer
  .from('candidates_conversation')
  .select('conversation_id', { count: 'exact' })   
  .is('sent_to_crm', null)
  .lt('sent_date', twoDaysAgoStr);

// ✅ Only add user filter if userId exists
if (userId) {
  delayedQuery = delayedQuery.eq('sent_to_tl', userId);
}

const { count: delayedPipelineCv } = await delayedQuery;

    // ✅ Calculate accuracy (if total > 0)
    const totalProcessed = (sentToCrm || 0) + (rejectedCv || 0);
    const tlAccuracy = totalProcessed > 0 
      ? ((sentToCrm || 0) / totalProcessed * 100).toFixed(1)
      : "0.0";

    return NextResponse.json({
      success: true,
      data: {
        trackerToCrm: sentToCrm || 0,
        tlPipelineCv: pipelineCv > 0 ? pipelineCv : 0,
        rejectedCv: rejectedCv || 0,
        joining: joining,
        delayedCv: delayedPipelineCv || 0,
        tlAccuracy: tlAccuracy,
        totalTrackersReceived: totalTrackersReceived || 0,
        jdMatchCount: jdMatchCount || 0
      }
    })

  } catch (error) {
    console.error('TL metrics API error:', error)
    return NextResponse.json({
      success: false,
      error: 'Internal server error',
      details: error.message
    }, { status: 500 })
  }
}