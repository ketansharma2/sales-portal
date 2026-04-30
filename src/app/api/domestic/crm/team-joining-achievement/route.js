import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabaseServer = createClient(supabaseUrl, supabaseKey);

export async function GET(request) {
  try {
    // Get user from token
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json({ success: false, error: 'No authorization header' }, { status: 401 });
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabaseServer.auth.getUser(token);

    if (authError || !user) {
      return NextResponse.json({ success: false, error: 'Invalid token' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const month = searchParams.get('month');
    const year = searchParams.get('year');
    const assignedToId = searchParams.get('assigned_to_id');

    if (!month || !year || !assignedToId) {
      return NextResponse.json({ error: 'Month, year, and assigned_to_id parameters required' }, { status: 400 });
    }

    // Calculate month date range
    const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
    const monthIndex = monthNames.indexOf(month);
    if (monthIndex === -1) {
      return NextResponse.json({ error: 'Invalid month' }, { status: 400 });
    }

    const startDate = `${year}-${String(monthIndex + 1).padStart(2, '0')}-01`;
    const monthEnd = `${year}-${String(monthIndex + 1).padStart(2, '0')}-${new Date(parseInt(year), monthIndex + 1, 0).getDate()}`;

    // Debug logging for troubleshooting
    console.log('CRM Team Joining achievement - Month:', month, 'Year:', year, 'Assigned To:', assignedToId);

    // Count joining records that originated from trackers sent to this team member
    // Step 1: Get conversation_ids that meet tracker sent criteria
    const { data: trackerData, error: trackerError } = await supabaseServer
      .from('candidates_conversation')
      .select('conversation_id')
      .eq('sent_to_tl', assignedToId)  // Key difference: sent_to_tl = assigned_to_id
      .gte('sent_date', startDate)
      .lte('sent_date', monthEnd)
      .not('sent_to_crm', 'is', null)
      .gte('crm_sent_date', startDate)
      .lte('crm_sent_date', monthEnd);

    if (trackerError) {
      console.error('Tracker data fetch error:', trackerError);
      return NextResponse.json({ error: 'Failed to fetch tracker data', details: trackerError.message }, { status: 500 });
    }

    if (!trackerData || trackerData.length === 0) {
      console.log('No tracker data found');
      return NextResponse.json({
        success: true,
        data: { achieved: 0, target: 0, percentage: 0 }
      });
    }

    const conversationIds = trackerData.map(t => t.conversation_id);
    console.log('Conversation IDs that meet tracker criteria:', conversationIds.length);

    // Step 2: Get email draft IDs from domestic_crm_emails
    const { data: emailData, error: emailError } = await supabaseServer
      .from('domestic_crm_emails')
      .select('id')
      .in('conversation_id', conversationIds);

    if (emailError) {
      console.error('Email data fetch error:', emailError);
      return NextResponse.json({ error: 'Failed to fetch email data', details: emailError.message }, { status: 500 });
    }

    const emailDraftIds = emailData?.map(item => item.id) || [];
    console.log('Email draft IDs found:', emailDraftIds.length);

    if (emailDraftIds.length === 0) {
      return NextResponse.json({
        success: true,
        data: { achieved: 0, target: 0, percentage: 0 }
      });
    }

    // Step 3: Count interviews with status 'Joining' and date in range
    const { data: joiningData, error: joiningError } = await supabaseServer
      .from('domestic_crm_interview')
      .select('id')
      .in('email_draft_id', emailDraftIds)
      .eq('interview_status', 'Joining')
      .gte('date', startDate)
      .lte('date', monthEnd);

    if (joiningError) {
      console.error('CRM Team Joining fetch error:', joiningError);
      return NextResponse.json({ error: 'Failed to fetch joining data', details: joiningError.message }, { status: 500 });
    }

    const achieved = joiningData ? joiningData.length : 0;
    console.log('CRM Team Joining achieved:', achieved);
    console.log('Joining details - Tracker sent:', conversationIds.length, 'Email drafts:', emailDraftIds.length, 'Successful joins:', achieved);

    // Return achieved count - percentage will be calculated in frontend
    return NextResponse.json({
      success: true,
      data: {
        achieved,
        target: 0, // Not used in API, calculated in frontend
        percentage: 0, // Not used in API, calculated in frontend
        details: {
          trackerSent: conversationIds.length,
          emailDrafts: emailDraftIds.length,
          successfulJoins: achieved
        }
      }
    });

  } catch (error) {
    console.error('CRM Team Joining achievement API error:', error);
    return NextResponse.json({
      error: 'Internal server error',
      details: error.message
    }, { status: 500 });
  }
}