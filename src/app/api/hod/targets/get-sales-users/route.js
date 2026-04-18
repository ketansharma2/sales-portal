import { supabaseServer } from '@/lib/supabase-server'
import { NextResponse } from 'next/server'

export async function GET(request) {
  try {
    // 🔐 Auth check
    const authHeader = request.headers.get('authorization')
    if (!authHeader) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const token = authHeader.replace('Bearer ', '')

    const { data: { user }, error: authError } =
      await supabaseServer.auth.getUser(token)

    if (authError || !user) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }

    // 📦 Fetch only HOD or Manager
    const { data: users, error } = await supabaseServer
      .from('users')
      .select('user_id, name, role, sector')
      .or('role.cs.{HOD},role.cs.{MANAGER}')
      .order('name', { ascending: true })

    if (error) {
      console.error('Users fetch error:', error)
      return NextResponse.json(
        {
          error: 'Failed to fetch users',
          details: error.message,
        },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      data: users,
    })

  } catch (error) {
    console.error('Users API error:', error)

    return NextResponse.json(
      {
        error: 'Internal server error',
        details: error.message,
      },
      { status: 500 }
    )
  }
}