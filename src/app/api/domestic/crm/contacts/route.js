import { supabaseServer } from '@/lib/supabase-server'
import { NextResponse } from 'next/server'

export async function POST(request) {
  try {
    // Authentication
    const authHeader = request.headers.get('authorization')
    if (!authHeader) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authError } = await supabaseServer.auth.getUser(token)
    if (authError || !user) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }

    const body = await request.json()
    const { branch_id, name, email, phone, designation, department, roleDescription, isPrimary } = body

    // Validate required fields
    if (!branch_id || !name) {
      return NextResponse.json({ error: 'Branch ID and name are required' }, { status: 400 })
    }

    // Convert isPrimary to boolean
    const isPrimaryBool = isPrimary === 'Yes'

    // Insert into domestic_crm_contacts table
    const { data: newContact, error: insertError } = await supabaseServer
      .from('domestic_crm_contacts')
      .insert({
        branch_id,
        name,
        email,
        phone,
        designation,
        dept: department,
        handles: roleDescription,
        is_primary: isPrimaryBool,
        user_id: user.id
      })
      .select()
      .single()

    if (insertError) {
      console.error('Insert contact error:', insertError)
      return NextResponse.json({
        error: 'Failed to create contact',
        details: insertError.message
      }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      data: newContact
    })

  } catch (error) {
    console.error('Create contact API error:', error)
    return NextResponse.json({
      error: 'Internal server error',
      details: error.message
    }, { status: 500 })
  }
}