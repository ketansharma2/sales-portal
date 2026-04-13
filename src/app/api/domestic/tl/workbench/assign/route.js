import { supabaseServer } from '@/lib/supabase-server'
import { NextResponse } from 'next/server'

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
    const {
      workbench_id,
      sent_to_rc,
      slot
    } = body

    if (!workbench_id) {
      return NextResponse.json({
        error: 'workbench_id is required'
      }, { status: 400 })
    }

    const { data: updatedWorkbench, error: updateError } = await supabaseServer
      .from('domestic_workbench')
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