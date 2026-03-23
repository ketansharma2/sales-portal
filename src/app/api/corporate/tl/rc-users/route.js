import { supabaseServer } from '@/lib/supabase-server'
import { NextResponse } from 'next/server'

export async function GET(request) {
  try {
    // Authentication
    const authHeader = request.headers.get('authorization')
    if (!authHeader) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authError } = await supabaseServer.auth.getUser(token)
    if (authError || !user) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }

    // Get current user's ID
    const currentUserId = user.user_id || user.id

    // Fetch RC users filtered by sector, tl_id, and role
    const { data: rcUsers, error: fetchError } = await supabaseServer
      .from('users')
      .select('user_id, name, email, role')
      .eq('sector', 'Corporate')
      .eq('tl_id', currentUserId)
      .contains('role', ['RC'])

    if (fetchError) {
      console.error('Fetch RC users error:', fetchError)
      return NextResponse.json({
        error: 'Failed to fetch RC users',
        details: fetchError.message
      }, { status: 500 })
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
