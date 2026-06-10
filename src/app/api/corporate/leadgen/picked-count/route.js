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

    // Build query - status does NOT contain "not picked" (case-insensitive)
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
      .not('status', 'ilike', '%not picked%');

    // Apply date filtering based on dateRange type
    if (dateRange === 'specific' && fromDate && toDate) {
      query = query
        .gte('date', fromDate)
        .lte('date', toDate);
    } else if (dateRange === 'default') {
      // Get the latest interaction date for this user
      const { data: latestData } = await supabaseServer
        .from('corporate_leads_interaction')
        .select('date')
        .eq('leadgen_id', user.id)
        .not('status', 'ilike', '%not picked%')
        .order('date', { ascending: false })
        .limit(1)
        .single();

      if (latestData && latestData.date) {
        const latestDate = latestData.date;
        query = query.eq('date', latestDate);
      }
    }
    // If dateRange === 'all', no date filter is applied

    // Order by date descending
    query = query.order('date', { ascending: false });

    const { data: interactionsData, error } = await query;

    if (error) {
      console.error('Picked interactions fetch error:', error);
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    // Format the data
    const formattedInteractions = (interactionsData || []).map(interaction => {
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
    const totalPicked = formattedInteractions.length;

    return NextResponse.json({
      success: true,
      data: {
        picked: { total: totalPicked }
      },
      records: formattedInteractions
    });

  } catch (error) {
    console.error('Picked calls API error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}