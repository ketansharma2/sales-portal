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

    // Debug logging for troubleshooting
    console.log('Leads achievement - Month:', month, 'Year:', year, 'User:', user.id);

    // Count leads created in the month (filter by leadgen_id and sourcing_date)
    // Use the same approach as the working leads-count API
    const { data: leadsData, error: leadsError } = await supabaseServer
      .from('corporate_leadgen_leads')
      .select('client_id')
      .eq('leadgen_id', user.id)
      .gte('sourcing_date', startDate)
      .lte('sourcing_date', monthEnd);

    console.log('Leads query result:', { dataLength: leadsData?.length, error: leadsError });

    if (leadsError) {
      console.error('Leads query error:', leadsError);
      return NextResponse.json({
        error: 'Failed to count leads',
        details: leadsError.message
      }, { status: 500 });
    }

    const achieved = leadsData ? leadsData.length : 0;
    console.log('Leads achieved:', achieved);

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
    console.error('Leads achievement API error:', error);
    return NextResponse.json({
      error: 'Internal server error',
      details: error.message
    }, { status: 500 });
  }
}