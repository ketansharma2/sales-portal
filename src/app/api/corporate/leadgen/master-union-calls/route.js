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
    const dateRange = searchParams.get('dateRange') || 'default'; // default, all, specific
    const type = searchParams.get('type') || 'all'; // all, new, followup

    /* ---------------- FETCH DATA ---------------- */
    // Build the base query to get interactions with lead data
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
      .eq('leadgen_id', user.id);

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
      console.error('Fetch error:', error);
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    /* ---------------- FILTER: STARTUP = MASTER UNION ---------------- */
    // Filter for Master Union clients only (startup='Master Union', case-insensitive)
    let filteredInteractions = (interactionsData || []).filter(interaction => {
      const startup = interaction.corporate_leadgen_leads?.startup;
      const startupStr = String(startup || '').toLowerCase().trim();
      return startupStr === 'master union';
    });

    /* ---------------- FORMAT DATA ---------------- */
    const formattedInteractions = filteredInteractions.map(interaction => {
      const leadData = interaction.corporate_leadgen_leads;
      const sourcingDate = leadData?.sourcing_date;
      const interactionDate = interaction.date;
      
      // Compare dates to determine if it's a new call or followup call
      let isNewCall = false;
      if (sourcingDate && interactionDate) {
        const sourceDateStr = typeof sourcingDate === 'string' ? sourcingDate.split('T')[0] : sourcingDate;
        const interactDateStr = typeof interactionDate === 'string' ? interactionDate.split('T')[0] : interactionDate;
        isNewCall = sourceDateStr === interactDateStr;
      }

      return {
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
        sourcing_date: sourcingDate,
        company: leadData?.company || '',
        category: leadData?.category || '',
        state: leadData?.state || '',
        district_city: leadData?.district_city || '',
        startup: leadData?.startup || '',
        isNewCall: isNewCall
      };
    });

    /* ---------------- FILTER BY TYPE ---------------- */
    let filteredData = formattedInteractions;
    if (type === 'new') {
      filteredData = formattedInteractions.filter(interaction => interaction.isNewCall);
    } else if (type === 'followup') {
      filteredData = formattedInteractions.filter(interaction => !interaction.isNewCall);
    }

    /* ---------------- GET COUNTS ---------------- */
    const totalCalls = formattedInteractions.length;
    const newCalls = formattedInteractions.filter(interaction => interaction.isNewCall).length;
    const followupCalls = formattedInteractions.filter(interaction => !interaction.isNewCall).length;

    /* ---------------- SORT BY DATE DESC ---------------- */
    filteredData.sort((a, b) => {
      const dateA = a.date ? new Date(a.date) : new Date(0);
      const dateB = b.date ? new Date(b.date) : new Date(0);
      return dateB - dateA;
    });

    /* ---------------- RESPONSE ---------------- */
    return NextResponse.json({
      success: true,
      data: {
        calls: { total: totalCalls },
        newCalls: { total: newCalls },
        followupCalls: { total: followupCalls }
      },
      records: filteredData
    });

  } catch (err) {
    console.error('API Error:', err);
    return NextResponse.json(
      { success: false, error: err.message },
      { status: 500 }
    );
  }
}