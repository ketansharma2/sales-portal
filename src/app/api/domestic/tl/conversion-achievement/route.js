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
    console.log('TL Conversion achievement - Month:', month, 'Year:', year, 'Assigned To:', assignedToId);

    // Count conversion records in the month
    const { data: conversionData, error: conversionError } = await supabaseServer
      .from('candidates_conversation')
      .select('conversation_id')
      .eq('user_id', assignedToId)
      .eq('candidate_status', 'Conversion')
      .gte('calling_date', startDate)
      .lte('calling_date', monthEnd);

    console.log('TL Conversion data:', conversionData?.length || 0);

    if (conversionError) {
      console.error('Conversion fetch error:', conversionError);
      return NextResponse.json({ error: 'Failed to fetch conversion data', details: conversionError.message }, { status: 500 });
    }

    const achieved = conversionData ? conversionData.length : 0;
    console.log('TL Conversion achieved:', achieved);

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
    console.error('TL Conversion achievement API error:', error);
    return NextResponse.json({
      error: 'Internal server error',
      details: error.message
    }, { status: 500 });
  }
}