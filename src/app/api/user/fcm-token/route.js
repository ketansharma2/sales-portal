import { supabaseServer } from '@/lib/supabase-server'
import { NextResponse } from 'next/server'

export async function POST(request) {
  const authHeader = request.headers.get('authorization')
  console.log('Received FCM token update request with auth header:', authHeader)
  if (!authHeader) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const token = authHeader.replace('Bearer ', '')
  const { data: { user }, error } = await supabaseServer.auth.getUser(token)
  if (error || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { fcm_token } = await request.json()
  await supabaseServer.from('users').update({ fcm_token }).eq('user_id', user.id)
  return NextResponse.json({ success: true })
}