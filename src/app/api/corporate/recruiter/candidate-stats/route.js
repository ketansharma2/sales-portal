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

    const currentUserId = user.user_id || user.id
    const { searchParams } = new URL(request.url)
    const fromDate = searchParams.get('fromDate')
    const toDate = searchParams.get('toDate')

    // Build base query for candidates_conversation
    let query = supabaseServer
      .from('candidates_conversation')
      .select('candidate_status', { count: 'exact', head: true })
      .eq('user_id', currentUserId)

    // Add date range filter if provided
    if (fromDate && toDate) {
      query = query.gte('calling_date', fromDate).lte('calling_date', toDate)
    }

    // Get all rows for this date range (no status filter for tracker sent count)
    const { count: trackerSent, error: trackerError } = await query

    if (trackerError) {
      console.error('Fetch tracker sent error:', trackerError)
    }

    // Get count for Asset status
    let assetQuery = supabaseServer
      .from('candidates_conversation')
      .select('candidate_status', { count: 'exact', head: true })
      .eq('user_id', currentUserId)
      .eq('candidate_status', 'Asset')

    if (fromDate && toDate) {
      assetQuery = assetQuery.gte('calling_date', fromDate).lte('calling_date', toDate)
    }

    const { count: totalAssets, error: assetError } = await assetQuery

    if (assetError) {
      console.error('Fetch total assets error:', assetError)
    }

    // Get count for Conversion status
    let conversionQuery = supabaseServer
      .from('candidates_conversation')
      .select('candidate_status', { count: 'exact', head: true })
      .eq('user_id', currentUserId)
      .eq('candidate_status', 'Conversion')

    if (fromDate && toDate) {
      conversionQuery = conversionQuery.gte('calling_date', fromDate).lte('calling_date', toDate)
    }

    const { count: conversions, error: conversionError } = await conversionQuery

    if (conversionError) {
      console.error('Fetch conversions error:', conversionError)
    }

    // Get count for JD Match status
    let jdMatchQuery = supabaseServer
      .from('candidates_conversation')
      .select('cv_status', { count: 'exact', head: true })
      .eq('user_id', currentUserId)
      .eq('cv_status', 'JD Match')

    if (fromDate && toDate) {
      jdMatchQuery = jdMatchQuery.gte('calling_date', fromDate).lte('calling_date', toDate)
    }

    const { count: jdMatchCount, error: jdMatchError } = await jdMatchQuery

    if (jdMatchError) {
      console.error('Fetch JD Match error:', jdMatchError)
    }

    // Fetch detailed data for the table
    let detailsQuery = supabaseServer
      .from('candidates_conversation')
      .select('conversation_id, calling_date, cv_status, req_id, parsing_id')
      .eq('user_id', currentUserId)

    if (fromDate && toDate) {
      detailsQuery = detailsQuery.gte('calling_date', fromDate).lte('calling_date', toDate)
    }

    const { data: conversationData, error: detailsError } = await detailsQuery

    if (detailsError) {
      console.error('Fetch details error:', detailsError)
    }

    // Get parsing IDs and req IDs
    const parsingIds = [...new Set(conversationData?.map(c => c.parsing_id).filter(Boolean) || [])]
    const reqIds = [...new Set(conversationData?.map(c => c.req_id).filter(Boolean) || [])]

    // Fetch candidate names from cv_parsing
    let cvParsingMap = new Map()
    if (parsingIds.length > 0) {
      const { data: cvData } = await supabaseServer
        .from('cv_parsing')
        .select('id, name, cv_url')
        .in('id', parsingIds)
      if (cvData) {
        cvData.forEach(c => cvParsingMap.set(c.id, c))
      }
    }

    // Fetch job titles from corporate_crm_reqs
    let reqsMap = new Map()
    if (reqIds.length > 0) {
      const { data: reqData } = await supabaseServer
        .from('corporate_crm_reqs')
        .select('req_id, job_title')
        .in('req_id', reqIds)
      if (reqData) {
        reqData.forEach(r => reqsMap.set(r.req_id, r))
      }
    }

    // Transform detailed data
    const trackerDetails = conversationData?.map((item, index) => {
      const cvData = cvParsingMap.get(item.parsing_id)
      const reqData = reqsMap.get(item.req_id)
      return {
        sno: index + 1,
        date: item.calling_date,
        profile: reqData?.job_title || '-',
        candidateName: cvData?.name || '-',
        cvUrl: cvData?.cv_url || '',
        cvStatus: item.cv_status || '-'
      }
    }) || []

    const accuracy = trackerSent > 0 ? Math.round((jdMatchCount / trackerSent) * 100) : 0

    return NextResponse.json({ 
      success: true, 
      trackerSent: trackerSent || 0,
      totalAssets: totalAssets || 0,
      conversions: conversions || 0,
      accuracy: accuracy,
      jdMatchCount: jdMatchCount || 0,
      trackerDetails: trackerDetails
    })

  } catch (error) {
    console.error('Server error:', error)
    return NextResponse.json({ error: 'Internal server error', details: error.message }, { status: 500 })
  }
}