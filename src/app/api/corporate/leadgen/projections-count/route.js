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