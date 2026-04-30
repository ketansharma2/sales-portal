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
    console.log('My Targets CV Parse achievement - Month:', month, 'Year:', year, 'User ID:', currentUserId);

    // Count CV parsing records for users under this TL
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

    // Step 2: Count CV parsing records for these users within the date range
    const { data: cvParseData, error: cvParseError } = await supabaseServer
      .from('cv_parsing')
      .select('id')
      .in('user_id', teamUserIds)
      .gte('created_at', startDate)
      .lte('created_at', monthEnd);

    if (cvParseError) {
      console.error('CV parse data fetch error:', cvParseError);
      return NextResponse.json({ error: 'Failed to fetch CV parse data', details: cvParseError.message }, { status: 500 });
    }

    const achieved = cvParseData ? cvParseData.length : 0;
    console.log('My Targets CV Parse achieved:', achieved);
    console.log('CV Parse details - Team users:', teamUserIds.length, 'CV parses:', achieved);

    // Return achieved count - percentage will be calculated in frontend
    return NextResponse.json({
      success: true,
      data: {
        achieved,
        target: 0, // Not used in API, calculated in frontend
        percentage: 0, // Not used in API, calculated in frontend
        details: {
          teamUsers: teamUserIds.length,
          cvParses: achieved
        }
      }
    });

  } catch (error) {
    console.error('My Targets CV Parse achievement API error:', error);
    return NextResponse.json({
      error: 'Internal server error',
      details: error.message
    }, { status: 500 });
  }
}