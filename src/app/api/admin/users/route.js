import { supabaseServer } from '@/lib/supabase-server'
import { NextResponse } from 'next/server'

export async function POST(request) {
  try {
    // Get request body
    const body = await request.json()
    const { name, email, password, role, manager_id, hod_id } = body

    // Validate required fields
    if (!name || !email || !password || !role) {
      return NextResponse.json({
        error: 'Missing required fields: name, email, password, role'
      }, { status: 400 })
    }

    // Validate role
    const validRoles = ['FSE', 'MANAGER', 'HOD', 'ADMIN']
    if (!validRoles.includes(role)) {
      return NextResponse.json({
        error: `Invalid role. Must be one of: ${validRoles.join(', ')}`
      }, { status: 400 })
    }

    // Create user in Supabase Auth
    const { data: authData, error: authError } = await supabaseServer.auth.admin.createUser({
      email: email,
      password: password,
      user_metadata: {
        name: name,
        role: [role]
      },
      email_confirm: true // Auto-confirm email for testing
    })

    if (authError) {
      console.error('Auth creation error:', authError)
      return NextResponse.json({
        error: 'Failed to create user account',
        details: authError.message
      }, { status: 500 })
    }

    // Create user profile in users table
    const { data: profileData, error: profileError } = await supabaseServer
      .from('users')
      .insert({
        user_id: authData.user.id,
        name: name,
        email: email,
        role: [role],
        manager_id: manager_id || null,
        hod_id: hod_id || null
      })
      .select()
      .single()

    if (profileError) {
      console.error('Profile creation error:', profileError)
      // If profile creation fails, we should clean up the auth user
      // But for simplicity, we'll just return the error
      return NextResponse.json({
        error: 'User account created but profile creation failed',
        details: profileError.message,
        auth_user: authData.user
      }, { status: 500 })
    }

    // Return success response
    return NextResponse.json({
      success: true,
      message: 'User created successfully',
      data: {
        user_id: authData.user.id,
        name: name,
        email: email,
        role: [role],
        manager_id: manager_id,
        hod_id: hod_id,
        created_at: profileData.created_at
      }
    }, { status: 201 })

  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({
      error: 'Internal server error',
      details: error.message
    }, { status: 500 })
  }
}

export async function GET(request) {
  try {
    // Get all users with their profiles
    const { data, error } = await supabaseServer
      .from('users')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Fetch users error:', error)
      return NextResponse.json({
        error: 'Failed to fetch users',
        details: error.message
      }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      data: data,
      count: data.length
    })

  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({
      error: 'Internal server error',
      details: error.message
    }, { status: 500 })
  }
}