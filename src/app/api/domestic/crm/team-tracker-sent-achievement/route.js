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
    console.log('CRM Team Tracker sent achievement - Month:', month, 'Year:', year, 'Assigned To:', assignedToId);

    // Count tracker sent records that were forwarded to CRM in the month
    const { data: trackerSentData, error: trackerSentError } = await supabaseServer
      .from('candidates_conversation')
      .select('conversation_id')
      .eq('sent_to_tl', assignedToId)  // Key difference: sent_to_tl = assigned_to_id (the team member)
      .gte('sent_date', startDate)
      .lte('sent_date', monthEnd)
      .not('sent_to_crm', 'is', null)
      .gte('crm_sent_date', startDate)
      .lte('crm_sent_date', monthEnd);

    console.log('CRM Team Tracker sent data:', trackerSentData?.length || 0);

    if (trackerSentError) {
      console.error('CRM Team Tracker sent fetch error:', trackerSentError);
      return NextResponse.json({ error: 'Failed to fetch tracker sent data', details: trackerSentError.message }, { status: 500 });
    }

    const achieved = trackerSentData ? trackerSentData.length : 0;
    console.log('CRM Team Tracker sent achieved:', achieved);

    // Return achieved count - percentage will be calculated in frontend
    return NextResponse.json({
      success: true,
      data: {
        achieved,
        target: 0, // Not used in API, calculated in frontend
        percentage: 0, // Not used in API, calculated in frontend
        details: {
          trackerRecords: achieved
        }
      }
    });

  } catch (error) {
    console.error('CRM Team Tracker sent achievement API error:', error);
    return NextResponse.json({
      error: 'Internal server error',
      details: error.message
    }, { status: 500 });
  }
}