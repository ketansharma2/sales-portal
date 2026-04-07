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

    // Get count for sent to TL
    let tlQuery = supabaseServer
      .from('candidates_conversation')
      .select('sent_to_tl', { count: 'exact', head: true })
      .eq('user_id', currentUserId)
      .not('sent_to_tl', 'is', null)

    if (fromDate && toDate) {
      tlQuery = tlQuery.gte('calling_date', fromDate).lte('calling_date', toDate)
    }

    const { count: sentToTl, error: tlError } = await tlQuery

    if (tlError) {
      console.error('Fetch sent to TL error:', tlError)
    }

    // Get count for sent to CRM - calling_date matches crm_sent_date
    let crmQuery = supabaseServer
      .from('candidates_conversation')
      .select('sent_to_crm, calling_date, crm_sent_date', { count: 'exact', head: true })
      .eq('user_id', currentUserId)
      .not('sent_to_crm', 'is', null)
      .not('calling_date', 'is', null)
      .not('crm_sent_date', 'is', null)

    if (fromDate && toDate) {
      crmQuery = crmQuery
        .gte('calling_date', fromDate).lte('calling_date', toDate)
        .gte('crm_sent_date', fromDate).lte('crm_sent_date', toDate)
    }

    const { count: sentToCrm, error: crmError } = await crmQuery

    if (crmError) {
      console.error('Fetch sent to CRM error:', crmError)
    }

    console.log('Accuracy Debug - sentToTl:', sentToTl, 'sentToCrm:', sentToCrm)

    return NextResponse.json({ 
      success: true, 
      trackerSent: trackerSent || 0,
      totalAssets: totalAssets || 0,
      conversions: conversions || 0,
      accuracy: sentToTl > 0 ? Math.round((sentToCrm / sentToTl) * 100) : 0,
      sentToCrm: sentToCrm || 0
    })

  } catch (error) {
    console.error('Server error:', error)
    return NextResponse.json({ error: 'Internal server error', details: error.message }, { status: 500 })
  }
}