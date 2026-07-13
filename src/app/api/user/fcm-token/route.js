import { supabaseServer } from '@/lib/supabase-server'
import { NextResponse } from 'next/server'
import { getUser } from '@/lib/auth-helper'

export async function POST(request) {
  console.log('Received request to update FCM token', request);
     const { user, error: authError } = getUser(request)
    console.log('Authenticated user:', authError, user);
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

  const { fcm_token } = await request.json()
  await supabaseServer.from('users').update({ fcm_token }).eq('user_id', user.id)
  return NextResponse.json({ success: true })
}