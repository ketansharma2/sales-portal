import { supabaseServer } from '@/lib/supabase-server';
import { NextResponse } from 'next/server';

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

    const { searchParams } = new URL(request.url);
    const fromDate = searchParams.get('fromDate');
    const toDate = searchParams.get('toDate');
    const recruiterId = searchParams.get('recruiter_id');

    const { data: currentUserData } = await supabaseServer
      .from('users')
      .select('user_id, name, email, role')
      .eq('user_id', currentUserId)
      .single()
    
    const currentUserRole = currentUserData?.role || []
    const isCurrentUserRC = currentUserRole.includes('RC')

    let rcUsersQuery = supabaseServer
      .from('users')
      .select('user_id, name, email, role')
      .eq('sector', 'Domestic')
      .eq('tl_id', currentUserId)
      .contains('role', ['RC'])

    const { data: rcUsersData } = await rcUsersQuery
    let rcUserIds = rcUsersData?.map(u => u.user_id) || []
    
    if (isCurrentUserRC) {
      const currentUserAlreadyInList = rcUserIds.some(id => id === currentUserId)
      if (!currentUserAlreadyInList) {
        rcUserIds.unshift(currentUserId)
      }
    }

    if (recruiterId) {
      rcUserIds = [recruiterId]
    }

    if (rcUserIds.length === 0) {
      return NextResponse.json({
        success: true,
        total_sti: 0
      })
    }

    let query = supabaseServer
      .from('domestic_workbench_sti')
      .select('advance_sti')
      .in('user_id', rcUserIds)

    if (fromDate && toDate) {
      query = query.gte('date', fromDate).lte('date', toDate)
    } else if (fromDate) {
      query = query.eq('date', fromDate)
    }

    const { data, error } = await query

    if (error) {
      console.error('Fetch STI error:', error)
      return NextResponse.json({ error: 'Failed to fetch STI data', details: error.message }, { status: 500 })
    }

    const totalSti = data?.reduce((sum, row) => sum + (row.advance_sti || 0), 0) || 0

    return NextResponse.json({
      success: true,
      total_sti: totalSti
    })

  } catch (error) {
    console.error('STI API error:', error)
    return NextResponse.json({
      error: 'Internal server error',
      details: error.message
    }, { status: 500 })
  }
}