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
      return NextResponse.json({ success: true, data: { picked: { total: 0 }, notPicked: { total: 0 } } });
    }

    let pickedQuery = supabaseServer
      .from('corporate_leads_interaction')
      .select('*')
      .in('leadgen_id', leadgenIds)
      .not('status', 'ilike', '%not picked%');

    let notPickedQuery = supabaseServer
      .from('corporate_leads_interaction')
      .select('*')
      .in('leadgen_id', leadgenIds)
      .ilike('status', '%not picked%');

    let latestDate = null;

    if (dateRange === 'specific' && fromDate && toDate) {
      pickedQuery = pickedQuery
        .gte('date', fromDate)
        .lte('date', toDate);
      notPickedQuery = notPickedQuery
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
        pickedQuery = pickedQuery.eq('date', latestDate);
        notPickedQuery = notPickedQuery.eq('date', latestDate);
      } else {
        return NextResponse.json({
          success: true,
          data: {
            picked: { total: 0 },
            notPicked: { total: 0 },
            latestDate: null
          }
        });
      }
    }

    const [pickedData, notPickedData] = await Promise.all([
      pickedQuery,
      notPickedQuery
    ]);

    if (pickedData.error) {
      console.error('Picked query error:', pickedData.error);
      return NextResponse.json({ success: false, error: pickedData.error.message }, { status: 500 });
    }

    if (notPickedData.error) {
      console.error('Not picked query error:', notPickedData.error);
      return NextResponse.json({ success: false, error: notPickedData.error.message }, { status: 500 });
    }

    const totalPicked = pickedData.data?.length || 0;
    const totalNotPicked = notPickedData.data?.length || 0;

    return NextResponse.json({
      success: true,
      data: {
        picked: { total: totalPicked },
        notPicked: { total: totalNotPicked },
        latestDate: latestDate
      }
    });

  } catch (error) {
    console.error('Picked/Not Picked count API error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}