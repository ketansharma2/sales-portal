import { NextResponse } from 'next/server';
import { getUser } from '@/lib/auth-helper';
import { supabaseServer } from '@/lib/supabase-server';

export async function GET(request) {
  try {
    // Authentication - user injected by middleware (no auth calls needed!)
    const { user, error: authError } = getUser(request);
    if (authError || !user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    // Get date range from query params
    const { searchParams } = new URL(request.url);
    const fromDate = searchParams.get('fromDate');
    const toDate = searchParams.get('toDate');

    // Build query for normal (non-startup) leads
    // Count rows where startup = 'no' (case-insensitive) or NULL
    let query = supabaseServer
      .from('corporate_leadgen_leads')
      .select('*')
      .eq('leadgen_id', user.id)
      .or('startup.ilike.no,startup.is.null');

    // If date range is provided, filter by sourcing_date
    if (fromDate && toDate) {
      query = query
        .gte('sourcing_date', fromDate)
        .lte('sourcing_date', toDate);
    }

    const { data: normalLeadsData, error: leadsError } = await query;

    if (leadsError) {
      console.error('Normal leads query error:', leadsError);
      return NextResponse.json({ success: false, error: leadsError.message }, { status: 500 });
    }

    // Count normal (non-startup) leads
    const totalNormalLeads = normalLeadsData?.length || 0;

    return NextResponse.json({
      success: true,
      data: {
        leads: { total: totalNormalLeads }
      }
    });

  } catch (error) {
    console.error('Normal leads count API error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
