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
      return NextResponse.json({ success: true, data: { calls: { total: 0 } } });
    }

    let query = supabaseServer
      .from('corporate_leads_interaction')
      .select(`
        id,
        corporate_leadgen_leads(
          startup
        )
      `)
      .in('leadgen_id', leadgenIds);

    let latestDate = null;

    console.log('Normal calls - dateRange:', dateRange, 'fromDate:', fromDate, 'toDate:', toDate);

    if (dateRange === 'specific' && fromDate && toDate) {
      query = query
        .gte('date', fromDate)
        .lte('date', toDate);
    } else if (dateRange === 'default') {
      // First get all unique dates for the leadgenIds
      const { data: allDatesData } = await supabaseServer
        .from('corporate_leads_interaction')
        .select('date')
        .in('leadgen_id', leadgenIds)
        .not('date', 'is', null)
        .order('date', { ascending: false })
        .limit(100);

      console.log('Normal calls - All dates found:', allDatesData);

      // Get the most recent non-null date
      const uniqueDates = [...new Set(allDatesData?.map(d => d.date).filter(Boolean) || [])];
      console.log('Normal calls - Unique dates:', uniqueDates);

      if (uniqueDates.length > 0) {
        latestDate = uniqueDates[0];
        query = query.eq('date', latestDate);
        console.log('Normal calls - Using latest date:', latestDate);
      } else {
        return NextResponse.json({
          success: true,
          data: {
            calls: { total: 0 },
            latestDate: null
          }
        });
      }
    }

    const { data: interactionsData, error: interactionsError } = await query;

    if (interactionsError) {
      console.error('Normal calls query error:', interactionsError);
      return NextResponse.json({ success: false, error: interactionsError.message }, { status: 500 });
    }

    const normalCalls = (interactionsData || []).filter(interaction => {
      const startup = interaction.corporate_leadgen_leads?.startup;
      const startupStr = String(startup || '').toLowerCase().trim();
      return startupStr === 'no';
    });

    const totalNormalCalls = normalCalls.length;

    return NextResponse.json({
      success: true,
      data: {
        calls: { total: totalNormalCalls },
        latestDate: latestDate
      }
    });

  } catch (error) {
    console.error('Normal calls count API error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
