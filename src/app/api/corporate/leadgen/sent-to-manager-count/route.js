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

    // Get date range from query params
    const { searchParams } = new URL(request.url);
    const fromDate = searchParams.get('fromDate');
    const toDate = searchParams.get('toDate');

    // Build query for leads where sent_to_sm is true
    let query = supabaseServer
      .from('corporate_leadgen_leads')
      .select('startup, sent_to_sm, lock_date')
      .eq('leadgen_id', user.id)
      .eq('sent_to_sm', true);

    // If date range is provided, filter by lock_date
    if (fromDate && toDate) {
      query = query
        .gte('lock_date', fromDate)
        .lte('lock_date', toDate);
    }

    const { data: leadsData, error: leadsError } = await query;

    if (leadsError) {
      console.error('Leads fetch error:', leadsError);
      return NextResponse.json({ success: false, error: leadsError.message }, { status: 500 });
    }

    // Count total and startups
    const totalSentToManager = leadsData?.length || 0;
    const startupSentToManager = leadsData?.filter(lead =>
      lead.startup === true ||
      String(lead.startup).toLowerCase() === 'yes' ||
      String(lead.startup) === '1' ||
      String(lead.startup).toLowerCase() === 'true'
    ).length || 0;

    return NextResponse.json({
      success: true,
      data: {
        sentToManager: { total: totalSentToManager, startup: startupSentToManager }
      }
    });

  } catch (error) {
    console.error('Sent to manager count API error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
