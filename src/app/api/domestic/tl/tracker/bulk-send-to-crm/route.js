import { supabaseServer } from '@/lib/supabase-server'
import { NextResponse } from 'next/server'

export async function POST(request) {
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
    const { conversation_ids, sent_to_crm } = body

    if (!conversation_ids || !Array.isArray(conversation_ids) || conversation_ids.length === 0) {
      return NextResponse.json({ error: 'Conversation IDs array is required' }, { status: 400 })
    }

    if (!sent_to_crm) {
      return NextResponse.json({ error: 'CRM user ID is required' }, { status: 400 })
    }

    const updateData = {
      sent_to_crm: sent_to_crm,
      crm_sent_date: new Date().toISOString()
    }

    const { data, error } = await supabaseServer
      .from('candidates_conversation')
      .update(updateData)
      .in('conversation_id', conversation_ids)
      .select()

    if (error) {
      console.error('Bulk update conversation error:', error)
      return NextResponse.json({
        error: 'Failed to update candidate conversations',
        details: error.message
      }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      count: data?.length || 0,
      data: data
    })

  } catch (error) {
    console.error('Bulk Send to CRM API error:', error)
    return NextResponse.json({
      error: 'Internal server error',
      details: error.message
    }, { status: 500 })
  }
}