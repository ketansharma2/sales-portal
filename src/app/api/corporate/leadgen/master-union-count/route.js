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
    const dateRange = searchParams.get('dateRange') || 'default'; // default, all, specific

    // Build query for leads from corporate_leadgen_leads table
    let query = supabaseServer
      .from('corporate_leadgen_leads')
      .select('*')
      .eq('leadgen_id', user.id);

    // Add startup filter for Master Union
    query = query.eq('startup', 'Master Union');

    // Apply date filtering based on dateRange type
    if (dateRange === 'specific' && fromDate && toDate) {
      query = query
        .gte('sourcing_date', fromDate)
        .lte('sourcing_date', toDate);
    } else if (dateRange === 'default') {
      // Get the latest interaction date for this user
      const { data: latestData } = await supabaseServer
        .from('corporate_leads_interaction')
        .select('date')
        .eq('leadgen_id', user.id)
        .order('date', { ascending: false })
        .limit(1)
        .single();

      if (latestData && latestData.date) {
        const latestDate = latestData.date;
        query = query.eq('sourcing_date', latestDate);
      }
    }
    // If dateRange === 'all', no date filter is applied

    const { data: leadsData, error: leadsError } = await query;

    if (leadsError) {
      console.error('Leads query error:', leadsError);
      return NextResponse.json({ success: false, error: leadsError.message }, { status: 500 });
    }

    const masterUnionLeads = (leadsData || []).length || 0;

    return NextResponse.json({
      success: true,
      data: {
        masterUnion: { total: masterUnionLeads }
      }
    });

  } catch (error) {
    console.error('Master Union count API error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
