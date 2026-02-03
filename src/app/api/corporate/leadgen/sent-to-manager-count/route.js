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

    // Fetch all leads for the user
    const { data: leadsData, error: leadsError } = await supabaseServer
      .from('corporate_leadgen_leads')
      .select('startup, sent_to_sm')
      .eq('leadgen_id', user.id);

    if (leadsError) {
      console.error('Leads fetch error:', leadsError);
      return NextResponse.json({ success: false, error: leadsError.message }, { status: 500 });
    }

    // Filter leads where sent_to_sm is true (case insensitive - boolean or string)
    const sentToManagerLeads = (leadsData || []).filter(lead => {
      const sentToSm = lead.sent_to_sm;
      return sentToSm === true ||
             String(sentToSm).toLowerCase() === 'true' ||
             String(sentToSm).toLowerCase() === 'yes' ||
             String(sentToSm) === '1';
    });

    // Count total and startups
    const totalSentToManager = sentToManagerLeads.length;
    const startupSentToManager = sentToManagerLeads.filter(lead =>
      lead.startup === true ||
      String(lead.startup).toLowerCase() === 'yes' ||
      String(lead.startup) === '1' ||
      String(lead.startup).toLowerCase() === 'true'
    ).length;

    return NextResponse.json({
      success: true,
      data: {
        sentToManager: { total: totalSentToManager, startup: startupSentToManager }
      }
    });

  } catch (error) {
    console.error('Sent to manager count API error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
