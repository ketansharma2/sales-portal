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

    // Build query for interactions from Master Union clients
    let query = supabase
      .from('corporate_leads_interaction')
      .select('*, corporate_leadgen_leads!inner(startup)')
      .eq('leadgen_id', user.id);

    // Add date filtering if provided
    if (fromDate && toDate) {
      query = query
        .gte('date', fromDate)
        .lte('date', toDate);
    }

    const { data: interactionsData, error: interactionsError } = await query;

    if (interactionsError) {
      console.error('Interactions fetch error:', interactionsError);
      return NextResponse.json({ success: false, error: interactionsError.message }, { status: 500 });
    }

    // Count Master Union interactions
    const masterUnionInteractions = interactionsData?.filter(i => 
      String(i.corporate_leadgen_leads?.startup).toLowerCase() === 'master union'
    ).length || 0;

    return NextResponse.json({
      success: true,
      data: {
        masterUnion: { calling: masterUnionInteractions }
      }
    });

  } catch (error) {
    console.error('Master Union Calling API error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
