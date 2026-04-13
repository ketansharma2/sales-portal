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

    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('user_id')

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 })
    }

    const { data: userData, error: userError } = await supabaseServer
      .from('users')
      .select('tl_id')
      .eq('user_id', userId)
      .single()

    if (userError) {
      console.error('Fetch user error:', userError)
      return NextResponse.json({ error: 'Failed to fetch user data' }, { status: 500 })
    }

    if (!userData?.tl_id) {
      return NextResponse.json({ 
        success: true, 
        data: null,
        message: 'No TL assigned'
      })
    }

    const { data: tlData, error: tlError } = await supabaseServer
      .from('users')
      .select('user_id, name, email')
      .eq('user_id', userData.tl_id)
      .single()

    if (tlError) {
      console.error('Fetch TL error:', tlError)
      return NextResponse.json({ error: 'Failed to fetch TL data' }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      data: tlData
    })

  } catch (error) {
    console.error('Get TL API error:', error)
    return NextResponse.json({
      error: 'Internal server error',
      details: error.message
    }, { status: 500 })
  }
}