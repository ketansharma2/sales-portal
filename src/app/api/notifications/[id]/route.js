import { supabaseServer } from '@/lib/supabase-server'
import { NextResponse } from 'next/server'

// Helper function to get user from token
async function getUserFromToken(request) {
  const authHeader = request.headers.get('authorization')
  if (!authHeader) return null
  
  const token = authHeader.replace('Bearer ', '')
  const { data: { user }, error: authError } = await supabaseServer.auth.getUser(token)
  
  if (authError || !user) return null
  return user
}

export async function PATCH(request, { params }) {
  try {
    // Get authenticated user
    const user = await getUserFromToken(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get notification ID and request body
    const { id } = await params
    const { is_read } = await request.json()

    // Validate input
    if (typeof is_read !== 'boolean') {
      return NextResponse.json({ error: 'is_read must be a boolean' }, { status: 400 })
    }

    // Prepare update data
    const readAt = is_read ? new Date().toISOString() : null
    
    // Update notification
    const { data, error } = await supabaseServer
      .from('notifications')
      .update({ is_read, read_at: readAt})
      .eq('id', id)
      .eq('receiver_id', user.id)
      .select('id') // Select to verify update happened

    if (error) {
      console.error('PATCH notification error:', error.message)
      return NextResponse.json({ error: 'Failed to update notification' }, { status: 500 })
    }
    

    console.log("Notfication:",data)
    // Check if notification was found and updated
    if (!data || data.length === 0) {
      return NextResponse.json({ error: 'Notification not found or unauthorized' }, { status: 404 })
    }

    return NextResponse.json({ success: true, updated: true })
    
  } catch (err) {
    console.error('PATCH notification error:', err.message)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(request, { params }) {
  try {
    // Get authenticated user
    const user = await getUserFromToken(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get notification ID
    const { id } = await params
    
    // Validate ID
    if (!id) {
      return NextResponse.json({ error: 'Notification ID is required' }, { status: 400 })
    }

    // First, check if notification exists and belongs to user
    const { data: existing, error: findError } = await supabaseServer
      .from('notifications')
      .select('id')
      .eq('id', id)
      .eq('receiver_id', user.id)
      .single()

    if (findError || !existing) {
      return NextResponse.json({ error: 'Notification not found or unauthorized' }, { status: 404 })
    }

    // Delete the notification
    const { error: deleteError, count } = await supabaseServer
      .from('notifications')
      .delete({ count: 'exact' })
      .eq('id', id)
      .eq('receiver_id', user.id)

    if (deleteError) {
      console.error('DELETE notification error:', deleteError.message)
      return NextResponse.json({ error: 'Failed to delete notification' }, { status: 500 })
    }

    // Verify deletion occurred
    if (!count || count === 0) {
      return NextResponse.json({ error: 'Notification not found' }, { status: 404 })
    }

    return NextResponse.json({ success: true, deleted: true, id })
    
  } catch (err) {
    console.error('DELETE notification error:', err.message)
    return NextResponse.json({ 
      error: 'Internal server error',
      message: err instanceof Error ? err.message : String(err)
    }, { status: 500 })
  }
}