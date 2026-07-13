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

    const currentUserId = user.user_id || user.id;

    // Debug logging for troubleshooting
    console.log('My Targets Conversion achievement - Month:', month, 'Year:', year, 'User ID:', currentUserId);

    // Count conversion records for users under this TL
    // Step 1: Get user_ids of users who report to this TL
    const { data: teamUsers, error: teamUsersError } = await supabaseServer
      .from('users')
      .select('user_id')
      .eq('tl_id', currentUserId);

    if (teamUsersError) {
      console.error('Team users fetch error:', teamUsersError);
      return NextResponse.json({ error: 'Failed to fetch team users', details: teamUsersError.message }, { status: 500 });
    }

    const teamUserIds = teamUsers?.map(u => u.user_id) || [];
    console.log('Team user IDs under this TL:', teamUserIds.length);

    if (teamUserIds.length === 0) {
      return NextResponse.json({
        success: true,
        data: { achieved: 0, target: 0, percentage: 0 }
      });
    }

    // Step 2: Get unique parsing_ids from candidates_conversation for these users with Conversion status within the date range
    const { data: conversionData, error: conversionError } = await supabaseServer
      .from('candidates_conversation')
      .select('parsing_id')
      .in('user_id', teamUserIds)
      .eq('candidate_status', 'Conversion')
      .gte('created_at', startDate)
      .lte('created_at', monthEnd);

    if (conversionError) {
      console.error('Conversion data fetch error:', conversionError);
      return NextResponse.json({ error: 'Failed to fetch conversion data', details: conversionError.message }, { status: 500 });
    }

    // Count unique parsing_ids
    const uniqueParsingIds = [...new Set(conversionData?.map(item => item.parsing_id) || [])];
    const achieved = uniqueParsingIds.length;

    console.log('My Targets Conversion achieved:', achieved);
    console.log('Conversion details - Team users:', teamUserIds.length, 'Conversion records:', conversionData?.length || 0, 'Unique parsing IDs:', achieved);

    // Return achieved count - percentage will be calculated in frontend
    return NextResponse.json({
      success: true,
      data: {
        achieved,
        target: 0, // Not used in API, calculated in frontend
        percentage: 0, // Not used in API, calculated in frontend
        details: {
          teamUsers: teamUserIds.length,
          conversionRecords: conversionData?.length || 0,
          uniqueConversions: achieved
        }
      }
    });

  } catch (error) {
    console.error('My Targets Conversion achievement API error:', error);
    return NextResponse.json({
      error: 'Internal server error',
      details: error.message
    }, { status: 500 });
  }
}