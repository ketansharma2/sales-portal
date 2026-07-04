import { supabaseServer } from '@/lib/supabase-server'
import { NextResponse } from 'next/server'
import { getUser } from '@/lib/auth-helper';

export async function PUT(request, { params }) {
  try {
    // Authentication
      const { user, error: authError } = getUser(request);
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

     const currentUserId = user.user_id || user.id
     const body = await request.json()
     const revenueId = (await params).id
    const { ...updateFields } = body

    if (!revenueId) {
      return NextResponse.json({ error: 'Revenue ID is required' }, { status: 400 })
    }

    // Build update object - only allow specific fields
    const allowedFields = [
      // CRM fields
      'entry_date', 'crm_name', 'tl_name', 'entered_by_rc',
      // Entity & Contact fields
      'payment_from', 'client_name', 'candidate_name', 'profile',
      'client_email', 'client_mobile', 'candidate_email', 'candidate_mobile',
       // Financial fields
       'offer_salary', 'terms', 'payment_days', 'joining_date',
       'payment_due_date', 'payment_follow_up', 'base_invoice', 'total_with_gst', 'pi_date'
    ]

    const updateData = {}
    allowedFields.forEach(field => {
      if (updateFields[field] !== undefined) {
        updateData[field] = updateFields[field] === '' ? null : updateFields[field]
      }
    })

    // Update the record (bypass ownership check for now - revenue can edit any?)
    const { data: updated, error: updateError } = await supabaseServer
      .from('corporate_revenue')
      .update(updateData)
      .eq('revenue_id', revenueId)
      .select()
      .single()

    if (updateError) {
      console.error('Update revenue error:', updateError)
      return NextResponse.json({ error: 'Failed to update record', details: updateError.message }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      data: updated
    })

  } catch (error) {
    console.error('Revenue update API error:', error)
    return NextResponse.json({
      error: 'Internal server error',
      details: error.message
    }, { status: 500 })
  }
}
