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

    // Fetch job_postings records for the specific date (using posted_on column)
    const { data: jobPostings, error: jobPostingsError } = await supabaseAdmin
      .from('job_postings')
      .select('id, jd_id, posted_on')
      .eq('posted_on', date)

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

    // Extract all jd_ids
    const jdIds = jobPostings.map(jp => jp.jd_id);

    // Fetch matching JDs from both tables using jd_id
    const [domesticJDs, corporateJDs] = await Promise.all([
      supabaseAdmin
        .from('domestic_crm_jd')
        .select('jd_id, client_name, job_title')
        .in('jd_id', jdIds),
      supabaseAdmin
        .from('corporate_crm_jd')
        .select('jd_id, client_name, job_title')
        .in('jd_id', jdIds)
    ]);

    // Create lookup maps using jd_id as key
    const domesticMap = {};
    domesticJDs.data?.forEach(jd => {
      domesticMap[jd.jd_id] = { ...jd, sector: 'Domestic' };
    });

    const corporateMap = {};
    corporateJDs.data?.forEach(jd => {
      corporateMap[jd.jd_id] = { ...jd, sector: 'Corporate' };
    });

    // Build final jobs list
    const jobs = jobPostings.map(posting => {
      const jdId = posting.jd_id;
      
      // Check domestic first, then corporate
      const domesticJD = domesticMap[jdId];
      const corporateJD = corporateMap[jdId];
      
      if (domesticJD) {
        return {
          id: posting.id,
          date: posting.posted_on,
          sector: 'Domestic',
          client: domesticJD.client_name,
          profile: domesticJD.job_title
        };
      } else if (corporateJD) {
        return {
          id: posting.id,
          date: posting.posted_on,
          sector: 'Corporate',
          client: corporateJD.client_name,
          profile: corporateJD.job_title
        };
      }
      
      // If no match found
      return {
        id: posting.id,
        date: posting.posted_on,
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
