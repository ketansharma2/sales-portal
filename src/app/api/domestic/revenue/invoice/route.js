import { supabaseServer } from '@/lib/supabase-server';
import { NextResponse } from 'next/server';
import { getUser } from "@/lib/auth-helper";
export async function POST(request) {
  try {
    const { user, error: authError } = getUser(request)

if (authError || !user) {
  console.log('[API] Auth error:', authError)
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
}

    const body = await request.json();
    // TODO: Implement full invoice generation logic (same as corporate)
    // For now, return success placeholder
    return NextResponse.json({
      success: true,
      message: 'Invoice generation route created (domestic). Implement logic as per corporate version.',
      data: body
    }, { status: 201 });

  } catch (error) {
    console.error('Domestic invoice POST error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
