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
      return NextResponse.json(
        { success: false, error: 'No authorization header' },
        { status: 401 }
      );
    }

    const token = authHeader.replace('Bearer ', '');

    const {
      data: { user },
      error: authError
    } = await supabaseServer.auth.getUser(token);

    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Invalid token' },
        { status: 401 }
      );
    }

    // Get manager profile
    const { data: userProfile, error: profileError } = await supabaseServer
      .from('users')
      .select('role')
      .eq('user_id', user.id)
      .single();

    if (profileError || !userProfile) {
      return NextResponse.json(
        { success: false, error: 'User profile not found' },
        { status: 404 }
      );
    }

    // Check manager role
    if (!userProfile.role || !userProfile.role.includes('MANAGER')) {
      return NextResponse.json(
        {
          success: false,
          error: 'Access denied. Manager role required.'
        },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const leadgenId = searchParams.get('leadgen_id') || 'All';

    let leadgenIds = [];

    // Single leadgen
    if (leadgenId !== 'All') {
      leadgenIds = [leadgenId];
    } else {
      // All leadgens under manager
      const { data: leadgenUsers } = await supabaseServer
        .from('users')
        .select('user_id')
        .eq('manager_id', user.id)
        .contains('role', ['LEADGEN']);

      leadgenIds = leadgenUsers?.map((u) => u.user_id) || [];
    }

    if (leadgenIds.length === 0) {
      return NextResponse.json({
        success: true,
        data: {
          projections: {
            mpLess50: 0,
            mpGreater50: 0,
            wpLess50: 0,
            wpGreater50: 0
          }
        }
      });
    }

    console.log('Leadgen IDs:', leadgenIds);

    // OVERALL DATA WITHOUT FILTER
    const { data: leadsData, error: leadsError } = await supabaseServer
      .from('corporate_leadgen_leads')
      .select('projection')
      .in('leadgen_id', leadgenIds);

    if (leadsError) {
      console.error('Projection query error:', leadsError);

      return NextResponse.json(
        { success: false, error: leadsError.message },
        { status: 500 }
      );
    }

    // Count projections
    const projections = {
      mpLess50: 0,
      mpGreater50: 0,
      wpLess50: 0,
      wpGreater50: 0
    };

    leadsData?.forEach((lead) => {
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
        projections
      }
    });

  } catch (error) {
    console.error('Projection count API error:', error);

    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}