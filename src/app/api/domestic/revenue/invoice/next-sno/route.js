import { supabaseServer } from '@/lib/supabase-server';
import { NextResponse } from 'next/server';

export async function GET(request) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabaseServer.auth.getUser(token);
    if (authError || !user) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
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
