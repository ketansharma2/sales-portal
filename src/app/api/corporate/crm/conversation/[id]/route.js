import { supabaseServer } from '@/lib/supabase-server'
import { NextResponse } from 'next/server'

export async function PUT(request, { params }) {
  const { id: conversationId } = await params
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
    const { date, mode, discussion, nextFollowUp } = body

    if (!conversationId) {
      return NextResponse.json({ error: 'Conversation ID is required' }, { status: 400 })
    }

    const { data: updatedConversation, error: updateError } = await supabaseServer
      .from('corporate_crm_conversation')
      .update({
        date: date || null,
        mode: mode || null,
        discussion: discussion || null,
        next_follow_up: nextFollowUp || null
      })
      .eq('conversation_id', conversationId)
      .select()
      .single()

    if (updateError) {
      console.error('Update conversation error:', updateError)
      return NextResponse.json({
        error: 'Failed to update conversation',
        details: updateError.message
      }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      data: updatedConversation
    })

  } catch (error) {
    console.error('Update conversation API error:', error)
    return NextResponse.json({
      error: 'Internal server error',
      details: error.message
    }, { status: 500 })
  }
}
