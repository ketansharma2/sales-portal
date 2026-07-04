import { supabaseServer } from '@/lib/supabase-server';
import { NextResponse } from 'next/server';
import { getUser } from "@/lib/auth-helper";
export async function GET(
  request,
  { params }
) {
  try {
    // Authentication
const { user, error: authError } = getUser(request)

if (authError || !user) {
  console.log('[API] Auth error:', authError)
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
}

    const { id: invoiceId } = await params;

    if (!invoiceId) {
      return NextResponse.json({ error: 'invoice_id is required' }, { status: 400 });
    }

    const { data: invoice, error: fetchError } = await supabaseServer
      .from('corporate_revenue_invoice')
      .select('*')
      .eq('invoice_id', invoiceId)
      .single();

    if (fetchError || !invoice) {
      return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      data: invoice
    });

  } catch (error) {
    console.error('Error fetching invoice:', error);
    return NextResponse.json({
      error: 'Internal server error',
      details: error.message
    }, { status: 500 });
  }
}

export async function PUT(
  request,
  { params }
) {
  try {
    // Authentication
    const { user, error: authError } = getUser(request)

if (authError || !user) {
  console.log('[API] Auth error:', authError)
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
}

    const { id: invoiceId } = await params;
    const body = await request.json();

    const {
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

    // Validation: client_name required
    if (!client_name) {
      return NextResponse.json({ error: 'client_name is required' }, { status: 400 });
    }

    // Build update object (only allowed fields)
    const updateData = {
      ...(client_id !== undefined && { client_id }),
      client_name,
      ...(gstin !== undefined && { gst: gstin }),
      ...(state !== undefined && { state }),
      ...(address !== undefined && { address }),
      ...(pincode !== undefined && { pincode }),
      ...(from_date !== undefined && { from_date }),
      ...(to_date !== undefined && { to_date }),
      ...(candidate_details !== undefined && { candidate_details })
    };

    const { data: updated, error: updateError } = await supabaseServer
      .from('corporate_revenue_invoice')
      .update(updateData)
      .eq('invoice_id', invoiceId)
      .select()
      .single();

    if (updateError) {
      return NextResponse.json({
        error: 'Failed to update invoice',
        details: updateError.message
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      data: updated
    });

  } catch (error) {
    console.error('Error updating invoice:', error);
    return NextResponse.json({
      error: 'Internal server error',
      details: error.message
    }, { status: 500 });
  }
}
