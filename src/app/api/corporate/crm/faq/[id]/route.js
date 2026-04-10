import { supabaseServer } from '@/lib/supabase-server'
import { NextResponse } from 'next/server'

// DELETE - Delete FAQ by faq_id
export async function DELETE(request, { params }) {
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

    const currentUserId = user.user_id || user.id
    const { id } = await params

    if (!id) {
      return NextResponse.json({ error: 'faq_id is required' }, { status: 400 })
    }

    const { error } = await supabaseServer
      .from('corporate_crm_faq')
      .delete()
      .eq('faq_id', id)
      .eq('user_id', currentUserId)

    if (error) {
      console.error('Delete FAQ error:', error)
      return NextResponse.json({ error: 'Failed to delete FAQ', details: error.message }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: 'FAQ deleted successfully'
    })

  } catch (error) {
    console.error('DELETE FAQ API error:', error)
    return NextResponse.json({ error: 'Internal server error', details: error.message }, { status: 500 })
  }
}