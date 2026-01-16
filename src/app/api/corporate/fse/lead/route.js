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
      'sourcing_date', 'company', 'client_type', 'category', 'state', 'location',
      'employee_count', 'reference'
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
      company_name: body.company,
      client_type: body.client_type,
      category: body.category,
      state: body.state,
      location: body.location,
      sourcing_mode: body.contact_mode, // mapping from page
      emp_count: body.employee_count,
      reference: body.reference
    }

    // Insert into corporate_clients table
    const { data, error } = await supabaseServer
      .from('corporate_clients')
      .insert(clientData)
      .select()
      .single()

    if (error) {
      console.error('Supabase error:', error)
      return NextResponse.json({
        error: 'Failed to create corporate client record',
        details: error.message
      }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      data: data,
      message: 'Domestic client record created successfully'
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
    const company = searchParams.get('company')
    const category = searchParams.get('category')
    const location = searchParams.get('location')
    const status = searchParams.get('status')
    const sub_status = searchParams.get('sub_status')
    const projection = searchParams.get('projection')
    const client_type = searchParams.get('client_type')
    const fromDate = searchParams.get('fromDate')
    const toDate = searchParams.get('toDate')
    const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit')) : null

    // Fetch clients in batches to bypass 1000 limit
    let allClients = []
    let offset = 0
    const batchSize = 1000

    while (true) {
      let batchQuery = supabaseServer
        .from('corporate_clients')
        .select('*')
        .eq('user_id', user.id)

      if (client_type) {
        batchQuery = batchQuery.eq('client_type', client_type)
      }

      if (company) {
        batchQuery = batchQuery.ilike('company_name', `%${company}%`)
      }
      if (category) {
        batchQuery = batchQuery.eq('category', category)
      }
      if (location) {
        batchQuery = batchQuery.or(`location.ilike.%${location}%,state.ilike.%${location}%`)
      }

      batchQuery = batchQuery.order('sourcing_date', { ascending: false }).order('client_id', { ascending: false })
      batchQuery = batchQuery.range(offset, offset + batchSize - 1)

      const { data: batch, error: batchError } = await batchQuery

      if (batchError || !batch || batch.length === 0) break

      allClients.push(...batch)
      offset += batchSize

      if (batch.length < batchSize) break
      if (limit && allClients.length >= limit) break
    }

    const clients = limit ? allClients.slice(0, limit) : allClients

    if (allClients.length === 0 && offset === 0) {
      // No clients fetched
    }

    // Fetch interactions for these clients
    const clientIds = clients?.map(c => c.client_id) || []
    let interactions = []
    if (clientIds.length > 0) {
      const { data: ints, error: intError } = await supabaseServer
        .from('corporate_clients_interaction')
        .select('*')
        .eq('user_id', user.id)
        .order('client_id', { ascending: true })
        .order('contact_date', { ascending: false })
        .order('created_at', { ascending: false })

      if (intError) {
        console.error('Interactions error:', intError)
      } else {
        // Filter interactions to only those for the fetched clients
        interactions = ints?.filter(int => clientIds.includes(int.client_id)) || []
      }
    }

    // Process to get latest interaction per client
    const clientMap = new Map()
    clients?.forEach(client => {
      clientMap.set(client.client_id, {
        ...client,
        interactions: []
      })
    })

    interactions.forEach(int => {
      if (clientMap.has(int.client_id)) {
        clientMap.get(int.client_id).interactions.push(int)
      }
    })

    const clientsWithLatest = Array.from(clientMap.values()).map(client => {
      const latestInteraction = client.interactions.sort((a, b) => new Date(b.created_at) - new Date(a.created_at))[0]
      return {
        ...client,
        latest_contact_date: latestInteraction?.contact_date || null,
        latest_contact_mode: latestInteraction?.contact_mode || null,
        remarks: latestInteraction?.remarks || null,
        next_follow_up: latestInteraction?.next_follow_up || null,
        status: latestInteraction?.status || null,
        sub_status: latestInteraction?.sub_status || null,
        projection: latestInteraction?.projection || null
      }
    })

    // Apply remaining filters (status, sub_status, projection, dates) in JS
    let filteredData = clientsWithLatest
    if (status) {
      filteredData = filteredData.filter(client => client.status === status)
    }
    if (sub_status) {
      filteredData = filteredData.filter(client => client.sub_status === sub_status)
    }
    if (projection) {
      filteredData = filteredData.filter(client => client.projection === projection)
    }
    if (fromDate && toDate) {
      filteredData = filteredData.filter(client => {
        if (!client.latest_contact_date) return false;
        return client.latest_contact_date >= fromDate && client.latest_contact_date <= toDate;
      });
    }

    return NextResponse.json({
      success: true,
      data: filteredData
    })

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

    // Prepare update data, mapping fields
    const updateFields = {
      company_name: newValues.company,
      client_type: newValues.client_type,
      category: newValues.category,
      state: newValues.state,
      location: newValues.location,
      sourcing_mode: newValues.contact_mode,
      emp_count: newValues.employee_count,
      reference: newValues.reference,
      // Add interaction fields if present
      contact_person: newValues.contact_person,
      contact_no: newValues.contact_no,
      email: newValues.email,
      contact_mode: newValues.latest_contact_mode,
      contact_date: newValues.latest_contact_date,
      next_follow_up: newValues.next_follow_up,
      status: newValues.status,
      sub_status: newValues.sub_status,
      projection: newValues.projection,
      remarks: newValues.remarks
    }

    // Remove undefined fields
    Object.keys(updateFields).forEach(key => {
      if (updateFields[key] === undefined) delete updateFields[key]
    })

    // Update the client record
    const { data: updatedClient, error: updateError } = await supabaseServer
      .from('corporate_clients')
      .update(updateFields)
      .eq('client_id', client_id)
      .select()
      .single()

    if (updateError) {
      console.error('Update error:', updateError)
      return NextResponse.json({
        error: 'Failed to update corporate client',
        details: updateError.message
      }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: 'Domestic client updated successfully',
      data: updatedClient
    })

  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({
      error: 'Internal server error',
      details: error.message
    }, { status: 500 })
  }
}