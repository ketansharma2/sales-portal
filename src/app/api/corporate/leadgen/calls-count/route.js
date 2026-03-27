import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabaseServer = createClient(supabaseUrl, supabaseKey);

export async function GET(request) {
  try {
    // Authentication
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json({ success: false, error: 'No authorization header' }, { status: 401 });
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabaseServer.auth.getUser(token);

    if (authError || !user) {
      return NextResponse.json({ success: false, error: 'Invalid token' }, { status: 401 });
    }

    // Get date range from query params
    const { searchParams } = new URL(request.url);
    const fromDate = searchParams.get('fromDate');
    const toDate = searchParams.get('toDate');

    // Fetch interactions with leads data
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
        corporate_leadgen_leads!inner(
          client_id,
          company,
          category,
          district_city,
          state,
          sourcing_date,
          startup
        )
      `)
      .eq('leadgen_id', user.id);

    // Add date filtering if provided
    if (fromDate && toDate) {
      query = query
        .gte('date', fromDate)
        .lte('date', toDate);
    }

    // Order by date descending
    query = query.order('date', { ascending: false });

    const { data: interactionsData, error } = await query;

    if (error) {
      console.error('Interactions fetch error:', error);
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    // Format the data
    const formattedInteractions = (interactionsData || []).map(interaction => ({
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
      company: interaction.corporate_leadgen_leads?.company || '',
      category: interaction.corporate_leadgen_leads?.category || '',
      district_city: interaction.corporate_leadgen_leads?.district_city || '',
      state: interaction.corporate_leadgen_leads?.state || '',
      sourcing_date: interaction.corporate_leadgen_leads?.sourcing_date || '',
      startup: interaction.corporate_leadgen_leads?.startup || ''
    }));

    // Get total count
    const totalCalls = formattedInteractions.length;

    return NextResponse.json({
      success: true,
      data: {
        calls: { total: totalCalls }
      },
      records: formattedInteractions
    });

  } catch (error) {
    console.error('Total calls API error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}