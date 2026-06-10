import { NextResponse } from 'next/server';
import { getUser } from '@/lib/auth-helper';
import { supabaseServer } from '@/lib/supabase-server';

export async function GET(request) {
  try {
    // Authentication - user injected by middleware (no auth calls needed!)
    const { user, error: authError } = getUser(request);
    if (authError || !user) {
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
