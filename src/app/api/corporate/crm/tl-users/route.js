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

    // Fetch users where role array contains 'TL' AND sector = 'Corporate'
    const { data: users, error: fetchError } = await supabaseServer
      .from('users')
      .select('user_id, name')
      .contains('role', ['TL'])
      .eq('sector', 'Corporate')
      .order('name', { ascending: true })

    if (fetchError) {
      console.error('Fetch TL users error:', fetchError)
      return NextResponse.json({
        error: 'Failed to fetch TL users',
        details: fetchError.message
      }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      data: users || []
    })

  } catch (error) {
    console.error('Fetch TL users API error:', error)
    return NextResponse.json({
      error: 'Internal server error',
      details: error.message
    }, { status: 500 })
  }
}
