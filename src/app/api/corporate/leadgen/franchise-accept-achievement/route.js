import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getUser } from "@/lib/auth-helper";
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabaseServer = createClient(supabaseUrl, supabaseKey);

export async function GET(request) {
  try {
    // Get user from token
// Get user from auth-helper (middleware headers)
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
    console.log('Franchise Accept achievement - Month:', month, 'Year:', year, 'User:', user.id);

    // Count franchise accept interactions in the month
    const { data: franchiseData, error: franchiseError } = await supabaseServer
      .from('corporate_leads_interaction')
      .select('id')
      .eq('leadgen_id', user.id)
      .ilike('franchise_status', 'form filled')
      .gte('date', startDate)
      .lte('date', monthEnd);

    console.log('Franchise accept interactions:', franchiseData?.length || 0);

    if (franchiseError) {
      console.error('Franchise accept fetch error:', franchiseError);
      return NextResponse.json({ error: 'Failed to fetch franchise accept data', details: franchiseError.message }, { status: 500 });
    }

    const achieved = franchiseData ? franchiseData.length : 0;
    console.log('Franchise accept achieved:', achieved);

    // Return achieved count - percentage will be calculated in frontend
    const target = 0; // Not used in API, calculated in frontend
    const percentage = 0; // Not used in API, calculated in frontend

    return NextResponse.json({
      success: true,
      data: {
        achieved,
        target,
        percentage,
        month,
        year
      }
    });

  } catch (error) {
    console.error('Franchise Accept achievement API error:', error);
    return NextResponse.json({
      error: 'Internal server error',
      details: error.message
    }, { status: 500 });
  }
}