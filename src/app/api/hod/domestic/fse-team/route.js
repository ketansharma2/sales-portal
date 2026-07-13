import { supabaseServer } from '@/lib/supabase-server'
import { NextResponse } from 'next/server'
import { getUser } from '@/lib/auth-helper';

export async function GET(request) {
  try {
    // Authentication
      const { user, error: authError } = getUser(request);
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user has HOD role
    const { data: userProfile, error: profileError } = await supabaseServer
      .from('users')
      .select('role')
      .eq('user_id', user.id)
      .single()

    if (profileError || !userProfile) {
      return NextResponse.json({ error: 'User profile not found' }, { status: 404 })
    }

    if (!userProfile.role || !userProfile.role.includes('HOD')) {
      return NextResponse.json({ error: 'Access denied. HOD role required.' }, { status: 403 })
    }

    // Fetch FSE team members under this manager
    const { data: team, error: teamError } = await supabaseServer
      .from('users')
      .select('user_id, name, email, role')
      .contains('role', ['FSE'])
      .eq('sector', 'Domestic')
      .order('name')

    if (teamError) {
      console.error('Team fetch error:', teamError)
      return NextResponse.json({
        error: 'Failed to fetch team',
        details: teamError.message
      }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      data: team || [],
      count: team?.length || 0
    })

  } catch (error) {
    console.error('FSE team API error:', error)
    return NextResponse.json({
      error: 'Internal server error',
      details: error.message
    }, { status: 500 })
  }
}