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

    // Get latest sourcing_date from corporate_leadgen_leads
    const { data, error } = await supabaseServer
      .from('corporate_leadgen_leads')
      .select('sourcing_date')
      .eq('leadgen_id', user.id)
      .order('sourcing_date', { ascending: false })
      .limit(1)
      .single();

    if (error || !data || !data.sourcing_date) {
      // Fallback to today's date if no data
      const today = new Date().toISOString().split('T')[0];
      return NextResponse.json({
        success: true,
        latestDate: today,
        rawDate: today
      });
    }

    // sourcing_date is already in YYYY-MM-DD format
    const latestDate = data.sourcing_date;

    return NextResponse.json({
      success: true,
      latestDate: latestDate,
      rawDate: latestDate
    });

  } catch (error) {
    console.error('Latest date API error:', error);
    const today = new Date().toISOString().split('T')[0];
    return NextResponse.json({
      success: true,
      latestDate: today,
      rawDate: today
    });
  }
}
