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
      .select('role, user_id')
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
      return NextResponse.json({ success: true, data: { conversationLog: [] } });
    }

    let query = supabaseServer
      .from('corporate_leads_interaction')
      .select(`
        id,
        leadgen_id,
        client_id,
        date,
        contact_person,
        contact_no,
        email,
        status,
        sub_status,
        franchise_status,
        remarks,
        corporate_leadgen_leads(
          company,
          startup
        ),
        users(
          name
        )
      `)
      .in('leadgen_id', leadgenIds)
      .order('created_at', { ascending: false });

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
      }
    }
    // If dateRange === 'all', no date filter is applied

    const { data: interactionsData, error: interactionsError } = await query;

    if (interactionsError) {
      console.error('Conversation log query error:', interactionsError);
      return NextResponse.json({ success: false, error: interactionsError.message }, { status: 500 });
    }

    const conversationLog = (interactionsData || []).map(interaction => {
      const leadData = interaction.corporate_leadgen_leads;
      const leadgenData = interaction.users;
      const startup = leadData?.startup || '';
      const startupLower = startup.toLowerCase().trim();

      return {
        id: interaction.id,
        leadgen_id: interaction.leadgen_id,
        leadgen_name: leadgenData?.name || '',
        client_id: interaction.client_id,
        company: leadData?.company || '',
        date: interaction.date || '',
        contact_person: interaction.contact_person || '',
        contact_no: interaction.contact_no || '',
        email: interaction.email || '',
        remarks: interaction.remarks || '',
        status: interaction.status || '',
        sub_status: interaction.sub_status || '',
        franchise_status: interaction.franchise_status || '',
        startup: startup,
        startupBadge: startupLower === 'yes' ? 'S' : startupLower === 'master union' ? 'M' : null
      };
    });

    return NextResponse.json({
      success: true,
      data: {
        conversationLog: conversationLog,
        latestDate: latestDate
      }
    });

  } catch (error) {
    console.error('Conversation log API error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
