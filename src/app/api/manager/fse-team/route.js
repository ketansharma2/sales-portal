import { supabaseServer } from '@/lib/supabase-server'
import { NextResponse } from 'next/server'
import { getUserWithProfile } from '@/lib/auth-helper'

export async function GET(request) {
  try {
    // Authentication - user injected by middleware (no auth calls needed!)
    const { user, profile, error: authError } = getUserWithProfile(request);
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user has MANAGER role (from cached profile data)
    if (!profile || !profile.role) {
      return NextResponse.json({ error: 'User profile not found' }, { status: 404 })
    }

    if (!profile.role.includes('MANAGER')) {
      return NextResponse.json({ error: 'Access denied. Manager role required.' }, { status: 403 })
    }

    // Fetch team members under this manager (FSE and LeadGen)
    const { data: team, error: teamError } = await supabaseServer
      .from('users')
      .select('user_id, name, email, role')
      .or('role.cs.{FSE},role.cs.{LEADGEN}')
      .eq('manager_id', user.id)
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