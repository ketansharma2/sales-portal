import { supabaseServer } from '@/lib/supabase-server';
import { NextResponse } from 'next/server';
import { getUser } from '@/lib/auth-helper';

export async function GET(request) {
  try {
    // Authentication
      const { user, error: authError } = getUser(request);
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const currentUserId = user.user_id || user.id
    const { searchParams } = new URL(request.url)
    const fromDate = searchParams.get('fromDate')
    const toDate = searchParams.get('toDate')

    // Build query with date filter
    let query = supabaseServer
      .from('cv_parsing')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', currentUserId)

    // Add date range filter if provided
    if (fromDate && toDate) {
      query = query.gte('portal_date', fromDate).lte('portal_date', toDate)
    }

    const { count, error } = await query

    if (error) {
      console.error('Count CVs error:', error)
      return NextResponse.json({ error: 'Failed to count CVs', details: error.message }, { status: 500 })
    }

    return NextResponse.json({ 
      success: true, 
      totalCvs: count || 0
    })

  } catch (error) {
    console.error('Server error:', error)
    return NextResponse.json({ error: 'Internal server error', details: error.message }, { status: 500 })
  }
}