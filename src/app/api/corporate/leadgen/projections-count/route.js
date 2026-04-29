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

    // Build query for leads with projection data (no date filtering)
    const query = supabaseServer
      .from('corporate_leadgen_leads')
      .select('projection')
      .eq('leadgen_id', user.id);

    const { data: leadsData, error: leadsError } = await query;

    if (leadsError) {
      console.error('Leads projection query error:', leadsError);
      return NextResponse.json({ success: false, error: leadsError.message }, { status: 500 });
    }

    // Count projections
    const projections = {
      mpLess50: 0,
      mpGreater50: 0,
      wpLess50: 0,
      wpGreater50: 0
    };

    leadsData?.forEach(lead => {
      const projection = lead.projection;
      if (projection === 'MP < 50') {
        projections.mpLess50++;
      } else if (projection === 'MP > 50') {
        projections.mpGreater50++;
      } else if (projection === 'WP < 50') {
        projections.wpLess50++;
      } else if (projection === 'WP > 50') {
        projections.wpGreater50++;
      }
    });

    return NextResponse.json({
      success: true,
      data: {
        projections: projections
      }
    });

  } catch (error) {
    console.error('Projection count API error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}