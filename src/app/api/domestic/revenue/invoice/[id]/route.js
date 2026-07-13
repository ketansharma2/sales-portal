import { supabaseServer } from '@/lib/supabase-server';
import { NextResponse } from 'next/server';
import { getUser } from "@/lib/auth-helper";
export async function GET(request, { params }) {
  try {
    const { user, error: authError } = getUser(request)

if (authError || !user) {
  console.log('[API] Auth error:', authError)
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
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
