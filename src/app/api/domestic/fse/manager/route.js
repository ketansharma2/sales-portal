import { supabaseServer } from '@/lib/supabase-server'
import { NextResponse } from 'next/server'

export async function GET(request) {
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

    const { data: userData, error: userError } = await supabaseServer
      .from('users')
      .select('manager_id')
      .eq('user_id', currentUserId)
      .single()

    if (userError || !userData?.manager_id) {
      return NextResponse.json({ success: true, data: null })
    }

    const { data: managerData, error: managerError } = await supabaseServer
      .from('users')
      .select('user_id, name, email')
      .eq('user_id', userData.manager_id)
      .single()

    if (managerError) {
      console.error('Fetch manager error:', managerError)
      return NextResponse.json({ error: 'Failed to fetch manager' }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      data: managerData
    })

  } catch (error) {
    console.error('Manager API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}