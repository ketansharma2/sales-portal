import { supabaseServer } from '@/lib/supabase-server'
import { NextResponse } from 'next/server'
import { getUser } from '@/lib/auth-helper';

export async function GET(request) {
  try {
      const { user, error: authError } = getUser(request);
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
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

    if (fromDate && toDate) {
      query = query.gte('date', fromDate).lte('date', toDate)
    }

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

        if (fromDate && toDate) {
          rcQuery = rcQuery.gte('calling_date', fromDate).lte('calling_date', toDate)
        }

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
        // Batch STI queries to avoid header overflow
        const STI_BATCH_SIZE = 100;
        let allStiResults = [];
        
        for (let i = 0; i < workbenchIds.length; i += STI_BATCH_SIZE) {
          const batch = workbenchIds.slice(i, i + STI_BATCH_SIZE);
          const { data: stiData, error: stiError } = await supabaseServer
            .from('domestic_workbench_sti')
            .select('advance_sti')
            .in('workbench_id', batch)
          
          if (!stiError && stiData) {
            allStiResults.push(...stiData)
          }
        }
        
        total_sti = allStiResults.reduce((sum, item) => sum + (parseFloat(item.advance_sti) || 0), 0) || 0
      }

      let trackerQuery = supabaseServer
        .from('candidates_conversation')
        .select('parsing_id')
        .in('user_id', recruiterIds)
        .not('parsing_id', 'is', null)

      if (fromDate && toDate) {
        trackerQuery = trackerQuery.gte('calling_date', fromDate).lte('calling_date', toDate)
      }

      const { data: trackerRows } = await trackerQuery

      const parsingIds = [...new Set(trackerRows?.map(r => r.parsing_id).filter(Boolean))] || []
      
      // BATCH the CV data query to avoid header overflow
      if (parsingIds.length > 0) {
        console.log(`Total parsingIds to process: ${parsingIds.length}`);
        
        const CV_BATCH_SIZE = 50; // Smaller batch size for CV queries
        let allCvResults = [];
        
        for (let i = 0; i < parsingIds.length; i += CV_BATCH_SIZE) {
          const batch = parsingIds.slice(i, i + CV_BATCH_SIZE);
          console.log(`Processing CV batch ${i / CV_BATCH_SIZE + 1} of ${Math.ceil(parsingIds.length / CV_BATCH_SIZE)} with ${batch.length} IDs`);
          
          let cvQuery = supabaseServer
            .from('cv_parsing')
            .select('portal')
            .in('id', batch)

          if (fromDate && toDate) {
            cvQuery = cvQuery.gte('portal_date', fromDate).lte('portal_date', toDate)
          }

          const { data: cvData, error: cvError } = await cvQuery
          
          if (cvError) {
            console.error(`Error fetching CV data for batch ${i}:`, cvError)
          } else if (cvData) {
            allCvResults.push(...cvData)
          }
        }
        
        console.log("total_cvs:", allCvResults.length);
        total_cvs = allCvResults.length || 0
      } else {
        console.log("No parsingIds found")
        total_cvs = 0
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