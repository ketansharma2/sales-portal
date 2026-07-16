import { supabaseServer } from '@/lib/supabase-server'
import { NextResponse } from 'next/server'
import { notificationService } from '@/lib/services/notificationService'
import { actions } from '@/lib/messages/userMessages'; 
import { getUser, getUserName } from '@/lib/auth-helper' // Import getUserName

export async function POST(request) {
  try {
      const { user, error: authError } = getUser(request);
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
     const actorName = await getUserName(request);
    
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
    if (sent_to_crm) {
    await notificationService.createDynamicNotification( [sent_to_crm],actions.tl.tlsendBulkTracker,user.id, { 
        extra: { actorName: actorName } 
      }   );
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