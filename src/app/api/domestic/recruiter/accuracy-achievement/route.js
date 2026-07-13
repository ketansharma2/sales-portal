import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getUser } from "@/lib/auth-helper";
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabaseServer = createClient(supabaseUrl, supabaseKey);

export async function GET(request) {
  try {
    // Get user from token
const { user, error: authError } = getUser(request);

if (authError || !user) {
  console.log('[API] Auth error:', authError);
  return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
}

    const { searchParams } = new URL(request.url);
    const month = searchParams.get('month');
    const year = searchParams.get('year');

    if (!month || !year) {
      return NextResponse.json({ error: 'Month and year parameters required' }, { status: 400 });
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
    console.log('Accuracy achievement - Month:', month, 'Year:', year, 'User:', user.id);

    // Get total tracker sent count
    const { data: trackerSentData, error: trackerSentError } = await supabaseServer
      .from('candidates_conversation')
      .select('conversation_id')
      .eq('user_id', user.id)
      .not('sent_to_tl', 'is', null)
      .gte('sent_date', startDate)
      .lte('sent_date', monthEnd);

    if (trackerSentError) {
      console.error('Tracker sent fetch error:', trackerSentError);
      return NextResponse.json({ error: 'Failed to fetch tracker sent data', details: trackerSentError.message }, { status: 500 });
    }

    const totalTrackerSent = trackerSentData ? trackerSentData.length : 0;

    // Get CV match count (where cv_status = 'JD Match')
    const { data: cvMatchData, error: cvMatchError } = await supabaseServer
      .from('candidates_conversation')
      .select('conversation_id')
      .eq('user_id', user.id)
      .eq('cv_status', 'JD Match')
      .gte('sent_date', startDate)
      .lte('sent_date', monthEnd);

    if (cvMatchError) {
      console.error('CV match fetch error:', cvMatchError);
      return NextResponse.json({ error: 'Failed to fetch CV match data', details: cvMatchError.message }, { status: 500 });
    }

    const cvMatches = cvMatchData ? cvMatchData.length : 0;

    // Calculate accuracy percentage: (CV Match / Total Tracker Sent) * 100
    const accuracy = totalTrackerSent > 0 ? Math.round((cvMatches / totalTrackerSent) * 100) : 0;

    console.log('Total tracker sent:', totalTrackerSent);
    console.log('CV matches:', cvMatches);
    console.log('Accuracy percentage:', accuracy);

    // Return accuracy percentage as achieved value
    return NextResponse.json({
      success: true,
      data: {
        achieved: accuracy,
        target: 0, // Not used in API, calculated in frontend
        percentage: 0, // Not used in API, calculated in frontend
        details: {
          totalTrackerSent,
          cvMatches
        }
      }
    });

  } catch (error) {
    console.error('Accuracy achievement API error:', error);
    return NextResponse.json({
      error: 'Internal server error',
      details: error.message
    }, { status: 500 });
  }
}