import { supabaseServer } from '@/lib/supabase-server'
import { NextResponse } from 'next/server'

export async function POST(request) {
  try {
    const { email, password } = await request.json()

    // Validate required fields
    if (!email || !password) {
      return NextResponse.json({
        error: 'Email and password are required'
      }, { status: 400 })
    }

    // Attempt login with Supabase Auth
    const { data: authData, error: authError } = await supabaseServer.auth.signInWithPassword({
      email: email,
      password: password
    })

    if (authError) {
      console.error('Auth error:', authError)
      return NextResponse.json({
        error: 'Invalid email or password'
      }, { status: 401 })
    }

    // Fetch user profile from users table
    const { data: profileData, error: profileError } = await supabaseServer
      .from('users')
      .select('user_id, name, email, role, manager_id, hod_id')
      .eq('user_id', authData.user.id)
      .single()

    if (profileError) {
      console.error('Profile fetch error:', profileError)
      return NextResponse.json({
        error: 'User profile not found'
      }, { status: 404 })
    }

    // Check roles
    if (!profileData.role || profileData.role.length === 0) {
      return NextResponse.json({
        error: 'No roles assigned to user'
      }, { status: 403 })
    }

    let responseData = {
      success: true,
      message: 'Login successful',
      user: {
        user_id: profileData.user_id,
        name: profileData.name,
        email: profileData.email,
        manager_id: profileData.manager_id,
        hod_id: profileData.hod_id
      },
      session: {
        access_token: authData.session.access_token,
        refresh_token: authData.session.refresh_token,
        expires_at: authData.session.expires_at
      }
    }

    if (profileData.role.length === 1) {
      // Single role: set current_role and proceed
      responseData.user.current_role = profileData.role[0]
      responseData.user.role = profileData.role // keep for compatibility
    } else {
      // Multiple roles: require selection
      responseData.requiresSelection = true
      responseData.availableRoles = profileData.role
      responseData.user.role = profileData.role
    }

    return NextResponse.json(responseData)

  } catch (error) {
    console.error('Login API error:', error)
    return NextResponse.json({
      error: 'Internal server error',
      details: error.message
    }, { status: 500 })
  }
}