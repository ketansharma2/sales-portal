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

    // Get query params
    const { searchParams } = new URL(request.url);
    const dateRange = searchParams.get('dateRange') || 'default';
    const fromDate = searchParams.get('fromDate');
    const toDate = searchParams.get('toDate');

    // Build query - fetch leads where sent_to_sm = true
    let query = supabaseServer
      .from('corporate_leadgen_leads')
      .select(`
        client_id,
        sourcing_date,
        company,
        category,
        district_city,
        state,
        startup,
        sent_to_sm,
        lock_date,
        leadgen_id,
        corporate_leads_interaction(
          id,
          date,
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
      .eq('leadgen_id', user.id)
      .eq('sent_to_sm', true)
      .order('date', { foreignTable: 'corporate_leads_interaction', ascending: false });

    // Apply date filtering based on dateRange type
    // For sent to manager, we filter by lock_date
    if (dateRange === 'specific' && fromDate && toDate) {
      query = query
        .gte('lock_date', fromDate)
        .lte('lock_date', toDate);
    } else if (dateRange === 'default') {
      // Get the latest lock_date for this user
      const { data: latestData } = await supabaseServer
        .from('corporate_leadgen_leads')
        .select('lock_date')
        .eq('leadgen_id', user.id)
        .eq('sent_to_sm', true)
        .not('lock_date', 'is', null)
        .order('lock_date', { ascending: false })
        .limit(1)
        .single();

      if (latestData && latestData.lock_date) {
        const latestDate = latestData.lock_date;
        query = query.eq('lock_date', latestDate);
      }
    }
    // If dateRange === 'all', no date filter is applied

    // Order by lock_date descending
    query = query.order('lock_date', { ascending: false });

    const { data: leadsData, error } = await query;

    if (error) {
      console.error('Sent to Manager leads fetch error:', error);
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    // Format the data - get latest interaction for each lead
    const formattedLeads = (leadsData || []).map(lead => {
      // Get the latest interaction (first one since sorted by date desc)
      const interactions = lead.corporate_leads_interaction || [];
      const latestInteraction = interactions.length > 0 ? interactions[0] : null;
      
      return {
        id: lead.client_id,
        client_id: lead.client_id,
        date: lead.sourcing_date,
        sourcing_date: lead.sourcing_date,
        lock_date: lead.lock_date,
        company: lead.company || '',
        category: lead.category || '',
        district_city: lead.district_city || '',
        state: lead.state || '',
        startup: lead.startup || '',
        isSubmitted: true,
        // Interaction fields
        status: latestInteraction?.status || '',
        sub_status: latestInteraction?.sub_status || '',
        remarks: latestInteraction?.remarks || '',
        next_follow_up: latestInteraction?.next_follow_up || '',
        contact_person: latestInteraction?.contact_person || '',
        contact_no: latestInteraction?.contact_no || '',
        email: latestInteraction?.email || '',
        franchise_status: latestInteraction?.franchise_status || ''
      };
    });

    // Get total count
    const totalSentToManager = formattedLeads.length;

    return NextResponse.json({
      success: true,
      data: {
        sentToManager: { total: totalSentToManager }
      },
      records: formattedLeads
    });

  } catch (error) {
    console.error('Sent to Manager API error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}