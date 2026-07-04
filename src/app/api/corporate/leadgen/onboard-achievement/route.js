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
    console.log('Onboard achievement - Month:', month, 'Year:', year, 'User:', user.id);

    // Count unique onboarded client_ids within the month date range
    const { data: onboardData, error: onboardError } = await supabaseServer
      .from('corporate_leads_interaction')
      .select('client_id')
      .eq('leadgen_id', user.id)
      .ilike('status', 'onboard')
      .gte('date', startDate)
      .lte('date', monthEnd);

    console.log('Onboard interactions:', onboardData?.length || 0);

    if (onboardError) {
      console.error('Onboard fetch error:', onboardError);
      return NextResponse.json({ error: 'Failed to fetch onboard data', details: onboardError.message }, { status: 500 });
    }

    // Count unique client_ids
    const uniqueClients = new Set();
    onboardData?.forEach(interaction => {
      if (interaction.client_id) {
        uniqueClients.add(interaction.client_id);
      }
    });

    const achieved = uniqueClients.size;
    console.log('Unique onboarded clients:', achieved);

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
    console.error('Onboard achievement API error:', error);
    return NextResponse.json({
      error: 'Internal server error',
      details: error.message
    }, { status: 500 });
  }
}