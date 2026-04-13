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
    
    const { data: currentUserData, error: userError } = await supabaseServer
      .from('users')
      .select('user_id, name, email, role')
      .eq('user_id', currentUserId)
      .single()
    
    const currentUserRole = currentUserData?.role || []
    const isCurrentUserRC = currentUserRole.includes('RC')
    
    let rcUsers = []
    const { data: rcUsersData, error: fetchError } = await supabaseServer
      .from('users')
      .select('user_id, name, email, role')
      .eq('sector', 'Domestic')
      .eq('tl_id', currentUserId)
      .contains('role', ['RC'])

    if (fetchError) {
      console.error('Fetch RC users error:', fetchError)
      return NextResponse.json({
        error: 'Failed to fetch RC users',
        details: fetchError.message
      }, { status: 500 })
    }
    
    rcUsers = rcUsersData || []
    
    if (isCurrentUserRC) {
      const currentUserAlreadyInList = rcUsers.some(u => u.user_id === currentUserId)
      if (!currentUserAlreadyInList) {
        rcUsers.unshift({
          user_id: currentUserId,
          name: currentUserData?.name || user.email || 'You',
          email: user.email,
          role: currentUserRole
        })
      }
    }

    return NextResponse.json({
      success: true,
      data: rcUsers || []
    })

  } catch (error) {
    console.error('Fetch RC users API error:', error)
    return NextResponse.json({
      error: 'Internal server error',
      details: error.message
    }, { status: 500 })
  }
}