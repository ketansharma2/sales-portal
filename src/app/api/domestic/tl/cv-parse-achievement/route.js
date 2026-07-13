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
    console.log('TL CV Parse achievement - Month:', month, 'Year:', year, 'Assigned To:', assignedToId);

    // Count CVs parsed in the month (filter by assigned_to_id and portal_date)
    const { data: cvParseData, error: cvParseError } = await supabaseServer
      .from('cv_parsing')
      .select('id')
      .eq('user_id', assignedToId)
      .gte('portal_date', startDate)
      .lte('portal_date', monthEnd);

    console.log('TL CV parse data:', cvParseData?.length || 0);

    if (cvParseError) {
      console.error('CV parse fetch error:', cvParseError);
      return NextResponse.json({ error: 'Failed to fetch CV parse data', details: cvParseError.message }, { status: 500 });
    }

    const achieved = cvParseData ? cvParseData.length : 0;
    console.log('TL CV parse achieved:', achieved);

    // Return achieved count - percentage will be calculated in frontend
    const target = 0; // Not used in API, calculated in frontend
    const percentage = 0; // Not used in API, calculated in frontend

    return NextResponse.json({
      success: true,
      data: {
        achieved,
        target,
        percentage
      }
    });

  } catch (error) {
    console.error('TL CV Parse achievement API error:', error);
    return NextResponse.json({
      error: 'Internal server error',
      details: error.message
    }, { status: 500 });
  }
}