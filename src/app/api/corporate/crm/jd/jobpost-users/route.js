import { supabaseServer } from '@/lib/supabase-server'
import { NextResponse } from 'next/server'

// GET - Fetch users with JOBPOST role (same for corporate)
export async function GET(request) {
  try {
    const authHeader = request.headers.get('authorization')
    if (!authHeader) {
      return NextResponse.json({ error: 'No authorization header' }, { status: 401 })
    }

    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authError } = await supabaseServer.auth.getUser(token)
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Fetch all users with their roles
    const { data: users, error } = await supabaseServer
      .from('users')
      .select('user_id, name, email, role')
      .order('name', { ascending: true })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Filter users whose role contains "JOBPOST"
    const jobpostUsers = users.filter(u => {
      const roleString = Array.isArray(u.role) ? u.role.join(' ') : u.role
      return roleString && roleString.toUpperCase().includes('JOBPOST')
    })

    return NextResponse.json(jobpostUsers)
  } catch (error) {
    console.error('Error fetching jobpost users:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
