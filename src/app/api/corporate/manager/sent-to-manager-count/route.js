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
      return NextResponse.json({ success: true, data: { sentToManager: { total: 0 } } });
    }

    let query = supabaseServer
      .from('corporate_leadgen_leads')
      .select('client_id')
      .in('leadgen_id', leadgenIds)
      .eq('sent_to_sm', true);

    if (dateRange === 'specific' && fromDate && toDate) {
      query = query
        .gte('lock_date', fromDate)
        .lte('lock_date', toDate);
    } else if (dateRange === 'default') {
      const { data: allDatesData } = await supabaseServer
        .from('corporate_leadgen_leads')
        .select('lock_date')
        .in('leadgen_id', leadgenIds)
        .eq('sent_to_sm', true)
        .not('lock_date', 'is', null)
        .order('lock_date', { ascending: false })
        .limit(100);

      const uniqueDates = [...new Set(allDatesData?.map(d => d.lock_date).filter(Boolean) || [])];

      if (uniqueDates.length > 0) {
        const latestDate = uniqueDates[0];
        query = query.eq('lock_date', latestDate);
      } else {
        return NextResponse.json({
          success: true,
          data: {
            sentToManager: { total: 0 }
          }
        });
      }
    }

    query = query.order('lock_date', { ascending: false });

    const { data: leadsData, error } = await query;

    if (error) {
      console.error('Sent to Manager leads fetch error:', error);
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    const totalSentToManager = leadsData?.length || 0;

    return NextResponse.json({
      success: true,
      data: {
        sentToManager: { total: totalSentToManager }
      }
    });

  } catch (error) {
    console.error('Sent to Manager count API error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}