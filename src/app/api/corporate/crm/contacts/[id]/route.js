import { supabaseServer } from '@/lib/supabase-server'
import { NextResponse } from 'next/server'
import { getUser } from '@/lib/auth-helper'

export async function PUT(request, { params }) {
  const { id: contactId } = await params
  try {
    // Authentication - user injected by middleware (no auth calls needed!)
    const { user, error: authError } = getUser(request);
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json()
    const { branch_id, name, email, phone, designation, department, roleDescription, isPrimary } = body

    if (!contactId || !branch_id) {
      return NextResponse.json({ error: 'Contact ID and branch ID are required' }, { status: 400 })
    }

    const isPrimaryBool = isPrimary === true || isPrimary === 'true'

    const { data: updatedContact, error: updateError } = await supabaseServer
      .from('corporate_crm_contacts')
      .update({
        name,
        email,
        phone,
        designation,
        dept: department,
        handles: roleDescription,
        is_primary: isPrimaryBool
      })
      .eq('contact_id', contactId)
      .eq('branch_id', branch_id)
      .select()
      .single()

    if (updateError) {
      console.error('Update contact error:', updateError)
      return NextResponse.json({
        error: 'Failed to update contact',
        details: updateError.message
      }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      data: updatedContact
    })

  } catch (error) {
    console.error('Update contact API error:', error)
    return NextResponse.json({
      error: 'Internal server error',
      details: error.message
    }, { status: 500 })
  }
}
