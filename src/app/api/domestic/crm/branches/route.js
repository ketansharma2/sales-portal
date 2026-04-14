import { supabaseServer } from '@/lib/supabase-server'
import { NextResponse } from 'next/server'

export async function GET(request) {
  try {
    const authHeader = request.headers.get('authorization')
    if (!authHeader) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authError } = await supabaseServer.auth.getUser(token)
    if (authError || !user) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const client_id = searchParams.get('client_id')

    if (!client_id) {
      return NextResponse.json({ error: 'Client ID is required' }, { status: 400 })
    }

    const { data: branches, error: fetchError } = await supabaseServer
      .from('domestic_crm_branch')
      .select('branch_id, branch_name, state, city, initial_status')
      .eq('client_id', client_id)
      .order('branch_name', { ascending: true })

    if (fetchError) {
      console.error('Fetch branches error:', fetchError)
      return NextResponse.json({
        error: 'Failed to fetch branches',
        details: fetchError.message
      }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      data: branches || []
    })

  } catch (error) {
    console.error('Fetch branches API error:', error)
    return NextResponse.json({
      error: 'Internal server error',
      details: error.message
    }, { status: 500 })
  }
}

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
    const { client_id, branch_name, state, city, initial_status, full_address } = body

    // Validate required fields
    if (!client_id || !branch_name || !state) {
      return NextResponse.json({ error: 'Client ID, branch name, and state are required' }, { status: 400 })
    }

    // Insert into domestic_crm_branch table
    const { data: newBranch, error: insertError } = await supabaseServer
      .from('domestic_crm_branch')
      .insert({
        client_id,
        branch_name,
        state,
        city,
        initial_status,
        full_address,
        user_id: user.id
      })
      .select()
      .single()

    if (insertError) {
      console.error('Insert branch error:', insertError)
      return NextResponse.json({
        error: 'Failed to create branch',
        details: insertError.message
      }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      data: newBranch
    })

  } catch (error) {
    console.error('Create branch API error:', error)
    return NextResponse.json({
      error: 'Internal server error',
      details: error.message
    }, { status: 500 })
  }
}

export async function PUT(request) {
  try {
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
    const { branchId, branch_name, state, city, full_address, initial_status } = body

    if (!branchId) {
      return NextResponse.json({ error: 'Branch ID is required' }, { status: 400 })
    }

    const { data: updated, error: updateError } = await supabaseServer
      .from('domestic_crm_branch')
      .update({
        branch_name,
        state,
        city,
        full_address,
        initial_status
      })
      .eq('branch_id', branchId)
      .select()
      .single()

    if (updateError) {
      console.error('Update branch error:', updateError)
      return NextResponse.json({
        error: 'Failed to update branch',
        details: updateError.message
      }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      data: updated
    })

  } catch (error) {
    console.error('Update branch API error:', error)
    return NextResponse.json({
      error: 'Internal server error',
      details: error.message
    }, { status: 500 })
  }
}