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
    const { company, category, state, location, emp_count, reference, sourcing_date } = body;

    if (!company) {
      return NextResponse.json({ error: 'Company name is required' }, { status: 400 });
    }

    const { data, error } = await supabaseServer
      .from('domestic_leadgen_leads')
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

    // Fetch leads for the user
    const { data: leadsData, error: leadsError } = await supabaseServer
      .from('domestic_leadgen_leads')
      .select('*')
      .eq('leadgen_id', user.id)
      .order('created_at', { ascending: false })

    if (leadsError) {
      console.error('Leads fetch error:', leadsError)
      return NextResponse.json({
        error: 'Failed to fetch leads',
        details: leadsError.message
      }, { status: 500 })
    }

    // Format the data to match the expected structure with latest interaction
    const formattedLeads = await Promise.all(leadsData?.map(async (lead) => {
      const { data: latestInteraction } = await supabaseServer
        .from('domestic_leads_interaction')
        .select('*')
        .eq('client_id', lead.client_id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()

      return {
        id: lead.client_id,
        sourcingDate: lead.sourcing_date,
        company: lead.company,
        category: lead.category,
        state: lead.state,
        location: lead.location,
        empCount: lead.emp_count,
        reference: lead.reference,
        status: latestInteraction?.status || 'New', // Status from latest interaction
        subStatus: latestInteraction?.sub_status || 'New Lead', // Sub-status from latest interaction
        latestFollowup: latestInteraction ? new Date(latestInteraction.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: '2-digit' }) : '',
        remarks: latestInteraction?.remarks || '',
        nextFollowup: latestInteraction?.next_follow_up ? new Date(latestInteraction.next_follow_up).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: '2-digit' }) : '',
        isSubmitted: lead.sent_to_sm || false
      }
    }) || [])

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