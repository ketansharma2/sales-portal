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

    // Get request body
    const body = await request.json()

    // Validate required fields
    const requiredFields = [
      'client_id', 'contact_person'
    ]

    const missingFields = requiredFields.filter(field => !body[field])
    if (missingFields.length > 0) {
      return NextResponse.json({
        error: `Missing required fields: ${missingFields.join(', ')}`
      }, { status: 400 })
    }

    // Prepare data for insertion
    const interactionData = {
      client_id: body.client_id,
      user_id: user.id,
      contact_person: body.contact_person,
      contact_no: body.contact_no || null,
      email: body.email || null,
      contact_mode: body.latest_contact_mode || body.contact_mode,
      contact_date: body.latest_contact_date || body.contact_date,
      next_follow_up: body.next_follow_up || null,
      status: body.status || null,
      sub_status: body.sub_status || null,
      remarks: body.remarks || null
    }

    // Insert into domestic_clients_interaction table
    const { data, error } = await supabaseServer
      .from('domestic_clients_interaction')
      .insert(interactionData)
      .select()
      .single()

    if (error) {
      console.error('Supabase error:', error)
      return NextResponse.json({
        error: 'Failed to create interaction record',
        details: error.message
      }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      data: data,
      message: 'Interaction record created successfully'
    }, { status: 201 })

  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({
      error: 'Internal server error',
      details: error.message
    }, { status: 500 })
  }
}

export async function PUT(request) {
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

    // Get request body
    const body = await request.json()

    // Validate required fields
    if (!body.interaction_id) {
      return NextResponse.json({
        error: 'interaction_id is required'
      }, { status: 400 })
    }

    // Prepare data for update
    const updateData = {}
    if (body.contact_person !== undefined) updateData.contact_person = body.contact_person
    if (body.contact_no !== undefined) updateData.contact_no = body.contact_no || null
    if (body.email !== undefined) updateData.email = body.email || null
    if (body.contact_mode !== undefined) updateData.contact_mode = body.contact_mode
    if (body.contact_date !== undefined) updateData.contact_date = body.contact_date
    if (body.next_follow_up !== undefined) updateData.next_follow_up = body.next_follow_up || null
    if (body.status !== undefined) updateData.status = body.status
    if (body.sub_status !== undefined) updateData.sub_status = body.sub_status || null
    if (body.remarks !== undefined) updateData.remarks = body.remarks || null

    // Update interaction record
    const { data, error } = await supabaseServer
      .from('domestic_clients_interaction')
      .update(updateData)
      .eq('interaction_id', body.interaction_id)
      .eq('user_id', user.id)  // Ensure user can only update their own records
      .select()
      .single()

    if (error) {
      console.error('Supabase error:', error)
      return NextResponse.json({
        error: 'Failed to update interaction record',
        details: error.message
      }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      data: data,
      message: 'Interaction record updated successfully'
    })

  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({
      error: 'Internal server error',
      details: error.message
    }, { status: 500 })
  }
}

export async function GET(request) {
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

    // Get query parameters
    const { searchParams } = new URL(request.url)
    const clientId = searchParams.get('client_id')

    if (!clientId) {
      return NextResponse.json({
        error: 'client_id is required'
      }, { status: 400 })
    }

    // Build query
    let query = supabaseServer
      .from('domestic_clients_interaction')
      .select('*')
      .eq('client_id', clientId)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    const { data, error } = await query

    if (error) {
      console.error('Supabase error:', error)
      return NextResponse.json({
        error: 'Failed to fetch interactions',
        details: error.message
      }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      data: data || []
    })

  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({
      error: 'Internal server error',
      details: error.message
    }, { status: 500 })
  }
}