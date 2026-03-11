import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// GET - Find max date from job_postings and posting_data tables (excluding today)
// and fetch all report data for that date
export async function GET(request) {
  try {
    const today = new Date().toISOString().split('T')[0];

    // 1. Get max date from job_postings table (posted_on column) where date != today
    const { data: jobPostingsData, error: jobPostingsError } = await supabaseAdmin
      .from('job_postings')
      .select('posted_on')
      .neq('posted_on', today)
      .order('posted_on', { ascending: false })
      .limit(1);

    if (jobPostingsError) {
      console.error('Error fetching job_postings max date:', jobPostingsError);
      return NextResponse.json({ error: jobPostingsError.message }, { status: 500 });
    }

    const maxJobPostingsDate = jobPostingsData && jobPostingsData.length > 0 
      ? jobPostingsData[0].posted_on 
      : null;

    // 2. Get max date from posting_data table (date column) where date != today
    const { data: postingData, error: postingDataError } = await supabaseAdmin
      .from('posting_data')
      .select('date')
      .neq('date', today)
      .order('date', { ascending: false })
      .limit(1);

    if (postingDataError) {
      console.error('Error fetching posting_data max date:', postingDataError);
      return NextResponse.json({ error: postingDataError.message }, { status: 500 });
    }

    const maxPostingDataDate = postingData && postingData.length > 0 
      ? postingData[0].date 
      : null;

    // 3. Compare both dates and pick the maximum
    let selectedDate = null;
    
    if (maxJobPostingsDate && maxPostingDataDate) {
      selectedDate = new Date(maxJobPostingsDate) > new Date(maxPostingDataDate) 
        ? maxJobPostingsDate 
        : maxPostingDataDate;
    } else if (maxJobPostingsDate) {
      selectedDate = maxJobPostingsDate;
    } else if (maxPostingDataDate) {
      selectedDate = maxPostingDataDate;
    }

    // If no date found, return empty data
    if (!selectedDate) {
      return NextResponse.json({
        success: true,
        selectedDate: null,
        jobs: [],
        stats: [],
        totals: {
          indeedCvs: 0,
          indeedCalls: 0,
          naukriCvs: 0,
          naukriCalls: 0
        }
      });
    }

    // 4. Fetch jobs posted for the selected date
    const { data: jobPostings, error: jobsError } = await supabaseAdmin
      .from('job_postings')
      .select('id, jd_id, posted_on')
      .eq('posted_on', selectedDate);

    if (jobsError) {
      console.error('Error fetching jobs:', jobsError);
    }

    let jobs = [];
    if (jobPostings && jobPostings.length > 0) {
      const uniqueJdIds = [...new Set(jobPostings.map(jp => jp.jd_id))];

      const [domesticJDs, corporateJDs] = await Promise.all([
        supabaseAdmin
          .from('domestic_crm_jd')
          .select('jd_id, client_name, job_title')
          .in('jd_id', uniqueJdIds),
        supabaseAdmin
          .from('corporate_crm_jd')
          .select('jd_id, client_name, job_title')
          .in('jd_id', uniqueJdIds)
      ]);

      const domesticMap = {};
      domesticJDs.data?.forEach(jd => {
        domesticMap[jd.jd_id] = { ...jd, sector: 'Domestic' };
      });

      const corporateMap = {};
      corporateJDs.data?.forEach(jd => {
        corporateMap[jd.jd_id] = { ...jd, sector: 'Corporate' };
      });

      jobs = uniqueJdIds.map(jdId => {
        const domesticJD = domesticMap[jdId];
        const corporateJD = corporateMap[jdId];
        
        if (domesticJD) {
          return {
            id: jdId,
            date: selectedDate,
            sector: 'Domestic',
            client: domesticJD.client_name,
            profile: domesticJD.job_title
          };
        } else if (corporateJD) {
          return {
            id: jdId,
            date: selectedDate,
            sector: 'Corporate',
            client: corporateJD.client_name,
            profile: corporateJD.job_title
          };
        }
        
        return {
          id: jdId,
          date: selectedDate,
          sector: 'Unknown',
          client: 'Unknown',
          profile: 'Unknown'
        };
      });
    }

    // 5. Fetch daily stats for the selected date
    const { data: allData, error: statsError } = await supabaseAdmin
      .from('posting_data')
      .select('platform, cv_received, calls_done, date')
      .eq('date', selectedDate);

    if (statsError) {
      console.error('Error fetching daily stats:', statsError);
    }

    const platformStats = {};
    allData?.forEach(record => {
      const platform = (record.platform || '').toLowerCase();
      
      let normalizedPlatform = 'Unknown';
      if (platform.includes('naukri')) {
        normalizedPlatform = 'Naukri';
      } else if (platform.includes('indeed')) {
        normalizedPlatform = 'Indeed';
      } else if (platform.includes('internshala')) {
        normalizedPlatform = 'Internshala';
      }

      if (!platformStats[normalizedPlatform]) {
        platformStats[normalizedPlatform] = {
          platform: normalizedPlatform,
          cvsReceived: 0,
          callingDone: 0
        };
      }

      platformStats[normalizedPlatform].cvsReceived += record.cv_received || 0;
      platformStats[normalizedPlatform].callingDone += record.calls_done || 0;
    });

    const stats = Object.values(platformStats);

    // 6. Fetch lifetime totals from posting_data (all time)
    const { data: allPostingData, error: totalsError } = await supabaseAdmin
      .from('posting_data')
      .select('platform, cv_received, calls_done');

    if (totalsError) {
      console.error('Error fetching totals:', totalsError);
    }

    const lifetimeTotals = {
      indeedCvs: 0,
      indeedCalls: 0,
      naukriCvs: 0,
      naukriCalls: 0
    };

    allPostingData?.forEach(record => {
      const platform = (record.platform || '').toLowerCase();
      
      if (platform.includes('indeed')) {
        lifetimeTotals.indeedCvs += record.cv_received || 0;
        lifetimeTotals.indeedCalls += record.calls_done || 0;
      } else if (platform.includes('naukri')) {
        lifetimeTotals.naukriCvs += record.cv_received || 0;
        lifetimeTotals.naukriCalls += record.calls_done || 0;
      }
    });

    return NextResponse.json({
      success: true,
      selectedDate: selectedDate,
      maxJobPostingsDate: maxJobPostingsDate,
      maxPostingDataDate: maxPostingDataDate,
      jobs: jobs,
      stats: stats,
      totals: lifetimeTotals
    });

  } catch (error) {
    console.error('Error in report-date API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
