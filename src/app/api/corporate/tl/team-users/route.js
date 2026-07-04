import { supabaseServer } from '@/lib/supabase-server'
import { NextResponse } from 'next/server'
import { getUser } from '@/lib/auth-helper';

export async function GET(request) {
  try {
      const { user, error: authError } = getUser(request);
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: users, error: usersError } = await supabaseServer
      .from('users')
      .select('user_id, name, role, sector')
      .eq('sector', 'Corporate')

    if (usersError) {
      console.error('Users fetch error:', usersError)
      return NextResponse.json({ error: 'Failed to fetch users', details: usersError.message }, { status: 500 })
    }

    const filteredUsers = (users || []).filter(u => {
      const roleArray = Array.isArray(u.role) ? u.role : [u.role]
      const roleStr = roleArray.join(' ').toUpperCase()
      return roleStr.includes('RC')
    })

    const transformedUsers = filteredUsers.map(u => ({
      user_id: u.user_id,
      name: u.name,
      role: u.role,
      sector: u.sector
    }))

    return NextResponse.json({ success: true, data: transformedUsers })

  } catch (error) {
    console.error('Users GET error:', error)
    return NextResponse.json({ error: 'Internal server error', details: error.message }, { status: 500 })
  }
}