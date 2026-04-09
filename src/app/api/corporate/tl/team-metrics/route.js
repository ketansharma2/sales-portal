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

    // First check current user's role from users table
    const { data: currentUserData } = await supabaseServer
      .from('users')
      .select('user_id, name, email, role')
      .eq('user_id', currentUserId)
      .single()
    
    const currentUserRole = currentUserData?.role || []
    const isCurrentUserRC = currentUserRole.includes('RC')

    // Get RC users under this TL
    let rcUsersQuery = supabaseServer
      .from('users')
      .select('user_id, name, email, role')
      .eq('sector', 'Corporate')
      .eq('tl_id', currentUserId)
      .contains('role', ['RC'])

    const { data: rcUsersData } = await rcUsersQuery
    let rcUserIds = rcUsersData?.map(u => u.user_id) || []
    
    // If current user is RC, add them to the list
    if (isCurrentUserRC) {
      const currentUserAlreadyInList = rcUserIds.some(id => id === currentUserId)
      if (!currentUserAlreadyInList) {
        rcUserIds.unshift(currentUserId)
      }
    }

    // If specific recruiter is selected, use only that user
    if (recruiterId) {
      rcUserIds = [recruiterId]
    }

    if (rcUserIds.length === 0) {
      return NextResponse.json({
        success: true,
        data: {
          total_cvs: 0,
          total_conversion: 0,
          total_asset: 0,
          total_trackers: 0
        }
      })
    }

    // Build date filter
    let dateFilter = {}
    if (fromDate && toDate) {
      dateFilter = {
        portal_date: {
          gte: fromDate,
          lte: toDate
        }
      }
    } else if (fromDate) {
      dateFilter = {
        portal_date: fromDate
      }
    }

    // 1. Total CVs - from cv_parsing for selected user_ids
    let cvQuery = supabaseServer
      .from('cv_parsing')
      .select('id', { count: 'exact' })
      .in('user_id', rcUserIds)

    if (fromDate && toDate) {
      cvQuery = cvQuery.gte('portal_date', fromDate).lte('portal_date', toDate)
    } else if (fromDate) {
      cvQuery = cvQuery.eq('portal_date', fromDate)
    }

    const { count: totalCvs, error: cvError } = await cvQuery

    // 2. Total Conversion - from candidates_conversation where candidate_status = 'Conversion'
    let conversionQuery = supabaseServer
      .from('candidates_conversation')
      .select('conversation_id', { count: 'exact' })
      .in('user_id', rcUserIds)
      .eq('candidate_status', 'Conversion')

    if (fromDate && toDate) {
      conversionQuery = conversionQuery.gte('calling_date', fromDate).lte('calling_date', toDate)
    } else if (fromDate) {
      conversionQuery = conversionQuery.eq('calling_date', fromDate)
    }

    const { count: totalConversion, error: conversionError } = await conversionQuery

    // 3. Total Asset - from candidates_conversation where candidate_status = 'Asset'
    let assetQuery = supabaseServer
      .from('candidates_conversation')
      .select('conversation_id', { count: 'exact' })
      .in('user_id', rcUserIds)
      .eq('candidate_status', 'Asset')

    if (fromDate && toDate) {
      assetQuery = assetQuery.gte('calling_date', fromDate).lte('calling_date', toDate)
    } else if (fromDate) {
      assetQuery = assetQuery.eq('calling_date', fromDate)
    }

    const { count: totalAsset, error: assetError } = await assetQuery

    // 4. Total Trackers Sent - from candidates_conversation sent to TL
    let trackersQuery = supabaseServer
      .from('candidates_conversation')
      .select('conversation_id', { count: 'exact' })
      .in('user_id', rcUserIds)
      .not('sent_to_tl', 'is', null)

    if (fromDate && toDate) {
      trackersQuery = trackersQuery.gte('sent_date', fromDate).lte('sent_date', toDate)
    } else if (fromDate) {
      trackersQuery = trackersQuery.eq('sent_date', fromDate)
    }

    const { count: totalTrackers, error: trackersError } = await trackersQuery

    return NextResponse.json({
      success: true,
      data: {
        total_cvs: totalCvs || 0,
        total_conversion: totalConversion || 0,
        total_asset: totalAsset || 0,
        total_trackers: totalTrackers || 0
      }
    })

  } catch (error) {
    console.error('Team metrics API error:', error)
    return NextResponse.json({
      error: 'Internal server error',
      details: error.message
    }, { status: 500 })
  }
}
