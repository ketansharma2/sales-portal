import { supabaseServer } from '@/lib/supabase-server';
import { NextResponse } from 'next/server';
import { getUser } from "@/lib/auth-helper";

export async function GET(request) {
  try {
    // Authentication
const { user, error: authError } = getUser(request)

if (authError || !user) {
  console.log('[API] Auth error:', authError)
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
}

    // Get max s_no
    const { data: maxSnoResult, error: snoError } = await supabaseServer
      .from('corporate_revenue_invoice')
      .select('s_no')
      .order('s_no', { ascending: false })
      .limit(1)
      .maybeSingle();

    const nextSno = (maxSnoResult?.s_no || 0) + 1;

    return NextResponse.json({
      success: true,
      data: { next_sno: nextSno }
    });

  } catch (error) {
    console.error('Error fetching next sno:', error);
    return NextResponse.json({
      error: 'Internal server error',
      details: error.message
    }, { status: 500 });
  }
}
