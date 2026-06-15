import { supabaseServer } from '@/lib/supabase-server'
import { fcm } from '@/lib/firebase-admin'
import { NextResponse } from 'next/server'

// Helper: send FCM push to a single user
async function sendFCM(receiverId, title, message) {
  try {
    const { data: user } = await supabaseServer
      .from('users')
      .select('fcm_token')
      .eq('user_id', receiverId)
      .single()
    if (user?.fcm_token) {
      await fcm.send({
        token: user.fcm_token,
        notification: { title, body: message || '' },
        webpush: { headers: { Urgency: 'high' } },
      })
    }
  } catch (err) {
    console.error('FCM send error:', err)
    // Don't rethrow – FCM failure shouldn't break the notification creation
  }
}

// GET /api/notifications
export async function GET(request) {
  try {
    const authHeader = request.headers.get('authorization')
    if (!authHeader) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error } = await supabaseServer.auth.getUser(token)
    if (error || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const url = new URL(request.url)
    const limit = parseInt(url.searchParams.get('limit') || '50')
    const offset = parseInt(url.searchParams.get('offset') || '0')
    const unreadOnly = url.searchParams.get('unreadOnly') === 'true'

    let query = supabaseServer
      .from('notifications')
      .select('*', { count: 'exact' })
      .eq('receiver_id', user.id)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (unreadOnly) query = query.eq('is_read', false)

    const { data, error: dbError, count } = await query
    if (dbError) throw new Error(dbError.message)
      
     console.log(`Fetched notifications for user ${user.id}:`, { count, limit, offset, unreadOnly })
    return NextResponse.json({ notifications: data, total: count })
  } catch (err) {
    console.error('GET /api/notifications error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST /api/notifications – Create P2P or broadcast
export async function POST(request) {
  try {
    const authHeader = request.headers.get('authorization')
    if (!authHeader) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error } = await supabaseServer.auth.getUser(token)
    if (error || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    // Determine if sender has broadcast rights
    const { data: senderProfile } = await supabaseServer
      .from('users')
      .select('role')
      .eq('user_id', user.id)
      .single()
    const isBroadcaster = ['ADMIN'].includes(senderProfile?.role)

    const body = await request.json()
    const { receiverId, receiverIds, role, title, message, entityType, entityId } = body

    if (!title) return NextResponse.json({ error: 'Missing title' }, { status: 400 })

    // P2P
    if (receiverId) {
      console.log('Creating P2P notification from', user.id, 'to', receiverId);
      // if (receiverId !== user.id ) {
      //   return NextResponse.json({ error: 'Forbidden: cannot send to other users' }, { status: 403 })
      // }
      const { data: notif, error: insertError } = await supabaseServer
        .from('notifications')
        .insert({
          sender_id: user.id,
          receiver_id: receiverId,
          type: 'p2p',
          title,
          message,
          entity_type: entityType,
          entity_id: entityId,
        })
        .select()
        .single()
      if (insertError) throw new Error(insertError.message)
      await sendFCM(receiverId, title, message)
      return NextResponse.json(notif, { status: 201 })
    }

    // Broadcast to explicit list of users
    if (receiverIds && Array.isArray(receiverIds)) {
      if (!isBroadcaster) return NextResponse.json({ error: 'Forbidden: broadcast requires admin' }, { status: 403 })
      const notifications = receiverIds.map(rid => ({
        sender_id: user.id,
        receiver_id: rid,
        type: 'broadcast',
        title,
        message,
        entity_type: entityType,
        entity_id: entityId,
      }))
      const { data: inserted, error: insertError } = await supabaseServer
        .from('notifications')
        .insert(notifications)
        .select()
      if (insertError) throw new Error(insertError.message)
      await Promise.all(receiverIds.map(rid => sendFCM(rid, title, message)))
      return NextResponse.json(inserted, { status: 201 })
    }

    // Broadcast to a role (e.g., 'crm', 'admin', 'fse')
    if (role) {
      if (!isBroadcaster) return NextResponse.json({ error: 'Forbidden: broadcast requires admin' }, { status: 403 })
      const { data: usersWithRole, error: roleError } = await supabaseServer
        .from('users')
        .select('user_id')
        .eq('role', role)
      if (roleError) throw new Error(roleError.message)
      if (!usersWithRole?.length) return NextResponse.json([], { status: 200 })
      const userIds = usersWithRole.map(u => u.user_id)
      const notifications = userIds.map(rid => ({
        sender_id: user.id,
        receiver_id: rid,
        type: 'broadcast',
        title,
        message,
        entity_type: entityType,
        entity_id: entityId,
      }))
      const { data: inserted, error: insertError } = await supabaseServer
        .from('notifications')
        .insert(notifications)
        .select()
      if (insertError) throw new Error(insertError.message)
      await Promise.all(userIds.map(rid => sendFCM(rid, title, message)))
      return NextResponse.json(inserted, { status: 201 })
    }

    return NextResponse.json({ error: 'No target specified (receiverId, receiverIds, or role required)' }, { status: 400 })
  } catch (err) {
    console.error('POST /api/notifications error:', err)

  return NextResponse.json(
    {
      error: 'Internal server error',
      details: err instanceof Error ? err.message : String(err),
    },
    { status: 500 }
  );  }
}