import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// GET - Fetch jobs posted for a specific date from job_postings table
export async function GET(request) {
  try {
    // Get latest date
    const { data: latestJob, error: latestError } = await supabaseAdmin
      .from('job_postings')
      .select('posted_on')
      .not('posted_on', 'is', null)
      .order('posted_on', { ascending: false })
      .limit(1)
      .single();

    if (latestError) {
      console.error(latestError);
      return NextResponse.json({ error: latestError.message }, { status: 500 });
    }

    const latestDate = latestJob.posted_on;

    // Fetch job_postings records for the specific date
    const { data: jobPostings, error: jobPostingsError } = await supabaseAdmin
      .from('job_postings')
      .select('id, jd_id, posted_on,platform')
      .eq('posted_on', latestDate);

    console.log("Fetched job_postings:", jobPostings);
    
    if (jobPostingsError) {
      console.error('Error fetching job_postings:', jobPostingsError);
      return NextResponse.json({ error: jobPostingsError.message }, { status: 500 });
    }

    if (!jobPostings || jobPostings.length === 0) {
      return NextResponse.json({ 
        success: true,
        date: latestDate,
        jobs: []
      });
    }
    const jobPostingMap = {};

jobPostings.forEach(job => {
  jobPostingMap[job.jd_id] = job;
});

    // Get unique jd_ids
    const uniqueJdIds = [...new Set(jobPostings.map(jp => jp.jd_id))];
    console.log("Unique JD IDs:", uniqueJdIds);
    
    // Fetch from jobpost tables
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
    
    // Fetch ALL data from req tables (using select('*') already gives all columns)
    let reqDataMap = new Map();
    
    if (allReqIds.length > 0) {
      const [domesticReq, corporateReq] = await Promise.all([
        supabaseAdmin
          .from('domestic_crm_reqs')
          .select('*')
          .in('req_id', allReqIds),
        supabaseAdmin
          .from('corporate_crm_reqs')
          .select('*')
          .in('req_id', allReqIds)
      ]);

      console.log("Domestic Req Data:", domesticReq);
      console.log("Corporate Req Data:", corporateReq);

      // Store ALL req data, not just job_title and client_name
      domesticReq.data?.forEach(req => {
        reqDataMap.set(req.req_id, { ...req, sector: 'Domestic' });
      });
      
      corporateReq.data?.forEach(req => {
        if (!reqDataMap.has(req.req_id)) {
          reqDataMap.set(req.req_id, { ...req, sector: 'Corporate' });
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

    // Build final jobs list with ALL data
    const jobs = uniqueJdIds.map(jdId => {
      const domesticJD = domesticMap[jdId];
      const corporateJD = corporateMap[jdId];
      
      if (domesticJD) {
        const reqInfo = reqDataMap.get(domesticJD.req_id);
        console.log(`Req info for Domestic JD ${jdId}:`, reqInfo);
        const postingInfo = jobPostingMap[jdId];
        // Return ALL fields from both tables
        return {
          // From job_postings
          job_posting_id: jdId,
          date: latestDate,
          platforms: postingInfo?.platform ? [postingInfo.platform] : [],
          // From domestic_crm_jobpost
          sector: 'Domestic',
          client_name: reqInfo?.client_name || domesticJD.client_name || null,
          
          // ALL fields from domestic_crm_reqs
          req_id: reqInfo?.req_id || null,
          branch_id: reqInfo?.branch_id || null,
          user_id: reqInfo?.user_id || null,
          job_title: reqInfo?.job_title || null,
          jd_link: reqInfo?.jd_link || null,
          experience: reqInfo?.experience || null,
          package: reqInfo?.package || null,
          openings: reqInfo?.openings || null,
          priority: reqInfo?.priority || null,
          status: reqInfo?.status || null,
          timeline: reqInfo?.timeline || null,
          req_date: reqInfo?.date || null,
          created_at: reqInfo?.created_at || null,
          location: reqInfo?.location || null,
          employment_type: reqInfo?.employment_type || null,
          working_days: reqInfo?.working_days || null,
          timings: reqInfo?.timings || null,
          tool_req: reqInfo?.tool_req || null,
          job_summary: reqInfo?.job_summary || null,
          rnr: reqInfo?.rnr || null,
          req_skills: reqInfo?.req_skills || null,
          preferred_qual: reqInfo?.preferred_qual || null,
          company_offers: reqInfo?.company_offers || null,
          contact_details: reqInfo?.contact_details || null
        };
        
      } else if (corporateJD) {
        const reqInfo = reqDataMap.get(corporateJD.req_id);
const postingInfo = jobPostingMap[jdId];
        return {
          // From job_postings
          job_posting_id: jdId,
          date: latestDate,
           platforms: postingInfo?.platform ? [postingInfo.platform] : [],
          // From corporate_crm_jobpost
          sector: 'Corporate',
          client_name: reqInfo?.client_name || corporateJD.client_name || null,
          
          // ALL fields from corporate_crm_reqs
          req_id: reqInfo?.req_id || null,
          branch_id: reqInfo?.branch_id || null,
          user_id: reqInfo?.user_id || null,
          job_title: reqInfo?.job_title || null,
          jd_link: reqInfo?.jd_link || null,
          experience: reqInfo?.experience || null,
          package: reqInfo?.package || null,
          openings: reqInfo?.openings || null,
          priority: reqInfo?.priority || null,
          status: reqInfo?.status || null,
          timeline: reqInfo?.timeline || null,
          req_date: reqInfo?.date || null,
          created_at: reqInfo?.created_at || null,
          location: reqInfo?.location || null,
          employment_type: reqInfo?.employment_type || null,
          working_days: reqInfo?.working_days || null,
          timings: reqInfo?.timings || null,
          tool_req: reqInfo?.tool_req || null,
          job_summary: reqInfo?.job_summary || null,
          rnr: reqInfo?.rnr || null,
          req_skills: reqInfo?.req_skills || null,
          preferred_qual: reqInfo?.preferred_qual || null,
          company_offers: reqInfo?.company_offers || null,
          contact_details: reqInfo?.contact_details || null
        };
      }
      
      // Fallback for unknown sector
      return {
        job_posting_id: jdId,
        date: latestDate,
        sector: 'Unknown',
        error: 'No matching job data found'
      };
    });

    return NextResponse.json({ 
      success: true,
      date: latestDate,
      total_jobs: jobs.length,
      jobs: jobs
    });
    
  } catch (error) {
    console.error('Error fetching jobs posted:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}