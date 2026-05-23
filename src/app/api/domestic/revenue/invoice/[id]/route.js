import { supabaseServer } from '@/lib/supabase-server';
import { NextResponse } from 'next/server';

export async function GET(request, { params }) {
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

    const invoiceId = params.id;

    // TODO: Fetch specific invoice by id from domestic_invoices table
    return NextResponse.json({
      success: true,
      data: { invoice_id: invoiceId, message: 'Invoice detail route ready for domestic' }
    });

  } catch (error) {
    console.error('Domestic invoice [id] GET error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
