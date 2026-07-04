import { supabaseServer } from '@/lib/supabase-server';
import { NextResponse } from 'next/server';
import { getUser } from "@/lib/auth-helper";
export async function GET(request) {
  try {
    
const { user, error: authError } = getUser(request)

if (authError || !user) {
  console.log('[API] Auth error:', authError)
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
}

    const { searchParams } = new URL(request.url);
    const crmId = searchParams.get('crm');
    const tlId = searchParams.get('tl');
    const rcId = searchParams.get('rc');
    const fromDate = searchParams.get('from');
    const toDate = searchParams.get('to');

    // === CRM METRICS (using corporate_crm_interview) ===
    let crmWbQuery = supabaseServer.from('corporate_workbench').select('req_id, sent_to_rc, date');
    if (fromDate) crmWbQuery = crmWbQuery.gte('date', fromDate);
    if (toDate) crmWbQuery = crmWbQuery.lte('date', toDate);
    if (crmId && crmId !== 'All') crmWbQuery = crmWbQuery.eq('sent_to_rc', crmId);

    const { data: crmWorkbench } = await crmWbQuery;
    const crmReqIds = crmWorkbench ? [...new Set(crmWorkbench.map(w => w.req_id).filter(Boolean))] : [];

    const { data: crmInterviews } = crmReqIds.length > 0 
      ? await supabaseServer.from('corporate_crm_interview').select('interview_status').in('req_id', crmReqIds)
      : { data: [] };

    const crmCounts = { trackerToClient: 0, shortlisted: 0, interviewed: 0, selected: 0, joining: 0, ghosted: 0, rejected: 0 };
    (crmInterviews || []).forEach(row => {
      const s = (row.interview_status || '').trim();
      if (s === 'Shortlisted') crmCounts.shortlisted++;
      else if (s === 'Interviewed') crmCounts.interviewed++;
      else if (s === 'Selected') crmCounts.selected++;
      else if (s === 'Joining') crmCounts.joining++;
      else if (s === 'Ghosted' || s === 'No Reply') crmCounts.ghosted++;
      else if (s === 'Rejected') crmCounts.rejected++;
    });
    crmCounts.trackerToClient = crmCounts.selected;
    const crmPipeline = crmCounts.selected - crmCounts.joining;

    // === TL METRICS ===
    let tlWbQuery = supabaseServer.from('corporate_workbench').select('req_id, sent_to_tl, date');
    if (fromDate) tlWbQuery = tlWbQuery.gte('date', fromDate);
    if (toDate) tlWbQuery = tlWbQuery.lte('date', toDate);
    if (tlId && tlId !== 'All') tlWbQuery = tlWbQuery.eq('sent_to_tl', tlId);

    const { data: tlWorkbench } = await tlWbQuery;
    const tlReqIds = tlWorkbench ? [...new Set(tlWorkbench.map(w => w.req_id).filter(Boolean))] : [];

    const { data: tlInterviews } = tlReqIds.length > 0 
      ? await supabaseServer.from('corporate_crm_interview').select('interview_status').in('req_id', tlReqIds)
      : { data: [] };

    let tlJoining = 0, tlRejected = 0;
    (tlInterviews || []).forEach(row => {
      const s = (row.interview_status || '').trim();
      if (s === 'Joining') tlJoining++;
      if (s === 'Rejected') tlRejected++;
    });
    const tlTracker = tlWorkbench ? tlWorkbench.length : 0;
    const tlAccuracy = tlTracker > 0 ? ((tlJoining / tlTracker) * 100).toFixed(1) : "0.0";

    // === RC METRICS ===
    let rcWbQuery = supabaseServer.from('corporate_workbench').select('req_id, sent_to_rc, date');
    if (fromDate) rcWbQuery = rcWbQuery.gte('date', fromDate);
    if (toDate) rcWbQuery = rcWbQuery.lte('date', toDate);
    if (rcId && rcId !== 'All') rcWbQuery = rcWbQuery.eq('sent_to_rc', rcId);

    const { data: rcWorkbench } = await rcWbQuery;
    const rcReqIds = rcWorkbench ? [...new Set(rcWorkbench.map(w => w.req_id).filter(Boolean))] : [];

    const { data: rcInterviews } = rcReqIds.length > 0 
      ? await supabaseServer.from('candidates_conversation').select('candidate_status').in('req_id', rcReqIds)
      : { data: [] };

    let rcCalls = (rcInterviews || []).length;
    let rcTracker = 0;
    (rcInterviews || []).forEach(row => {
      if (row.candidate_status) rcTracker++;
    });
    const rcConversion = rcCalls > 0 ? ((rcTracker / rcCalls) * 100).toFixed(1) : "0.0";
    const rcAccuracy = rcTracker > 0 ? ((rcTracker / rcCalls) * 100).toFixed(1) : "0.0";

    return NextResponse.json({
      success: true,
      data: {
        // CRM Card
        trackerToClient: crmCounts.trackerToClient,
        shortlisted: crmCounts.shortlisted,
        interviewed: crmCounts.interviewed,
        selected: crmCounts.selected,
        joining: crmCounts.joining,
        ghosted: crmCounts.ghosted,
        rejected: crmCounts.rejected,
        pipeline: crmPipeline,

        // TL Card
        trackerSentToCrm: tlTracker,
        pipelineCv: tlTracker - tlJoining,
        rejectedCv: tlRejected,
        tlJoining: tlJoining,
        tlAccuracy,

        // RC Card
        newCvParsed: 0,
        candidateCalling: rcCalls,
        advSti: 0,
        rcConversion,
        asset: 0,
        rcAccuracy,
        trackerSentToTl: rcTracker
      }
    });
  } catch (error) {
    console.error('Combined metrics error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
