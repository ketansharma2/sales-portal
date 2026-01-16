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
      'sourcing_date', 'company', 'category', 'state', 'location',
      'employee_count', 'contact_person', 'contact_no', 'email',
      'contact_mode', 'latest_contact_mode', 'contact_date',
      'latest_contact_date', 'reference', 'next_follow_up', 'status'
    ]

    const missingFields = requiredFields.filter(field => !body[field])
    if (missingFields.length > 0) {
      return NextResponse.json({
        error: `Missing required fields: ${missingFields.join(', ')}`
      }, { status: 400 })
    }

    // Prepare data for insertion
    const clientData = {
      user_id: user.id,
      sourcing_date: body.sourcing_date,
      company: body.company,
      client_type: body.client_type || 'Standard',
      category: body.category,
      state: body.state,
      location: body.location,
      employee_count: body.employee_count,
      contact_person: body.contact_person,
      contact_no: body.contact_no,
      email: body.email,
      contact_mode: body.contact_mode,
      latest_contact_mode: body.latest_contact_mode,
      contact_date: body.contact_date,
      latest_contact_date: body.latest_contact_date,
      reference: body.reference,
      next_follow_up: body.next_follow_up,
      status: body.status,
      sub_status: body.sub_status || null,
      projection: body.projection || null,
      remarks: body.remarks || null
    }

    // Insert into clients table
    const { data, error } = await supabaseServer
      .from('corporate_clients')
      .insert(clientData)
      .select()
      .single()

    if (error) {
      console.error('Supabase error:', error)
      return NextResponse.json({
        error: 'Failed to create client record',
        details: error.message
      }, { status: 500 })
    }


    return NextResponse.json({
      success: true,
      data: data,
      message: 'Client record created successfully'
    }, { status: 201 })

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

    // Get query parameters for filtering
    const { searchParams } = new URL(request.url)
    const category = searchParams.get('category')
    const state = searchParams.get('state')
    const status = searchParams.get('status')
    const limit = searchParams.get('limit')
    const date_from = searchParams.get('date_from')
    const date_op = searchParams.get('date_op') || 'eq'

    // Build query
    let query = supabaseServer
      .from('corporate_clients')
      .select('*')
      .eq('user_id', user.id)
      .order('sourcing_date', { ascending: false })

    // Apply date filter if provided (filter by latest_contact_date)
    if (date_from) {
      if (date_op === 'gte') {
        query = query.gte('latest_contact_date', date_from)
      } else {
        query = query.eq('latest_contact_date', date_from)
      }
    }

    // Apply filters
    if (category) query = query.eq('category', category)
    if (state) query = query.eq('state', state)
    if (status) query = query.eq('status', status)

    // Apply limit if provided
    if (limit) query = query.limit(parseInt(limit))

    const { data, error } = await query

    if (error) {
      console.error('Supabase error:', error)
      return NextResponse.json({
        error: 'Failed to fetch clients',
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

// PUT method for updating client records with history tracking
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

    // Get update data
    const updateData = await request.json()
    const { client_id, ...newValues } = updateData

    if (!client_id) {
      return NextResponse.json({
        error: 'client_id is required'
      }, { status: 400 })
    }

    // Fetch existing client data
    const { data: existingClient, error: fetchError } = await supabaseServer
      .from('corporate_clients')
      .select('*')
      .eq('client_id', client_id)
      .single()

    if (fetchError || !existingClient) {
      return NextResponse.json({
        error: 'Client not found'
      }, { status: 404 })
    }

    // Check if user owns this client
    if (existingClient.user_id !== user.id) {
      return NextResponse.json({
        error: 'Unauthorized to update this client'
      }, { status: 403 })
    }

    // Determine changed fields
    const changedFields = []
    const oldValues = {}
    const newValuesFiltered = {}

    Object.keys(newValues).forEach(field => {
      if (existingClient[field] !== newValues[field]) {
        changedFields.push(field)
        oldValues[field] = existingClient[field]
        newValuesFiltered[field] = newValues[field]
      }
    })

    // If no changes, return success
    if (changedFields.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No changes detected',
        data: existingClient
      })
    }

    // Insert history record
    const { error: historyError } = await supabaseServer
      .from('corporate_client_history')
      .insert({
        client_id: client_id,
        user_id: user.id,
        changed_fields: changedFields,
        old_values: oldValues,
        new_values: newValuesFiltered
      })

    if (historyError) {
      console.error('History insert error:', historyError)
      return NextResponse.json({
        error: 'Failed to create history record',
        details: historyError.message
      }, { status: 500 })
    }

    // Update the client record
    const { data: updatedClient, error: updateError } = await supabaseServer
      .from('corporate_clients')
      .update(newValuesFiltered)
      .eq('client_id', client_id)
      .select()
      .single()

    if (updateError) {
      console.error('Update error:', updateError)
      return NextResponse.json({
        error: 'Failed to update client',
        details: updateError.message
      }, { status: 500 })
    }


    return NextResponse.json({
      success: true,
      message: 'Client updated successfully',
      data: updatedClient,
      changes: {
        changed_fields: changedFields,
        old_values: oldValues,
        new_values: newValuesFiltered
      }
    })

  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({
      error: 'Internal server error',
      details: error.message
    }, { status: 500 })
  }
}
