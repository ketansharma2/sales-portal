import { supabaseServer } from '@/lib/supabase-server'
import { NextResponse } from 'next/server'

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

    const { searchParams } = new URL(request.url)
    const branchId = searchParams.get('branch_id')

    if (!branchId) {
      return NextResponse.json({ error: 'Branch ID is required' }, { status: 400 })
    }

    // Fetch conversations for the branch
    const { data: conversations, error } = await supabaseServer
      .from('corporate_crm_conversation')
      .select('*')
      .eq('branch_id', branchId)
      .order('date', { ascending: false })

    if (error) {
      console.error('Fetch conversations error:', error)
      return NextResponse.json({
        error: 'Failed to fetch conversations',
        details: error.message
      }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      data: conversations
    })

  } catch (error) {
    console.error('Get conversations API error:', error)
    return NextResponse.json({
      error: 'Internal server error',
      details: error.message
    }, { status: 500 })
  }
}

export async function POST(request) {
  console.log('POST request received for conversation')
  try {
    // Authentication
    const authHeader = request.headers.get('authorization')
    console.log('Auth header:', authHeader ? 'present' : 'missing')
    if (!authHeader) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authError } = await supabaseServer.auth.getUser(token)
    if (authError || !user) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }

    const body = await request.json()
    console.log('Request body:', body)
    const { contactId: branch_id, contact_name, date, mode, discussion, nextFollowUp: next_follow_up, conversation_id } = body

    // Validate required fields
    if (!branch_id || !contact_name || !discussion) {
      console.log('Validation failed: missing branch_id, contact_name, or discussion')
      return NextResponse.json({ error: 'Branch ID, contact name, and discussion are required' }, { status: 400 })
    }

    const insertData = {
      branch_id,
      user_id: user.id,
      contact_name,
      date: date || new Date().toISOString().split('T')[0], // Default to today if not provided
      mode,
      discussion,
      next_follow_up,
      conversation_id
    }
    console.log('Insert data:', insertData)

    // Insert into corporate_crm_conversation table
    const { data: newConversation, error: insertError } = await supabaseServer
      .from('corporate_crm_conversation')
      .insert(insertData)
      .select()
      .single()

    if (insertError) {
      console.error('Insert conversation error:', insertError)
      return NextResponse.json({
        error: 'Failed to create conversation',
        details: insertError.message
      }, { status: 500 })
    }

    console.log('Inserted conversation:', newConversation)

    return NextResponse.json({
      success: true,
      data: newConversation
    })

  } catch (error) {
    console.error('Create conversation API error:', error)
    return NextResponse.json({
      error: 'Internal server error',
      details: error.message
    }, { status: 500 })
  }
}