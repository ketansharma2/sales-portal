import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getUser } from "@/lib/auth-helper";
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabaseServer = createClient(supabaseUrl, supabaseKey);

export async function GET(request) {
  try {
    // Get user from token
const { user, error: authError } = getUser(request);

if (authError || !user) {
  console.log('[API] Auth error:', authError);
  return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
}

    // Get latest date from corporate_leads_interaction table (last call/interaction date)
    const { data, error } = await supabaseServer
      .from('corporate_leads_interaction')
      .select('date')
      .eq('leadgen_id', user.id)
      .not('date', 'is', null)
      .order('date', { ascending: false })
      .limit(1)
      .single();

    if (error || !data || !data.date) {
      // Fallback to today's date if no interaction data
      const today = new Date().toISOString().split('T')[0];
      return NextResponse.json({
        success: true,
        latestDate: today,
        rawDate: today
      });
    }

    // date is already in YYYY-MM-DD format
    const latestDate = data.date;

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