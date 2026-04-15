import { supabaseServer } from '@/lib/supabase-server'
import { NextResponse } from 'next/server'

export async function GET(request) {
  try {
    const { data: users, error } = await supabaseServer
      .from('users')
      .select('user_id, name, email, role, sector, manager_id, tl_id')
      .order('name', { ascending: true })

    if (error) {
      console.error('Fetch users error:', error)
      return NextResponse.json({
        error: 'Failed to fetch users',
        details: error.message
      }, { status: 500 })
    }

    const managerIds = users.map(u => u.manager_id).filter(Boolean)
    const tlIds = users.map(u => u.tl_id).filter(Boolean)
    const allUserIds = [...new Set([...managerIds, ...tlIds])]
    
    let managerTlNames = {}
    if (allUserIds.length > 0) {
      const { data: managerTlUsers } = await supabaseServer
        .from('users')
        .select('user_id, name')
        .in('user_id', allUserIds)
      
      if (managerTlUsers) {
        managerTlUsers.forEach(u => {
          managerTlNames[u.user_id] = u.name
        })
      }
    }

    const transformedData = users.map(u => ({
      user_id: u.user_id,
      name: u.name,
      email: u.email,
      role: u.role,
      sector: u.sector,
      manager_id: u.manager_id,
      manager_name: managerTlNames[u.manager_id] || null,
      tl_id: u.tl_id,
      tl_name: managerTlNames[u.tl_id] || null
    }))

    return NextResponse.json({
      success: true,
      data: transformedData,
      count: transformedData.length
    })

  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({
      error: 'Internal server error',
      details: error.message
    }, { status: 500 })
  }
}

export async function POST(request) {
  try {
    // Get request body
    const body = await request.json()
    const { name, email, password, roles: roleArr, sector, manager: managerId, tl: tlId } = body

    // Validate required fields
    if (!name || !email || !password || !roleArr || roleArr.length === 0) {
      return NextResponse.json({
        error: 'Missing required fields: name, email, password, roles'
      }, { status: 400 })
    }

    // Create user in Supabase Auth
    const { data: authData, error: authError } = await supabaseServer.auth.admin.createUser({
      email: email,
      password: password,
      user_metadata: {
        name: name,
        role: roleArr
      },
      email_confirm: true
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
        role: roleArr,
        sector: sector || null,
        manager_id: managerId || null,
        tl_id: tlId || null
      })
      .select()
      .single()

    if (profileError) {
      console.error('Profile creation error:', profileError)
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
        role: roleArr,
        sector: sector,
        manager_id: managerId,
        tl_id: tlId,
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

export async function PUT(request) {
  try {
    const authHeader = request.headers.get('authorization')
    if (!authHeader) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const token = authHeader.replace('Bearer ', '')
    const { data: { user: authUser }, error: authError } = await supabaseServer.auth.getUser(token)
    if (authError || !authUser) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }

    const body = await request.json()
    const { user_id, name, email, sector, role, manager_id, tl_id } = body

    if (!user_id) {
      return NextResponse.json({ error: 'user_id is required' }, { status: 400 })
    }

    const updateData = {}
    if (name) updateData.name = name
    if (email) updateData.email = email
    if (sector) updateData.sector = sector
    if (role) updateData.role = role
    if (manager_id !== undefined) updateData.manager_id = manager_id
    if (tl_id !== undefined) updateData.tl_id = tl_id

    const { error: updateError } = await supabaseServer
      .from('users')
      .update(updateData)
      .eq('user_id', user_id)

    if (updateError) {
      console.error('Update user error:', updateError)
      return NextResponse.json({
        error: 'Failed to update user',
        details: updateError.message
      }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: 'User updated successfully'
    })

  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({
      error: 'Internal server error',
      details: error.message
    }, { status: 500 })
  }
}