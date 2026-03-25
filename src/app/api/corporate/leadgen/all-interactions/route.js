import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabaseServer = createClient(supabaseUrl, supabaseKey);

export async function GET(request) {
  try {
    /* ---------------- AUTH ---------------- */
    const authHeader = request.headers.get('authorization');

    if (!authHeader) {
      return NextResponse.json(
        { success: false, error: 'No authorization header' },
        { status: 401 }
      );
    }

    const token = authHeader.replace('Bearer ', '');
    const {
      data: { user },
      error: authError
    } = await supabaseServer.auth.getUser(token);

    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Invalid token' },
        { status: 401 }
      );
    }

    /* ---------------- DATE PARAMS ---------------- */
    const { searchParams } = new URL(request.url);
    const fromDate = searchParams.get('fromDate');
    const toDate = searchParams.get('toDate');
    const statusFilter = searchParams.get('status');
    const subStatusFilter = searchParams.get('subStatus');
    const franchiseStatusFilter = searchParams.get('franchiseStatus');
    const startupFilter = searchParams.get('startup');
    const isSubmittedFilter = searchParams.get('isSubmitted');

    /* ---------------- FETCH DATA ---------------- */
    let query = supabaseServer
      .from('corporate_leads_interaction')
      .select(`
        *,
        corporate_leadgen_leads!inner(
          client_id,
          company,
          category,
          state,
          district_city,
          startup,
          sent_to_sm
        )
      `)
      .eq('leadgen_id', user.id);

    // Add date filtering if provided
    if (fromDate && toDate) {
      query = query
        .gte('date', fromDate)
        .lte('date', toDate);
    }

    // Add status filter if provided
    if (statusFilter && statusFilter !== 'All') {
      query = query.eq('status', statusFilter);
    }

    // Add sub-status filter if provided
    if (subStatusFilter && subStatusFilter !== 'All') {
      query = query.eq('sub_status', subStatusFilter);
    }

    // Add franchise status filter if provided
    if (franchiseStatusFilter && franchiseStatusFilter !== 'All') {
      query = query.eq('franchise_status', franchiseStatusFilter);
    }

    const { data: interactionsData, error } = await query;

    if (error) {
      console.error('Fetch error:', error);
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    /* ---------------- FILTER: NOT "Not Picked" ---------------- */
    // Filter out interactions where status is "Not Picked"
    let filteredInteractions = (interactionsData || []).filter(
      i => i.status?.toLowerCase() !== 'not picked'
    );

    /* ---------------- STARTUP FILTER ---------------- */
    if (startupFilter && startupFilter !== 'All') {
      filteredInteractions = filteredInteractions.filter(i => {
        const startup = i.corporate_leadgen_leads?.startup;
        if (startupFilter === 'Yes') {
          return startup === true ||
                 String(startup).toLowerCase() === 'yes' ||
                 String(startup).toLowerCase() === 'true' ||
                 String(startup) === '1';
        } else if (startupFilter === 'Master Union') {
          return String(startup).toLowerCase() === 'master union';
        }
        return true;
      });
    }

    /* ---------------- IS SUBMITTED FILTER ---------------- */
    if (isSubmittedFilter && isSubmittedFilter !== 'All') {
      filteredInteractions = filteredInteractions.filter(i => {
        if (isSubmittedFilter === 'true') {
          return i.corporate_leadgen_leads?.sent_to_sm === true;
        } else if (isSubmittedFilter === 'false') {
          return i.corporate_leadgen_leads?.sent_to_sm === false || !i.corporate_leadgen_leads?.sent_to_sm;
        }
        return true;
      });
    }

    /* ---------------- FORMAT DATA ---------------- */
    const formattedInteractions = filteredInteractions.map(interaction => ({
      id: interaction.id,
      client_id: interaction.client_id,
      date: interaction.date,
      created_at: interaction.created_at,
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
      state: interaction.corporate_leadgen_leads?.state || '',
      district_city: interaction.corporate_leadgen_leads?.district_city || '',
      startup: interaction.corporate_leadgen_leads?.startup || '',
      isSubmitted: interaction.corporate_leadgen_leads?.sent_to_sm || false
    }));

    /* ---------------- SORT BY DATE DESC ---------------- */
    formattedInteractions.sort((a, b) => {
      const dateA = a.date ? new Date(a.date) : new Date(0);
      const dateB = b.date ? new Date(b.date) : new Date(0);
      return dateB - dateA;
    });

    /* ---------------- RESPONSE ---------------- */
    return NextResponse.json({
      success: true,
      data: formattedInteractions
    });

  } catch (err) {
    console.error('API Error:', err);
    return NextResponse.json(
      { success: false, error: err.message },
      { status: 500 }
    );
  }
}
