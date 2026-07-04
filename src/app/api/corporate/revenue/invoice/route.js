import { supabaseServer } from '@/lib/supabase-server';
import { NextResponse } from 'next/server';
import { getUser } from "@/lib/auth-helper";
export async function POST(request) {
  try {
    // Authentication
const { user, error: authError } = getUser(request)

if (authError || !user) {
  console.log('[API] Auth error:', authError)
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
}

    const body = await request.json();
    const {
      revenue_ids,
      client_id,
      client_name,
      gstin,
      state,
      address,
      pincode,
      from_date,
      to_date,
      candidate_details
    } = body;

    // Validation
    if (!revenue_ids || !Array.isArray(revenue_ids) || revenue_ids.length === 0) {
      return NextResponse.json({ error: 'revenue_ids array is required' }, { status: 400 });
    }
    if (!client_name) {
      return NextResponse.json({ error: 'client_name is required' }, { status: 400 });
    }

    // Check: all revenue_ids must belong to same client
    if (revenue_ids.length > 0) {
      const { data: revenueRows, error: revError } = await supabaseServer
        .from('corporate_revenue')
        .select('revenue_id, client_id, client_name')
        .in('revenue_id', revenue_ids);

      if (revError) {
        return NextResponse.json({ error: 'Failed to fetch revenue records', details: revError.message }, { status: 500 });
      }

      if (revenueRows.length !== revenue_ids.length) {
        return NextResponse.json({ error: 'Some revenue IDs not found' }, { status: 404 });
      }

      // Verify same client
      const uniqueClientIds = [...new Set(revenueRows.map(r => r.client_id))];
      if (uniqueClientIds.length > 1) {
        return NextResponse.json({ error: 'Selected candidates belong to different clients. Please select only one client per invoice.' }, { status: 400 });
      }
    }

    // Generate s_no: max(s_no) + 1
    const { data: maxSnoResult, error: snoError } = await supabaseServer
      .from('corporate_revenue_invoice')
      .select('s_no')
      .order('s_no', { ascending: false })
      .limit(1)
      .maybeSingle();

    const nextSno = (maxSnoResult?.s_no || 0) + 1;

    // Generate invoice_no: SAVVI/PI/YYYYMMDD/N (using current date + s_no, no padding)
    const now = new Date();
    const datePart = now.toISOString().slice(0, 10).replace(/-/g, ''); // YYYYMMDD
    const invoiceNo = `SAVVI/PI/${datePart}/${nextSno}`;

    // Insert invoice
    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
    const { data: invoice, error: insertError } = await supabaseServer
      .from('corporate_revenue_invoice')
      .insert({
        user_id: user.user_id || user.id,
        invoice_no: invoiceNo,
        s_no: nextSno,
        client_id: client_id || null,
        client_name,
        gst: gstin || null,
        state: state || null,
        address: address || null,
        pincode: pincode || null,
        date: today,
        from_date: from_date || null,
        to_date: to_date || null,
        candidate_details: candidate_details || [],
        created_at: new Date().toISOString()
      })
      .select()
      .single();

    if (insertError) {
      return NextResponse.json({
        error: 'Failed to create invoice',
        details: insertError.message
      }, { status: 500 });
    }

    // Update all selected revenue rows with invoice_id
    const { error: updateError } = await supabaseServer
      .from('corporate_revenue')
      .update({ invoice_id: invoice.invoice_id })
      .in('revenue_id', revenue_ids);

    if (updateError) {
      return NextResponse.json({
        error: 'Failed to link revenue records to invoice',
        details: updateError.message
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      data: invoice
    }, { status: 201 });

  } catch (error) {
    console.error('Error generating invoice:', error);
    return NextResponse.json({
      error: 'Internal server error',
      details: error.message
    }, { status: 500 });
  }
}
