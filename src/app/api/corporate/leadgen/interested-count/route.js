import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

export async function GET(request) {
  try {
    // Get user from token
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json({ success: false, error: 'No authorization header' }, { status: 401 });
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return NextResponse.json({ success: false, error: 'Invalid token' }, { status: 401 });
    }

    // Get date range from query params
    const { searchParams } = new URL(request.url);
    const fromDate = searchParams.get('fromDate');
    const toDate = searchParams.get('toDate');

    // Get all leads with their interactions
    const { data: rawData, error: queryError } = await supabase
      .from('corporate_leadgen_leads')
      .select(`
        client_id,
        startup,
        corporate_leads_interaction!left (
          id,
          date,
          status,
          created_at
        )
      `)
      .eq('leadgen_id', user.id)
      .order('created_at', { ascending: false });

    if (queryError) {
      console.error('Query error:', queryError);
      return NextResponse.json({ success: false, error: queryError.message }, { status: 500 });
    }

    // Filter leads based on date range if provided
    let leadsToConsider = rawData || [];
    if (fromDate && toDate) {
      // Get client_ids that have interactions in the date range
      const { data: interactionsInRange } = await supabase
        .from('corporate_leads_interaction')
        .select('client_id')
        .eq('leadgen_id', user.id)
        .gte('date', fromDate)
        .lte('date', toDate);
      
      const clientIdsInRange = new Set(interactionsInRange?.map(i => i.client_id) || []);
      leadsToConsider = (rawData || []).filter(lead => clientIdsInRange.has(lead.client_id));
    }

    // Find latest interaction for each client
    const latestInteractionsMap = new Map();
    leadsToConsider.forEach(lead => {
      const interaction = lead.corporate_leads_interaction?.[0] || null;
      if (interaction) {
        const existing = latestInteractionsMap.get(lead.client_id);
        if (!existing || new Date(interaction.created_at) > new Date(existing.created_at)) {
          latestInteractionsMap.set(lead.client_id, {
            ...interaction,
            startup: lead.startup
          });
        }
      }
    });

    // Count clients where latest interaction status = 'Interested'
    const latestInteractions = Array.from(latestInteractionsMap.values());
    const interestedLatest = latestInteractions.filter(i =>
      String(i.status).trim().toLowerCase() === 'interested'
    );
    const totalInterested = interestedLatest.length;

    // Count startup companies
    const startupInterested = interestedLatest.filter(i => {
      const startup = i.startup;
      return startup === true || 
             String(startup).toLowerCase() === 'yes' ||
             String(startup) === '1' ||
             String(startup).toLowerCase() === 'true';
    }).length;

    return NextResponse.json({
      success: true,
      data: {
        interested: { total: totalInterested, startup: startupInterested }
      }
    });

  } catch (error) {
    console.error('Interested count API error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
