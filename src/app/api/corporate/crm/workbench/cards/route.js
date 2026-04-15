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
    const tlId = searchParams.get('tl_id');
    const recruiterId = searchParams.get('recruiter_id');

    let rcUserIds = [];

    // If recruiter_id is provided, use only that RC
    if (recruiterId) {
      rcUserIds = [recruiterId];
    } 
    // If tl_id is provided, get all RCs under that TL
    else if (tlId) {
      const { data: rcUsersData } = await supabaseServer
        .from('users')
        .select('user_id')
        .eq('sector', 'Corporate')
        .eq('tl_id', tlId)
        .contains('role', ['RC']);
      
      rcUserIds = rcUsersData?.map(u => u.user_id) || [];
    }
    // If neither provided, get all corporate RCs
    else {
      const { data: rcUsersData } = await supabaseServer
        .from('users')
        .select('user_id')
        .eq('sector', 'Corporate')
        .contains('role', ['RC']);
      
      rcUserIds = rcUsersData?.map(u => u.user_id) || [];
    }

    if (rcUserIds.length === 0) {
      return NextResponse.json({
        success: true,
        data: {
          total_cvs: 0,
          total_sti: 0,
          total_conversion: 0,
          total_asset: 0,
          tracker_received: 0,
          tracker_shared: 0
        }
      })
    }

    // 1. Total CVs - from cv_parsing
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

    // 2. Total STI - from corporate_workbench_sti
    let stiQuery = supabaseServer
      .from('corporate_workbench_sti')
      .select('advance_sti')
      .in('user_id', rcUserIds)

    if (fromDate && toDate) {
      stiQuery = stiQuery.gte('date', fromDate).lte('date', toDate)
    } else if (fromDate) {
      stiQuery = stiQuery.eq('date', fromDate)
    }

    const { data: stiData, error: stiError } = await stiQuery
    const totalSti = stiData?.reduce((sum, row) => sum + (row.advance_sti || 0), 0) || 0

    // 3. Total Conversion - from candidates_conversation where candidate_status = 'Conversion'
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

    // 4. Total Asset - from candidates_conversation where candidate_status = 'Asset'
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

    // 5. Tracker Received - from candidates_conversation where user_id is in rcUserIds AND sent_to_crm = current logged in user
    let trackerReceivedQuery = supabaseServer
      .from('candidates_conversation')
      .select('conversation_id', { count: 'exact' })
      .in('user_id', rcUserIds)
      .eq('sent_to_crm', currentUserId)

    if (fromDate && toDate) {
      trackerReceivedQuery = trackerReceivedQuery.gte('crm_sent_date', fromDate).lte('crm_sent_date', toDate)
    } else if (fromDate) {
      trackerReceivedQuery = trackerReceivedQuery.eq('crm_sent_date', fromDate)
    }

    const { count: trackerReceived, error: trackerReceivedError } = await trackerReceivedQuery

    // 6. Tracker Shared (Client) - from candidates_conversation where sent_to_client is not null
    let trackerSharedQuery = supabaseServer
      .from('candidates_conversation')
      .select('conversation_id', { count: 'exact' })
      .in('user_id', rcUserIds)
      .not('sent_to_client', 'is', null)

    if (fromDate && toDate) {
      trackerSharedQuery = trackerSharedQuery.gte('sent_to_client_date', fromDate).lte('sent_to_client_date', toDate)
    } else if (fromDate) {
      trackerSharedQuery = trackerSharedQuery.eq('sent_to_client_date', fromDate)
    }

    const { count: trackerShared, error: trackerSharedError } = await trackerSharedQuery

    return NextResponse.json({
      success: true,
      data: {
        total_cvs: totalCvs || 0,
        total_sti: totalSti,
        total_conversion: totalConversion || 0,
        total_asset: totalAsset || 0,
        tracker_received: trackerReceived || 0,
        tracker_shared: trackerShared || 0
      }
    })

  } catch (error) {
    console.error('CRM Cards API error:', error)
    return NextResponse.json({
      error: 'Internal server error',
      details: error.message
    }, { status: 500 })
  }
}
