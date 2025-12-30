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
      .from('clients')
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

    // Update DWR after creating client
    await updateDwrForUser(user.id)

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

    // Build query
    let query = supabaseServer
      .from('clients')
      .select('*')
      .eq('user_id', user.id)
      .order('sourcing_date', { ascending: false })

    // Apply date filter if provided
    if (date_from) query = query.gte('sourcing_date', date_from)

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
      .from('clients')
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
      .from('client_history')
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
      .from('clients')
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

    // Update DWR only if latest_contact_date is set to today
    const today = new Date().toISOString().split('T')[0]
    if (changedFields.includes('latest_contact_date') && newValues.latest_contact_date === today) {
      await updateDwrForUser(user.id)
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

// Helper function to update DWR for user
async function updateDwrForUser(userId) {
  try {
    const today = new Date().toISOString().split('T')[0]

    // Get today's activity data
    const { data: todayActivityData, error: todayActivityError } = await supabaseServer
      .from('clients')
      .select('*')
      .eq('user_id', userId)
      .or(`sourcing_date.eq.${today},latest_contact_date.eq.${today}`)

    if (todayActivityError) {
      console.error('Today activity error:', todayActivityError)
      return
    }

    // Calculate today's metrics
    const todayClients = todayActivityData || []
    const todayIndividual = todayClients.filter(client => client.sourcing_date === today).length
    const todayRepeat = todayClients.filter(client =>
      client.latest_contact_date === today && client.sourcing_date !== client.latest_contact_date
    ).length
    const uniqueTodayClients = new Set(todayClients.map(c => c.client_id))
    const todayTotal = uniqueTodayClients.size
    const todayInterested = todayClients.filter(client => client.status === 'Interested').length
    const todayNotInterested = todayClients.filter(client => client.status === 'Not Interested').length
    const todayReachedOut = todayClients.filter(client => client.status === 'Reached Out').length
    const todayOnboarded = todayClients.filter(client => client.status === 'Onboarded').length

    // Check if DWR record exists
    const { data: existingDwr, error: dwrCheckError } = await supabaseServer
      .from('dwr_history')
      .select('*')
      .eq('user_id', userId)
      .eq('dwr_date', today)
      .single()

    const dwrData = {
      user_id: userId,
      dwr_date: today,
      total_visit: todayTotal,
      individual: todayIndividual,
      repeat: todayRepeat,
      interested: todayInterested,
      not_interested: todayNotInterested,
      reached_out: todayReachedOut,
      onboarded: todayOnboarded
    }

    if (existingDwr) {
      await supabaseServer
        .from('dwr_history')
        .update(dwrData)
        .eq('user_id', userId)
        .eq('dwr_date', today)
    } else {
      await supabaseServer
        .from('dwr_history')
        .insert(dwrData)
    }
  } catch (error) {
    console.error('DWR update error:', error)
  }
}