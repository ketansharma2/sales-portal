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

    // Get current month's start and end dates
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59).toISOString();

    // Fetch monthly call target for the user
    const { data: targetData, error: targetError } = await supabaseServer
      .from('corporate_leadgen_monthly_call_target')
      .select('target')
      .eq('leadgen_id', user.id)
      .eq('month', now.getMonth() + 1) // month is 1-12
      .eq('year', now.getFullYear())
      .single();

    if (targetError && targetError.code !== 'PGRST116') {
      console.error('Target fetch error:', targetError);
      return NextResponse.json({ success: false, error: targetError.message }, { status: 500 });
    }

    const monthlyTarget = targetData?.target || 0;

    // Fetch interactions for current month
    const { data: interactionsData, error: interactionsError } = await supabaseServer
      .from('corporate_leads_interaction')
      .select('*')
      .eq('leadgen_id', user.id)
      .gte('created_at', startOfMonth)
      .lte('created_at', endOfMonth);

    if (interactionsError) {
      console.error('Interactions fetch error:', interactionsError);
      return NextResponse.json({ success: false, error: interactionsError.message }, { status: 500 });
    }

    const totalInteractions = interactionsData?.length || 0;

    // Calculate performance percentage
    let performance = 0;
    if (monthlyTarget > 0) {
      performance = Math.round((totalInteractions / monthlyTarget) * 100);
    }

    return NextResponse.json({
      success: true,
      data: {
        performance: performance
      }
    });

  } catch (error) {
    console.error('Performance API error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
