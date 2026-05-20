import { supabaseServer } from '@/lib/supabase-server';
import { NextResponse } from 'next/server';

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

    // Get parameters from frontend
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('rc_id')  // RC user_id from frontend
    const fromDate = searchParams.get('from')
    const toDate = searchParams.get('to')

    // Build query - if userId provided, filter by it, otherwise get ALL
    let query = supabaseServer
      .from('cv_parsing')
      .select('*', { count: 'exact', head: true })

    // Only add user_id filter if provided
    if (userId) {
      query = query.eq('user_id', userId)
    }

    // Add date range filter if provided
    if (fromDate && toDate) {
      query = query.gte('portal_date', fromDate).lte('portal_date', toDate)
    } else if (fromDate) {
      query = query.gte('portal_date', fromDate)
    } else if (toDate) {
      query = query.lte('portal_date', toDate)
    }

    const { count, error } = await query

    if (error) {
      console.error('Count CVs error:', error)
      return NextResponse.json({ error: 'Failed to count CVs', details: error.message }, { status: 500 })
    }

    return NextResponse.json({ 
      success: true, 
      data: {
        cvParsed: count || 0
      }
    })

  } catch (error) {
    console.error('Server error:', error)
    return NextResponse.json({ error: 'Internal server error', details: error.message }, { status: 500 })
  }
}