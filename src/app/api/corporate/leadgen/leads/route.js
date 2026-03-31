import { supabaseServer } from '@/lib/supabase-server'
import { NextResponse } from 'next/server'

export async function POST(request) {
  try {
    // Authentication
    const authHeader = request.headers.get('authorization')
    if (!authHeader) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authError } = await supabaseServer.auth.getUser(token)
    if (authError || !user) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }

    const body = await request.json();
    const { company, category, state, location, emp_count, reference, sourcing_date, district_city, startup } = body;

    if (!company) {
      return NextResponse.json({ error: 'Company name is required' }, { status: 400 });
    }

    const { data, error } = await supabaseServer
      .from('corporate_leadgen_leads')
      .insert({
        company,
        category,
        state,
        location,
        emp_count,
        reference,
        sourcing_date,
        district_city,
        startup,
        leadgen_id: user.id
      })
      .select()
      .single();

    if (error) {
      console.error('Database error:', error);
      return NextResponse.json({ error: 'Failed to create lead' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      data: {
        client_id: data.client_id,
        company: data.company,
        category: data.category,
        state: data.state,
        location: data.location,
        emp_count: data.emp_count,
        reference: data.reference,
        sourcing_date: data.sourcing_date,
        district_city: data.district_city,
        startup: data.startup
      }
    });

  } catch (error) {
    console.error('Leads POST API error:', error)
    return NextResponse.json({
      error: 'Internal server error',
      details: error.message
    }, { status: 500 })
  }
}

export async function PUT(request) {
  try {
    // Authentication
    const authHeader = request.headers.get('authorization')
    if (!authHeader) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authError } = await supabaseServer.auth.getUser(token)
    if (authError || !user) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }

    const body = await request.json();
    const { client_id, company, category, state, location, emp_count, reference, sourcing_date, district_city, startup } = body;

    if (!client_id) {
      return NextResponse.json({ error: 'Client ID is required' }, { status: 400 });
    }

    // Check if the lead belongs to the user
    const { data: existingLead, error: fetchError } = await supabaseServer
      .from('corporate_leadgen_leads')
      .select('leadgen_id')
      .eq('client_id', client_id)
      .single();

    if (fetchError || !existingLead) {
      return NextResponse.json({ error: 'Lead not found' }, { status: 404 });
    }

    if (existingLead.leadgen_id !== user.id) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    const { data, error } = await supabaseServer
      .from('corporate_leadgen_leads')
      .update({
        company,
        category,
        state,
        location,
        emp_count,
        reference,
        sourcing_date,
        district_city,
        startup
      })
      .eq('client_id', client_id)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: 'Failed to update lead' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      data: {
        client_id: data.client_id,
        company: data.company,
        category: data.category,
        state: data.state,
        location: data.location,
        emp_count: data.emp_count,
        reference: data.reference,
        sourcing_date: data.sourcing_date
      }
    });

  } catch (error) {
    return NextResponse.json({
      error: 'Internal server error',
      details: error.message
    }, { status: 500 })
  }
}

export async function DELETE(request) {
  try {
    // Authentication
    const authHeader = request.headers.get('authorization')
    if (!authHeader) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authError } = await supabaseServer.auth.getUser(token)
    if (authError || !user) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }

    const body = await request.json();
    const { client_id } = body;

    if (!client_id) {
      return NextResponse.json({ error: 'Client ID is required' }, { status: 400 });
    }

    // Check if the lead belongs to the user
    const { data: existingLead, error: fetchError } = await supabaseServer
      .from('corporate_leadgen_leads')
      .select('leadgen_id')
      .eq('client_id', client_id)
      .single();

    if (fetchError || !existingLead) {
      return NextResponse.json({ error: 'Lead not found' }, { status: 404 });
    }

    if (existingLead.leadgen_id !== user.id) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // Delete the lead (this will also delete related interactions due to cascade if configured)
    const { error: deleteError } = await supabaseServer
      .from('corporate_leadgen_leads')
      .delete()
      .eq('client_id', client_id);

    if (deleteError) {
      console.error('Delete error:', deleteError);
      return NextResponse.json({ error: 'Failed to delete lead' }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: 'Lead deleted successfully' });

  } catch (error) {
    console.error('Leads DELETE API error:', error);
    return NextResponse.json({
      error: 'Internal server error',
      details: error.message
    }, { status: 500 });
  }
}

export async function GET(request) {
  try {
    // Authentication
    const authHeader = request.headers.get('authorization')
    if (!authHeader) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authError } = await supabaseServer.auth.getUser(token)
    if (authError || !user) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }
    
    // Skip RPC function and use fallback query to match dashboard logic
    // Fetch leads with their interactions ordered by created_at descending
    
    // Get date range and filters from query params
    const { searchParams } = new URL(request.url);
    const fromDate = searchParams.get('fromDate');
    const toDate = searchParams.get('toDate');
    const startupFilter = searchParams.get('startup');

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

    // If startup filter is provided, filter by startup
    if (startupFilter && startupFilter !== 'All') {
      if (startupFilter === 'No') {
        // Normal clients: startup is 'no' (case-insensitive) or NULL
        query = query.or('startup.ilike.no,startup.is.null');
      }
    }

    // If date range is provided, filter by sourcing_date
    if (fromDate && toDate) {
      query = query
        .gte('sourcing_date', fromDate)
        .lte('sourcing_date', toDate);
    }

    const { data: rawData, error: rawError } = await query;

    if (rawError) {
      console.error('Leads fetch error:', rawError)
      return NextResponse.json({
        error: 'Failed to fetch leads',
        details: rawError.message
      }, { status: 500 })
    }

    // Format the data - sort interactions by created_at descending (most recent first)
    // This matches the dashboard contract-count logic
    const formattedLeads = rawData?.map((lead) => {
      // Sort interactions by created_at descending (most recent first)
      const sortedInteractions = lead.corporate_leads_interaction?.sort((a, b) => {
        if (!a.created_at && !b.created_at) return 0
        if (!a.created_at) return 1
        if (!b.created_at) return -1
        return new Date(b.created_at) - new Date(a.created_at)
      }) || []
      const latestInteraction = sortedInteractions[0] || null
      
      // Check if ANY interaction has Contract Share (for filtering)
      const everContractShare = lead.corporate_leads_interaction?.some(
        interaction => interaction.sub_status === 'Contract Share'
      ) || false
      
      return {
        id: lead.client_id,
        sourcingDate: lead.sourcing_date,
        company: lead.company,
        category: lead.category,
        state: lead.state,
        location: lead.location,
        district_city: lead.district_city || '',
        empCount: lead.emp_count,
        reference: lead.reference,
        startup: lead.startup,
        status: latestInteraction?.status || 'New',
        subStatus: latestInteraction?.sub_status || 'New Lead',
        franchiseStatus: latestInteraction?.franchise_status || '',
        latestFollowup: latestInteraction?.date || null,
        remarks: latestInteraction?.remarks || '',
        nextFollowup: latestInteraction?.next_follow_up || null,
        contact_person: latestInteraction?.contact_person || '',
        contact_no: latestInteraction?.contact_no || latestInteraction?.phone || '',
        email: latestInteraction?.email || '',
        phone: latestInteraction?.contact_no || latestInteraction?.phone || '',
        isSubmitted: lead.sent_to_sm || false,
        everContractShare: everContractShare
      }
    }) || []

    return NextResponse.json({
      success: true,
      data: formattedLeads
    })

  } catch (error) {
    console.error('Leads GET API error:', error)
    return NextResponse.json({
      error: 'Internal server error',
      details: error.message
    }, { status: 500 })
  }
}
