import { NextResponse } from 'next/server'
import { supabaseServer } from '@/lib/supabase-server'

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
    const { cv_parsing_id, redacted_cv_url } = body

    if (!cv_parsing_id || !redacted_cv_url) {
      return NextResponse.json(
        { error: 'cv_parsing_id and redacted_cv_url are required' },
        { status: 400 }
      )
    }

    // Update the cv_parsing table with redacted_cv_url
    const { data, error } = await supabaseServer
      .from('cv_parsing')
      .update({ redacted_cv_url: redacted_cv_url })
      .eq('id', cv_parsing_id)
      .select()

    if (error) {
      console.error('Supabase update error:', error)
      return NextResponse.json(
        { error: 'Failed to update redacted CV URL', details: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Redacted CV URL updated successfully',
      data: data
    })

  } catch (error) {
    console.error('Update redacted CV API error:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    )
  }
}