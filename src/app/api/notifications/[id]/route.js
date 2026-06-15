import { supabaseServer } from '@/lib/supabase-server'
import { NextResponse } from 'next/server'

export async function PATCH(request, { params }) {
  try {
    const authHeader = request.headers.get('authorization')
    if (!authHeader) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authError } = await supabaseServer.auth.getUser(token)
    if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const { id } = await params;  
    const { is_read } = await request.json()
    if (typeof is_read !== 'boolean') {
      return NextResponse.json({ error: 'is_read must be a boolean' }, { status: 400 })
    }

    const readAt = is_read ? new Date().toISOString() : null
    const { error } = await supabaseServer
      .from('notifications')
      .update({ is_read, read_at: readAt })
      .eq('id', id)
      .eq('receiver_id', user.id)

    if (error) {
      console.error('PATCH notification error:', error)
      return NextResponse.json({ error: 'Failed to update notification' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('PATCH notification unexpected error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(request, { params }) {
  try {
    const authHeader = request.headers.get('authorization')
    if (!authHeader) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authError } = await supabaseServer.auth.getUser(token)
    if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const { id } = await params;  
    const { error } = await supabaseServer
      .from('notifications')
      .delete()
      .eq('id', id)
      .eq('receiver_id', user.id)

    if (error) {
      console.error('DELETE notification error:', error)
      return NextResponse.json({ error: 'Failed to delete notification' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('DELETE notification unexpected error:', err)

  return NextResponse.json(
    {
      error: 'Internal server error',
      details: err instanceof Error ? err.message : String(err),
    },
    { status: 500 }
  );  }
}