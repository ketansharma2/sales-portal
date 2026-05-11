import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// GET - Fetch jobs posted for a specific date from job_postings table
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const date = searchParams.get("date");

    if (!date) {
      return NextResponse.json(
        { error: "Missing required parameter: date" },
        { status: 400 }
      );
    }

    // Fetch job_postings records for the specific date
    const { data: jobPostings, error: jobPostingsError } = await supabaseAdmin
      .from('job_postings')
      .select('id, jd_id, posted_on')
      .eq('posted_on', date)

      console.log("Fetched job_postings:", jobPostings);  
    if (jobPostingsError) {
      console.error('Error fetching job_postings:', jobPostingsError);
      return NextResponse.json({ error: jobPostingsError.message }, { status: 500 })
    }

    if (!jobPostings || jobPostings.length === 0) {
      return NextResponse.json({ 
        success: true,
        date: date,
        jobs: []
      })
    }

    // Get unique jd_ids
    const uniqueJdIds = [...new Set(jobPostings.map(jp => jp.jd_id))];
    console.log("Unique JD IDs:", uniqueJdIds);
    // Fetch from jobpost tables (these don't have job_title)
    const [domesticJDs, corporateJDs] = await Promise.all([
      supabaseAdmin
        .from('domestic_crm_jobpost')
        .select('id, client_name, req_id')
        .in('id', uniqueJdIds),
      supabaseAdmin
        .from('corporate_crm_jobpost')
        .select('id, client_name, req_id')
        .in('id', uniqueJdIds)
    ]);

    // Collect all req_ids
    const domesticReqIds = (domesticJDs.data || []).map(jd => jd.req_id).filter(Boolean);
    const corporateReqIds = (corporateJDs.data || []).map(jd => jd.req_id).filter(Boolean);
    const allReqIds = [...new Set([...domesticReqIds, ...corporateReqIds])];
    
    // Fetch job titles from req tables
    let reqDataMap = new Map();
    
    if (allReqIds.length > 0) {
      const [domesticReq, corporateReq] = await Promise.all([
        supabaseAdmin
          .from('domestic_crm_reqs')
          .select('req_id, job_title')
          .in('req_id', allReqIds),
        supabaseAdmin
          .from('corporate_crm_reqs')
          .select('req_id, job_title')
          .in('req_id', allReqIds)
      ]);

      console.log("Domestic Req Data:", domesticReq);
      console.log("Corporate Req Data:", corporateReq);

      domesticReq.data?.forEach(req => {
        reqDataMap.set(req.req_id, { job_title: req.job_title, client_name: req.client_name });
      });
      
      corporateReq.data?.forEach(req => {
        if (!reqDataMap.has(req.req_id)) {
          reqDataMap.set(req.req_id, { job_title: req.job_title, client_name: req.client_name });
        }
      });
    }

    // Create lookup maps
    const domesticMap = {};
    domesticJDs.data?.forEach(jd => {
      domesticMap[jd.id] = { ...jd, sector: 'Domestic' };
    });

    const corporateMap = {};
    corporateJDs.data?.forEach(jd => {
      corporateMap[jd.id] = { ...jd, sector: 'Corporate' };
    });

    // Build final jobs list
    const jobs = uniqueJdIds.map(jdId => {
      const domesticJD = domesticMap[jdId];
      const corporateJD = corporateMap[jdId];
      
      if (domesticJD) {
        const reqInfo = reqDataMap.get(domesticJD.req_id);
        return {
          id: jdId,
          date: date,
          sector: 'Domestic',
          client: domesticJD.client_name || 'Unknown',
          profile: reqInfo?.job_title || 'N/A'
        };
      } else if (corporateJD) {
        const reqInfo = reqDataMap.get(corporateJD.req_id);
        return {
          id: jdId,
          date: date,
          sector: 'Corporate',
          client:  corporateJD.client_name || 'Unknown',
          profile: reqInfo?.job_title || 'N/A'
        };
      }
      
      return {
        id: jdId,
        date: date,
        sector: 'Unknown',
        client: 'Unknown',
        profile: 'Unknown'
      };
    });

    return NextResponse.json({ 
      success: true,
      date: date,
      jobs: jobs
    })
  } catch (error) {
    console.error('Error fetching jobs posted:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}