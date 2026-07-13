import { supabaseServer } from '@/lib/supabase-server'
import { NextResponse } from 'next/server'
import { notificationService } from '@/lib/services/notificationService'
import { actions } from '@/lib/messages/userMessages';   // your notification file
import { getUser } from '@/lib/auth-helper';

export async function PUT(request) {
  try {
    // Authentication
      const { user, error: authError } = getUser(request);
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json()
    const {
      workbench_id,
      sent_to_rc,
      slot
    } = body

    // Validate required fields
    if (!workbench_id) {
      return NextResponse.json({
        error: 'workbench_id is required'
      }, { status: 400 })
    }

    // Update corporate_workbench table
    const { data: updatedWorkbench, error: updateError } = await supabaseServer
      .from('corporate_workbench')
      .update({
        sent_to_rc: sent_to_rc || null,
        slot: slot || null
      })
      .eq('workbench_id', workbench_id)
      .select()
      .single()

    if (updateError) {
      console.error('Update workbench error:', updateError)
      return NextResponse.json({
        error: 'Failed to update workbench',
        details: updateError.message
      }, { status: 500 })
    }

  
            
    await notificationService.createDynamicNotification( [sent_to_rc],actions.tl.tlAssignedWorkbench,user.id );

    return NextResponse.json({
      success: true,
      data: updatedWorkbench
    })

  } catch (error) {
    console.error('Update workbench API error:', error)
    return NextResponse.json({
      error: 'Internal server error',
      details: error.message
    }, { status: 500 })
  }
}
