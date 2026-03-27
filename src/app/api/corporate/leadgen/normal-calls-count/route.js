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
    const dateRange = searchParams.get('dateRange') || 'default'; // default, all, specific

    // Build query for normal (non-startup) client interactions
    // Join with corporate_leadgen_leads to check startup column
    let query = supabaseServer
      .from('corporate_leads_interaction')
      .select(`
        id,
        corporate_leadgen_leads(
          startup
        )
      `)
      .eq('leadgen_id', user.id);

    // Apply date filtering based on dateRange type
    if (dateRange === 'specific' && fromDate && toDate) {
      query = query
        .gte('date', fromDate)
        .lte('date', toDate);
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
        query = query.eq('date', latestDate);
      }
    }
    // If dateRange === 'all', no date filter is applied

    const { data: interactionsData, error: interactionsError } = await query;

    if (interactionsError) {
      console.error('Normal calls query error:', interactionsError);
      return NextResponse.json({ success: false, error: interactionsError.message }, { status: 500 });
    }

    // Filter to keep only interactions where startup is 'no' (case-insensitive only, NOT NULL)
    const normalCalls = (interactionsData || []).filter(interaction => {
      const startup = interaction.corporate_leadgen_leads?.startup;
      const startupStr = String(startup || '').toLowerCase().trim();
      return startupStr === 'no';
    });

    const totalNormalCalls = normalCalls.length;

    return NextResponse.json({
      success: true,
      data: {
        calls: { total: totalNormalCalls }
      }
    });

  } catch (error) {
    console.error('Normal calls count API error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
