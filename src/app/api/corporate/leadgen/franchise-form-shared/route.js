import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabaseServer = createClient(supabaseUrl, supabaseKey);

export async function GET(request) {
  try {
    // Get user from token
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json({ success: false, error: 'No authorization header' }, { status: 401 });
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabaseServer.auth.getUser(token);

    if (authError || !user) {
      return NextResponse.json({ success: false, error: 'Invalid token' }, { status: 401 });
    }

    // Fetch all interactions for latest interaction logic
    const { data: interactionsData, error: interactionsError } = await supabaseServer
      .from('corporate_leads_interaction')
      .select('*, corporate_leadgen_leads!inner(startup)')
      .eq('leadgen_id', user.id);

    if (interactionsError) {
      console.error('Interactions fetch error:', interactionsError);
      return NextResponse.json({ success: false, error: interactionsError.message }, { status: 500 });
    }

    // Find latest interaction per client and check if franchise_status = 'Application form share' (case insensitive)
    const clientLatestInteraction = {};

    interactionsData?.forEach(i => {
      const clientId = i.client_id;
      const interactionDate = new Date(i.created_at);
      const existing = clientLatestInteraction[clientId];

      if (!existing || interactionDate > new Date(existing.created_at)) {
        clientLatestInteraction[clientId] = i;
      }
    });

    // Count clients whose latest interaction has 'Application form share' status (case insensitive)
    const formSharedClientIds = new Set();
    const startupFormSharedClientIds = new Set();

    Object.values(clientLatestInteraction).forEach(i => {
      if (String(i.franchise_status).toLowerCase().includes('application form share') ||
          String(i.franchise_status).toLowerCase() === 'application form share') {
        formSharedClientIds.add(i.client_id);

        // Check if startup
        const startup = i.corporate_leadgen_leads?.startup;
        if (startup === true ||
            String(startup).toLowerCase() === 'yes' ||
            String(startup) === '1' ||
            String(startup).toLowerCase() === 'true') {
          startupFormSharedClientIds.add(i.client_id);
        }
      }
    });

    const totalFormShared = formSharedClientIds.size;
    const startupFormShared = startupFormSharedClientIds.size;

    return NextResponse.json({
      success: true,
      data: {
        formShared: { total: totalFormShared, startup: startupFormShared }
      }
    });

  } catch (error) {
    console.error('Franchise Form Shared API error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
