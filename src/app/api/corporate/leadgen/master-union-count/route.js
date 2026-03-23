import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

export async function GET(request) {
  try {
    // Get user from token
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json({ success: false, error: 'No authorization header' }, { status: 401 });
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return NextResponse.json({ success: false, error: 'Invalid token' }, { status: 401 });
    }

    // Get date range from query params
    const { searchParams } = new URL(request.url);
    const fromDate = searchParams.get('fromDate');
    const toDate = searchParams.get('toDate');

    // Build query for leads from corporate_leadgen_leads table
    let query = supabase
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

    // Count Master Union leads
    const masterUnionLeads = filteredLeadsData?.filter(lead => 
      String(lead.startup).toLowerCase() === 'master union'
    ).length || 0;

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
