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

    // Fetch interactions with leads data (exclude 'No Franchise Discuss')
    const { data: interactionsData, error: interactionsError } = await supabaseServer
      .from('corporate_leads_interaction')
      .select('*, corporate_leadgen_leads!inner(startup)')
      .eq('leadgen_id', user.id)
      .not('franchise_status', 'ilike', 'No Franchise Discuss');

    if (interactionsError) {
      console.error('Interactions fetch error:', interactionsError);
      return NextResponse.json({ success: false, error: interactionsError.message }, { status: 500 });
    }

    // Count unique companies with franchise_status NOT 'No Franchise Discuss'
    const discussedClientIds = new Set(interactionsData?.map(i => i.client_id) || []);
    const totalDiscussed = discussedClientIds.size;

    // Count startup companies with franchise discussed
    const startupDiscussedClientIds = new Set(
      (interactionsData || [])
        .filter(i => {
          const startup = i.corporate_leadgen_leads?.startup;
          return startup === true ||
                 String(startup).toLowerCase() === 'yes' ||
                 String(startup) === '1' ||
                 String(startup).toLowerCase() === 'true';
        })
        .map(i => i.client_id)
    );
    const startupDiscussed = startupDiscussedClientIds.size;

    return NextResponse.json({
      success: true,
      data: {
        discussed: { total: totalDiscussed, startup: startupDiscussed }
      }
    });

  } catch (error) {
    console.error('Franchise Discussed API error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
