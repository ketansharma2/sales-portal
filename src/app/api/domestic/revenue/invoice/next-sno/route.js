import { supabaseServer } from '@/lib/supabase-server';
import { NextResponse } from 'next/server';
import { getUser } from "@/lib/auth-helper";
export async function GET(request) {
  try {
    const { user, error: authError } = getUser(request)

if (authError || !user) {
  console.log('[API] Auth error:', authError)
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
}

    const { searchParams } = new URL(request.url);
    const clientId = searchParams.get('client_id');

    // TODO: Implement next invoice serial number logic
    return NextResponse.json({
      success: true,
      next_sno: 'INV-DOM-0001', // placeholder
      message: 'Next invoice serial number route ready for domestic'
    });

  } catch (error) {
    console.error('Domestic invoice next-sno error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
