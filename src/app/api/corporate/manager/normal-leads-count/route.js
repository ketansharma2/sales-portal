import { supabaseServer } from '@/lib/supabase-server';
import { NextResponse } from 'next/server';
import { getUser } from '@/lib/auth-helper';

export async function GET(request) {
  try {
    // Authentication - user injected by middleware (no auth calls needed!)
    const { user, error: authError } = getUser(request);
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: userProfile, error: profileError } = await supabaseServer
      .from('users')
      .select('role')
      .eq('user_id', user.id)
      .single()

    if (profileError || !userProfile) {
      return NextResponse.json({ error: 'User profile not found' }, { status: 404 })
    }

    if (!userProfile.role || !userProfile.role.includes('MANAGER')) {
      return NextResponse.json({ error: 'Access denied. Manager role required.' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url);
    const leadgenId = searchParams.get('leadgen_id');
    const fromDate = searchParams.get('fromDate');
    const toDate = searchParams.get('toDate');
    const dateRange = searchParams.get('dateRange') || 'default';

    let leadgenIds = [];
    
    if (leadgenId && leadgenId !== 'All') {
      leadgenIds = [leadgenId];
    } else {
      const { data: leadgenUsers } = await supabaseServer
        .from('users')
        .select('user_id')
        .eq('manager_id', user.id)
        .contains('role', ['LEADGEN']);
      
      leadgenIds = leadgenUsers?.map(u => u.user_id) || [];
    }

    if (leadgenIds.length === 0) {
      return NextResponse.json({ success: true, data: { leads: { total: 0 } } });
    }

    let query = supabaseServer
      .from('corporate_leadgen_leads')
      .select('*')
      .in('leadgen_id', leadgenIds)
      .or('startup.ilike.no,startup.is.null');

    let latestDate = null;

    if (dateRange === 'specific' && fromDate && toDate) {
      query = query
        .gte('sourcing_date', fromDate)
        .lte('sourcing_date', toDate);
    } else if (dateRange === 'default') {
      // First get all unique sourcing dates for the leadgenIds
      const { data: allDatesData } = await supabaseServer
        .from('corporate_leadgen_leads')
        .select('sourcing_date')
        .in('leadgen_id', leadgenIds)
        .not('sourcing_date', 'is', null)
        .order('sourcing_date', { ascending: false })
        .limit(100);

      // Get the most recent non-null date
      const uniqueDates = [...new Set(allDatesData?.map(d => d.sourcing_date).filter(Boolean) || [])];

      if (uniqueDates.length > 0) {
        latestDate = uniqueDates[0];
        query = query.eq('sourcing_date', latestDate);
      } else {
        return NextResponse.json({
          success: true,
          data: {
            leads: { total: 0 },
            latestDate: null
          }
        });
      }
    }

    const { data: normalLeadsData, error: leadsError } = await query;

    if (leadsError) {
      console.error('Normal leads query error:', leadsError);
      return NextResponse.json({ success: false, error: leadsError.message }, { status: 500 });
    }

    const totalNormalLeads = normalLeadsData?.length || 0;

    return NextResponse.json({
      success: true,
      data: {
        leads: { total: totalNormalLeads },
        latestDate: latestDate
      }
    });

  } catch (error) {
    console.error('Normal leads count API error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
