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

    // Get query parameters
    const { searchParams } = new URL(request.url)
    const fromDate = searchParams.get('fromDate')
    const toDate = searchParams.get('toDate')

    // Build query
    let query = supabaseServer
      .from('domestic_crm_conversation')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)

    // Apply date filters if provided
    if (fromDate) {
      query = query.gte('date', fromDate)
    }
    if (toDate) {
      query = query.lte('date', toDate)
    }

    const { count, error: countError } = await query

    if (countError) {
      console.error('Count calls made error:', countError)
      return NextResponse.json({
        error: 'Failed to count calls',
        details: countError.message
      }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      data: {
        callsMade: count || 0
      }
    })

  } catch (error) {
    console.error('CRM calls made API error:', error)
    return NextResponse.json({
      error: 'Internal server error',
      details: error.message
    }, { status: 500 })
  }
}
