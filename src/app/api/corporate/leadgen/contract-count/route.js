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

    // Get leads owned by this user, with their interactions
    const { data: rawData, error: queryError } = await supabase
      .from('corporate_leadgen_leads')
      .select(`
        client_id,
        startup,
        corporate_leads_interaction!left (
          id,
          date,
          sub_status,
          created_at
        )
      `)
      .eq('leadgen_id', user.id)
      .order('created_at', { ascending: false });

    if (queryError) {
      console.error('Query error:', queryError);
      return NextResponse.json({ success: false, error: queryError.message }, { status: 500 });
    }

    // Find latest interaction for each client (same logic as leads page)
    const latestInteractionsMap = new Map();
    rawData?.forEach(lead => {
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

    // Count clients where latest interaction sub_status = 'Contract Share' (case insensitive)
    const latestInteractions = Array.from(latestInteractionsMap.values());
    const contractLatest = latestInteractions.filter(i =>
      String(i.sub_status).trim().toLowerCase() === 'contract share'
    );
    const totalContract = contractLatest.length;

    // Count startup companies
    const startupContract = contractLatest.filter(i => {
      const startup = i.startup;
      return startup === true || 
             String(startup).toLowerCase() === 'yes' ||
             String(startup) === '1' ||
             String(startup).toLowerCase() === 'true';
    }).length;

    return NextResponse.json({
      success: true,
      data: {
        contract: { total: totalContract, startup: startupContract }
      }
    });

  } catch (error) {
    console.error('Contract count API error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
