import { supabaseServer } from '@/lib/supabase-server';
import { NextResponse } from 'next/server';

export async function GET(request) {
  try {
    const authHeader = request.headers.get('authorization')
    if (!authHeader) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authError } = await supabaseServer.auth.getUser(token)
    if (authError || !user) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
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
      const { data: latestData } = await supabaseServer
        .from('corporate_leadgen_leads')
        .select('sourcing_date')
        .in('leadgen_id', leadgenIds)
        .order('sourcing_date', { ascending: false })
        .limit(1)
        .single();

      if (latestData && latestData.sourcing_date) {
        latestDate = latestData.sourcing_date;
        query = query.eq('sourcing_date', latestData.sourcing_date);
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
