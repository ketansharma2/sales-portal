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
      return NextResponse.json({ success: true, data: { newCalls: { total: 0 }, followupCalls: { total: 0 } } });
    }

    const { data: allInteractions, error: allError } = await supabaseServer
      .from('corporate_leads_interaction')
      .select('id, client_id, created_at, contact_person')
      .in('leadgen_id', leadgenIds)
      .order('created_at', { ascending: true });

    if (allError) {
      console.error('All interactions fetch error:', allError);
      return NextResponse.json({ success: false, error: allError.message }, { status: 500 });
    }

    const firstInteractionMap = new Map();
    
    (allInteractions || []).forEach(interaction => {
      const clientId = interaction.client_id;
      const contactPerson = interaction.contact_person || '';
      const createdAt = interaction.created_at;
      const key = `${clientId}_${contactPerson}`;
      
      if (!firstInteractionMap.has(key)) {
        firstInteractionMap.set(key, createdAt);
      }
    });

    let query = supabaseServer
      .from('corporate_leads_interaction')
      .select('id, client_id, date, created_at, contact_person')
      .in('leadgen_id', leadgenIds);

    let latestDate = null;

    if (dateRange === 'specific' && fromDate && toDate) {
      query = query
        .gte('date', fromDate)
        .lte('date', toDate);
    } else if (dateRange === 'default') {
      const { data: allDatesData } = await supabaseServer
        .from('corporate_leads_interaction')
        .select('date')
        .in('leadgen_id', leadgenIds)
        .not('date', 'is', null)
        .order('date', { ascending: false })
        .limit(100);

      const uniqueDates = [...new Set(allDatesData?.map(d => d.date).filter(Boolean) || [])];

      if (uniqueDates.length > 0) {
        latestDate = uniqueDates[0];
        query = query.eq('date', latestDate);
      } else {
        return NextResponse.json({
          success: true,
          data: {
            newCalls: { total: 0 },
            followupCalls: { total: 0 },
            latestDate: null
          }
        });
      }
    }

    query = query.order('date', { ascending: false });

    const { data: interactionsData, error: interactionsError } = await query;

    if (interactionsError) {
      console.error('Interactions query error:', interactionsError);
      return NextResponse.json({ success: false, error: interactionsError.message }, { status: 500 });
    }

    let newCallsCount = 0;
    let followupCallsCount = 0;

    for (const interaction of (interactionsData || [])) {
      const clientId = interaction.client_id;
      const contactPerson = interaction.contact_person || '';
      const createdAt = interaction.created_at;
      const key = `${clientId}_${contactPerson}`;
      
      const firstCreatedAt = firstInteractionMap.get(key);
      const isNewCall = firstCreatedAt === createdAt;

      if (isNewCall) {
        newCallsCount++;
      } else {
        followupCallsCount++;
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        newCalls: { total: newCallsCount },
        followupCalls: { total: followupCallsCount },
        latestDate: latestDate
      }
    });

  } catch (error) {
    console.error('New/Followup calls count API error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}