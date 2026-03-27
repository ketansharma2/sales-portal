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

    /* ---------------- FETCH DATA ---------------- */
    // Build query to get Master Union clients (leads)
    // Include interaction data similar to the regular leads API
    let query = supabaseServer
      .from('corporate_leadgen_leads')
      .select(`
        client_id,
        company,
        category,
        state,
        location,
        district_city,
        emp_count,
        reference,
        startup,
        sourcing_date,
        sent_to_sm,
        corporate_leads_interaction!left (
          id,
          date,
          created_at,
          status,
          sub_status,
          remarks,
          next_follow_up,
          contact_person,
          contact_no,
          email,
          franchise_status
        )
      `)
      .eq('leadgen_id', user.id);

    // Add startup filter for Master Union
    query = query.eq('startup', 'Master Union');

    // Apply date filtering based on dateRange type
    if (dateRange === 'specific' && fromDate && toDate) {
      query = query
        .gte('sourcing_date', fromDate)
        .lte('sourcing_date', toDate);
    } else if (dateRange === 'default') {
      // Get the latest interaction date for this user to filter by
      const { data: latestData } = await supabaseServer
        .from('corporate_leads_interaction')
        .select('date')
        .eq('leadgen_id', user.id)
        .order('date', { ascending: false })
        .limit(1)
        .single();

      if (latestData && latestData.date) {
        const latestDate = latestData.date;
        // Filter leads where sourcing_date matches latest interaction date
        query = query.eq('sourcing_date', latestDate);
      }
    }
    // If dateRange === 'all', no date filter is applied

    // Order by sourcing_date descending
    query = query.order('sourcing_date', { ascending: false });

    const { data: leadsData, error } = await query;

    if (error) {
      console.error('Fetch error:', error);
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    /* ---------------- FORMAT DATA ---------------- */
    // Format the data - sort interactions by created_at descending (most recent first)
    const formattedLeads = (leadsData || []).map((lead) => {
      // Sort interactions by created_at descending (most recent first)
      const sortedInteractions = lead.corporate_leads_interaction?.sort((a, b) => {
        if (!a.created_at && !b.created_at) return 0;
        if (!a.created_at) return 1;
        if (!b.created_at) return -1;
        return new Date(b.created_at) - new Date(a.created_at);
      }) || [];
      const latestInteraction = sortedInteractions[0] || null;

      return {
        id: lead.client_id,
        client_id: lead.client_id,
        sourcing_date: lead.sourcing_date,
        company: lead.company || '',
        category: lead.category || '',
        state: lead.state || '',
        district_city: lead.district_city || '',
        startup: lead.startup || '',
        contact_person: latestInteraction?.contact_person || lead.contact_person || '',
        phone: latestInteraction?.contact_no || lead.phone || '',
        email: latestInteraction?.email || lead.email || '',
        status: latestInteraction?.status || lead.status || 'New',
        subStatus: latestInteraction?.sub_status || lead.subStatus || '',
        remarks: latestInteraction?.remarks || lead.remarks || '',
        nextFollowup: latestInteraction?.next_follow_up || lead.nextFollowup || '',
        franchiseStatus: latestInteraction?.franchise_status || lead.franchiseStatus || '',
        isSubmitted: lead.sent_to_sm || false
      };
    });

    /* ---------------- RESPONSE ---------------- */
    return NextResponse.json({
      success: true,
      data: formattedLeads
    });

  } catch (err) {
    console.error('API Error:', err);
    return NextResponse.json(
      { success: false, error: err.message },
      { status: 500 }
    );
  }
}