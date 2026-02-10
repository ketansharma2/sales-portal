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
        sourcing_date: data.sourcing_date
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
    const { client_id, company, category, state, location, emp_count, reference, sourcing_date } = body;

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
        sourcing_date
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

    // Use a single optimized query with LEFT JOIN and ROW_NUMBER to get latest interaction for all leads at once
    const { data: formattedLeads, error: queryError } = await supabaseServer
      .rpc('get_corporate_leads_with_latest_interaction', { 
        leadgen_user_id: user.id 
      })

    // If RPC function doesn't exist, use raw SQL query as fallback
    if (queryError) {
      const { data: rawData, error: rawError } = await supabaseServer
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
          created_at,
          corporate_leads_interaction!left (
            id,
            date,
            status,
            sub_status,
            remarks,
            next_follow_up,
            contact_person,
            contact_no,
            email,
            franchise_status,
            created_at
          )
        `)
        .eq('leadgen_id', user.id)
        .order('created_at', { ascending: false })

      if (rawError) {
        console.error('Leads fetch error:', rawError)
        return NextResponse.json({
          error: 'Failed to fetch leads',
          details: rawError.message
        }, { status: 500 })
      }

      // Format the data - now with contact_person, contact_no, email from latest interaction
      const formattedLeads = rawData?.map((lead) => {
        const latestInteraction = lead.corporate_leads_interaction?.[0] || null
        
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
          // NEW: Contact info from latest interaction
          contact_person: latestInteraction?.contact_person || '',
          contact_no: latestInteraction?.contact_no || latestInteraction?.phone || '',
          email: latestInteraction?.email || '',
          phone: latestInteraction?.contact_no || latestInteraction?.phone || '',
          isSubmitted: lead.sent_to_sm || false
        }
      }) || []

      return NextResponse.json({
        success: true,
        data: formattedLeads
      })
    }

    return NextResponse.json({
      success: true,
      data: formattedLeads || []
    })

  } catch (error) {
    console.error('Leads GET API error:', error)
    return NextResponse.json({
      error: 'Internal server error',
      details: error.message
    }, { status: 500 })
  }
}