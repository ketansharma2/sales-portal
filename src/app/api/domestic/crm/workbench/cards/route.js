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

    const currentUserId = user.user_id || user.id
    const { searchParams } = new URL(request.url)
    const fromDate = searchParams.get('fromDate')
    const toDate = searchParams.get('toDate')
    const tlId = searchParams.get('tl_id')
    const recruiterId = searchParams.get('recruiter_id')

    let query = supabaseServer
      .from('domestic_workbench')
      .select('*, sent_to_tl, sent_to_rc')
      .gte('date', fromDate)
      .lte('date', toDate)

    if (tlId) {
      query = query.eq('sent_to_tl', tlId)
    }

    if (recruiterId) {
      query = query.eq('sent_to_rc', recruiterId)
    }

    const { data: workbenchData, error: fetchError } = await query

    if (fetchError) {
      console.error('Fetch workbench error:', fetchError)
      return NextResponse.json({
        error: 'Failed to fetch workbench data',
        details: fetchError.message
      }, { status: 500 })
    }

    const recruiterIds = [...new Set(workbenchData?.map(item => item.sent_to_rc).filter(Boolean))] || []

    let total_cvs = 0
    let total_sti = 0
    let total_conversion = 0
    let total_asset = 0
    let tracker_received = 0

    if (recruiterIds.length > 0) {
      for (const rcId of recruiterIds) {
        let rcQuery = supabaseServer
          .from('candidates_conversation')
          .select('candidate_status, sent_to_crm')
          .eq('user_id', rcId)
          .gte('calling_date', fromDate)
          .lte('calling_date', toDate)

        if (tlId) {
          const tlWorkbench = workbenchData?.filter(w => w.sent_to_tl === tlId && w.sent_to_rc === rcId) || []
          const reqIds = [...new Set(tlWorkbench.map(w => w.req_id).filter(Boolean))]
          if (reqIds.length > 0) {
            rcQuery = rcQuery.in('req_id', reqIds)
          } else {
            continue
          }
        }

        const { data: convData } = await rcQuery
        
        total_conversion += convData?.filter(c => c.candidate_status === 'Conversion').length || 0
        total_asset += convData?.filter(c => c.candidate_status === 'Asset').length || 0
        tracker_received += convData?.filter(c => c.sent_to_crm).length || 0
      }

      const workbenchIds = workbenchData?.map(item => item.workbench_id).filter(Boolean) || []
      if (workbenchIds.length > 0) {
        const { data: stiData } = await supabaseServer
          .from('domestic_workbench_sti')
          .select('advance_sti')
          .in('workbench_id', workbenchIds)
        
        total_sti = stiData?.reduce((sum, item) => sum + (parseFloat(item.advance_sti) || 0), 0) || 0
      }

      const { data: trackerRows } = await supabaseServer
        .from('candidates_conversation')
        .select('parsing_id')
        .in('user_id', recruiterIds)
        .gte('calling_date', fromDate)
        .lte('calling_date', toDate)
        .not('parsing_id', 'is', null)

      const parsingIds = [...new Set(trackerRows?.map(r => r.parsing_id).filter(Boolean))] || []
      
      if (parsingIds.length > 0) {
        const { data: cvData } = await supabaseServer
          .from('cv_parsing')
          .select('portal')
          .in('id', parsingIds)
          .gte('portal_date', fromDate)
          .lte('portal_date', toDate)
        
        total_cvs = cvData?.length || 0
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        total_cvs,
        total_sti,
        total_conversion,
        total_asset,
        tracker_received
      }
    })

  } catch (error) {
    console.error('Cards API error:', error)
    return NextResponse.json({
      error: 'Internal server error',
      details: error.message
    }, { status: 500 })
  }
}