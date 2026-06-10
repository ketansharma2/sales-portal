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

    // Get query params
    const { searchParams } = new URL(request.url);
    const dateRange = searchParams.get('dateRange') || 'default';
    const fromDate = searchParams.get('fromDate');
    const toDate = searchParams.get('toDate');

    // Build query - status = 'onboard' (lowercase)
    // Get distinct client_ids with onboard status
    let distinctClientsQuery = supabaseServer
      .from('corporate_leads_interaction')
      .select('client_id')
      .eq('leadgen_id', user.id)
      .ilike('status', 'onboard');

    // Apply date filtering based on dateRange type
    if (dateRange === 'specific' && fromDate && toDate) {
      distinctClientsQuery = distinctClientsQuery
        .gte('date', fromDate)
        .lte('date', toDate);
    } else if (dateRange === 'default') {
      // Get the latest interaction date for this user with 'onboard' status
      const { data: latestData } = await supabaseServer
        .from('corporate_leads_interaction')
        .select('date')
        .eq('leadgen_id', user.id)
        .ilike('status', 'onboard')
        .order('date', { ascending: false })
        .limit(1)
        .single();

      if (latestData && latestData.date) {
        const latestDate = latestData.date;
        distinctClientsQuery = distinctClientsQuery.eq('date', latestDate);
      }
    }
    // If dateRange === 'all', no date filter is applied

    // Get distinct client_ids
    const { data: distinctClientsData, error: distinctError } = await distinctClientsQuery.select('client_id');

    if (distinctError) {
      console.error('Onboard distinct clients fetch error:', distinctError);
      return NextResponse.json({ success: false, error: distinctError.message }, { status: 500 });
    }

    // Get unique client_ids
    const uniqueClientIds = [...new Set((distinctClientsData || []).map(item => item.client_id))];

    // Now fetch full interaction data for these distinct client_ids (latest interaction per client)
    let query = supabaseServer
      .from('corporate_leads_interaction')
      .select(`
        id,
        client_id,
        date,
        status,
        sub_status,
        remarks,
        next_follow_up,
        contact_person,
        contact_no,
        email,
        franchise_status,
        corporate_leadgen_leads(
          sourcing_date,
          company,
          category,
          district_city,
          state,
          startup
        )
      `)
      .eq('leadgen_id', user.id)
      .ilike('status', 'onboard');

    // Apply same date filtering
    if (dateRange === 'specific' && fromDate && toDate) {
      query = query
        .gte('date', fromDate)
        .lte('date', toDate);
    } else if (dateRange === 'default') {
      const { data: latestData } = await supabaseServer
        .from('corporate_leads_interaction')
        .select('date')
        .eq('leadgen_id', user.id)
        .ilike('status', 'onboard')
        .order('date', { ascending: false })
        .limit(1)
        .single();

      if (latestData && latestData.date) {
        query = query.eq('date', latestData.date);
      }
    }

    // Order by date descending
    query = query.order('date', { ascending: false });

    const { data: interactionsData, error } = await query;

    if (error) {
      console.error('Onboard interactions fetch error:', error);
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    // Filter to keep only the latest interaction for each unique client_id
    const latestByClient = {};
    (interactionsData || []).forEach(interaction => {
      if (!latestByClient[interaction.client_id]) {
        latestByClient[interaction.client_id] = interaction;
      }
    });

    const uniqueInteractions = Object.values(latestByClient);

    // Format the data
    const formattedInteractions = (uniqueInteractions || []).map(interaction => {
      const leadData = interaction.corporate_leadgen_leads;
      
      return {
        id: interaction.id,
        client_id: interaction.client_id,
        date: interaction.date,
        status: interaction.status,
        sub_status: interaction.sub_status,
        remarks: interaction.remarks,
        next_follow_up: interaction.next_follow_up,
        contact_person: interaction.contact_person,
        contact_no: interaction.contact_no,
        email: interaction.email,
        franchise_status: interaction.franchise_status,
        sourcing_date: leadData?.sourcing_date || '',
        company: leadData?.company || '',
        category: leadData?.category || '',
        district_city: leadData?.district_city || '',
        state: leadData?.state || '',
        startup: leadData?.startup || ''
      };
    });

    // Get total count
    const totalOnboard = formattedInteractions.length;

    return NextResponse.json({
      success: true,
      data: {
        onboard: { total: totalOnboard }
      },
      records: formattedInteractions
    });

  } catch (error) {
    console.error('Onboard API error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}