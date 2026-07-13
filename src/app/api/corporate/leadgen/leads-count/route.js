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

    // Build query for leads
    let query = supabaseServer
      .from('corporate_leadgen_leads')
      .select('*')
      .eq('leadgen_id', user.id);

    // If date range is provided, filter by sourcing_date
    if (fromDate && toDate) {
      query = query
        .gte('sourcing_date', fromDate)
        .lte('sourcing_date', toDate);
    }

    const { data: filteredLeadsData, error: leadsError } = await query;

    if (leadsError) {
      console.error('Leads query error:', leadsError);
      return NextResponse.json({ success: false, error: leadsError.message }, { status: 500 });
    }

    // Count total leads
    const totalLeads = filteredLeadsData?.length || 0;
    
    // Count startup leads (handle both boolean true and string "YES"/"yes")
    const startupLeads = filteredLeadsData?.filter(lead => 
      lead.startup === true || 
      String(lead.startup).toLowerCase() === 'yes' ||
      String(lead.startup) === '1' ||
      String(lead.startup).toLowerCase() === 'true'
    ).length || 0;

    return NextResponse.json({
      success: true,
      data: {
        searched: { total: totalLeads, startup: startupLeads }
      }
    });

  } catch (error) {
    console.error('Leads count API error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}