import { supabaseServer } from '@/lib/supabase-server'
import { NextResponse } from 'next/server'

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

    const body = await request.json()
    const { workbench_id, tl_remark } = body

    // Validate required fields
    if (!workbench_id) {
      return NextResponse.json({
        error: 'workbench_id is required'
      }, { status: 400 })
    }

    if (!tl_remark) {
      return NextResponse.json({
        error: 'tl_remark is required'
      }, { status: 400 })
    }

    // Update corporate_workbench table with tl_remarks (replaces entire content, not append)
    const { data: updatedWorkbench, error: updateError } = await supabaseServer
      .from('corporate_workbench')
      .update({
        tl_remarks: tl_remark
      })
      .eq('workbench_id', workbench_id)
      .select()
      .single()

    if (updateError) {
      console.error('Update tl_remarks error:', updateError)
      return NextResponse.json({
        error: 'Failed to update tl_remarks',
        details: updateError.message
      }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      data: updatedWorkbench
    })

  } catch (error) {
    console.error('TL Remark API error:', error)
    return NextResponse.json({
      error: 'Internal server error',
      details: error.message
    }, { status: 500 })
  }
}