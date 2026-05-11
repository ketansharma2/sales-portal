import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// GET - Find max date from job_postings and posting_data tables (excluding today)
// and fetch all report data for that date
// export async function GET(request) {
//   try {
//     const today = new Date().toISOString().split('T')[0];

//     // 1. Get max date from job_postings table (posted_on column) where date != today
//     const { data: jobPostingsData, error: jobPostingsError } = await supabaseAdmin
//       .from('job_postings')
//       .select('posted_on')
//       .neq('posted_on', today)
//       .order('posted_on', { ascending: false })
//       .limit(1);

//     if (jobPostingsError) {
//       console.error('Error fetching job_postings max date:', jobPostingsError);
//       return NextResponse.json({ error: jobPostingsError.message }, { status: 500 });
//     }

//     const maxJobPostingsDate = jobPostingsData && jobPostingsData.length > 0 
//       ? jobPostingsData[0].posted_on 
//       : null;

//     // 2. Get max date from posting_data table (date column) where date != today
//     const { data: postingData, error: postingDataError } = await supabaseAdmin
//       .from('posting_data')
//       .select('date')
//       .neq('date', today)
//       .order('date', { ascending: false })
//       .limit(1);

//     if (postingDataError) {
//       console.error('Error fetching posting_data max date:', postingDataError);
//       return NextResponse.json({ error: postingDataError.message }, { status: 500 });
//     }

//     const maxPostingDataDate = postingData && postingData.length > 0 
//       ? postingData[0].date 
//       : null;

//     // 3. Compare both dates and pick the maximum
//     let selectedDate = null;
    
//     if (maxJobPostingsDate && maxPostingDataDate) {
//       selectedDate = new Date(maxJobPostingsDate) > new Date(maxPostingDataDate) 
//         ? maxJobPostingsDate 
//         : maxPostingDataDate;
//     } else if (maxJobPostingsDate) {
//       selectedDate = maxJobPostingsDate;
//     } else if (maxPostingDataDate) {
//       selectedDate = maxPostingDataDate;
//     }

//     // If no date found, return empty data
//     if (!selectedDate) {
//       return NextResponse.json({
//         success: true,
//         selectedDate: null,
//         jobs: [],
//         stats: [],
//         totals: {
//           indeedCvs: 0,
//           indeedCalls: 0,
//           naukriCvs: 0,
//           naukriCalls: 0
//         }
//       });
//     }

//     // 4. Fetch jobs posted for the selected date
//     const { data: jobPostings, error: jobsError } = await supabaseAdmin
//       .from('job_postings')
//       .select('id, jd_id, posted_on, platform')
//       .eq('posted_on', selectedDate);

//     if (jobsError) {
//       console.error('Error fetching jobs:', jobsError);
//     }

//     let jobs = [];
//     if (jobPostings && jobPostings.length > 0) {
//       // Get unique jd_ids
//       const uniqueJdIds = [...new Set(jobPostings.map(jp => jp.jd_id))];

//       // Fetch JD details
//       const [domesticJDs, corporateJDs] = await Promise.all([
//         supabaseAdmin
//           .from('domestic_crm_jd')
//           .select('*')
//           .in('jd_id', uniqueJdIds),
//         supabaseAdmin
//           .from('corporate_crm_jd')
//           .select('*')
//           .in('jd_id', uniqueJdIds)
//       ]);

//       const domesticMap = {};
//       domesticJDs.data?.forEach(jd => {
//         domesticMap[jd.jd_id] = { ...jd, sector: 'Domestic' };
//       });

//       const corporateMap = {};
//       corporateJDs.data?.forEach(jd => {
//         corporateMap[jd.jd_id] = { ...jd, sector: 'Corporate' };
//       });

//       // Group platforms by jd_id
//       const jdPlatformsMap = {};
//       jobPostings.forEach(jp => {
//         if (!jdPlatformsMap[jp.jd_id]) {
//           jdPlatformsMap[jp.jd_id] = new Set();
//         }
//         if (jp.platform) {
//           jdPlatformsMap[jp.jd_id].add(jp.platform);
//         }
//       });

//       jobs = uniqueJdIds.map(jdId => {
//         const domesticJD = domesticMap[jdId];
//         const corporateJD = corporateMap[jdId];
        
//         // Get platforms for this JD
//         const platforms = jdPlatformsMap[jdId] ? Array.from(jdPlatformsMap[jdId]) : [];
        
//         if (domesticJD) {
//           return {
//             ...domesticJD,
//             id: jdId,
//             date: selectedDate,
//             sector: 'Domestic',
//             platforms: platforms
//           };
//         } else if (corporateJD) {
//           return {
//             ...corporateJD,
//             id: jdId,
//             date: selectedDate,
//             sector: 'Corporate',
//             platforms: platforms
//           };
//         }
        
//         return {
//           id: jdId,
//           date: selectedDate,
//           sector: 'Unknown',
//           client_name: 'Unknown',
//           job_title: 'Unknown',
//           platforms: platforms
//         };
//       });
//     }

//     // 5. Fetch daily stats for the selected date
//     const { data: allData, error: statsError } = await supabaseAdmin
//       .from('posting_data')
//       .select('platform, cv_received, calls_done, date')
//       .eq('date', selectedDate);

//     if (statsError) {
//       console.error('Error fetching daily stats:', statsError);
//     }

//     const platformStats = {};
//     allData?.forEach(record => {
//       const platform = (record.platform || '').toLowerCase();
      
//       let normalizedPlatform = 'Unknown';
//       if (platform.includes('naukri')) {
//         normalizedPlatform = 'Naukri';
//       } else if (platform.includes('indeed')) {
//         normalizedPlatform = 'Indeed';
//       } else if (platform.includes('internshala')) {
//         normalizedPlatform = 'Internshala';
//       }

//       if (!platformStats[normalizedPlatform]) {
//         platformStats[normalizedPlatform] = {
//           platform: normalizedPlatform,
//           cvsReceived: 0,
//           callingDone: 0
//         };
//       }

//       platformStats[normalizedPlatform].cvsReceived += record.cv_received || 0;
//       platformStats[normalizedPlatform].callingDone += record.calls_done || 0;
//     });

//     const stats = Object.values(platformStats);

//     // 6. Fetch lifetime totals from posting_data (all time)
//     const { data: allPostingData, error: totalsError } = await supabaseAdmin
//       .from('posting_data')
//       .select('platform, cv_received, calls_done');

//     if (totalsError) {
//       console.error('Error fetching totals:', totalsError);
//     }

//     const lifetimeTotals = {
//       indeedCvs: 0,
//       indeedCalls: 0,
//       naukriCvs: 0,
//       naukriCalls: 0
//     };

//     allPostingData?.forEach(record => {
//       const platform = (record.platform || '').toLowerCase();
      
//       if (platform.includes('indeed')) {
//         lifetimeTotals.indeedCvs += record.cv_received || 0;
//         lifetimeTotals.indeedCalls += record.calls_done || 0;
//       } else if (platform.includes('naukri')) {
//         lifetimeTotals.naukriCvs += record.cv_received || 0;
//         lifetimeTotals.naukriCalls += record.calls_done || 0;
//       }
//     });

//     return NextResponse.json({
//       success: true,
//       selectedDate: selectedDate,
//       maxJobPostingsDate: maxJobPostingsDate,
//       maxPostingDataDate: maxPostingDataDate,
//       jobs: jobs,
//       stats: stats,
//       totals: lifetimeTotals
//     });

//   } catch (error) {
//     console.error('Error in report-date API:', error);
//     return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
//   }
// }

function parseArrayField(value) {
  if (!value) return null;
  
  // If it's already an array, return it
  if (Array.isArray(value)) return value;
  
  // If it's a string that looks like an array
  if (typeof value === 'string') {
    try {
      // Replace single quotes with double quotes for valid JSON
      const cleaned = value.replace(/'/g, '"');
      const parsed = JSON.parse(cleaned);
      return Array.isArray(parsed) ? parsed : [value];
    } catch(e) {
      // If parsing fails, return as single item array
      return [value];
    }
  }
  
  return [value];
}

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
      .select('id, jd_id, posted_on, platform')
      .eq('posted_on', selectedDate);

    if (jobsError) {
      console.error('Error fetching jobs:', jobsError);
    }

    let jobs = [];
    if (jobPostings && jobPostings.length > 0) {
      // Get unique jd_ids
      const uniqueJdIds = [...new Set(jobPostings.map(jp => jp.jd_id))];

      // Fetch from jobpost tables (these don't have job_title)
      const [domesticJobPosts, corporateJobPosts] = await Promise.all([
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
      const domesticReqIds = (domesticJobPosts.data || []).map(jd => jd.req_id).filter(Boolean);
      const corporateReqIds = (corporateJobPosts.data || []).map(jd => jd.req_id).filter(Boolean);
      const allReqIds = [...new Set([...domesticReqIds, ...corporateReqIds])];
      
      // Fetch job titles from req tables
      let reqDataMap = new Map();
      
      if (allReqIds.length > 0) {
      const [domesticReq, corporateReq] = await Promise.all([
  supabaseAdmin
    .from('domestic_crm_reqs')
    .select('req_id, job_title, jd_link, experience, package, openings, priority, timeline, date, location, employment_type, working_days, timings, tool_req, job_summary, rnr, req_skills, preferred_qual, company_offers, contact_details')
    .in('req_id', allReqIds),
  supabaseAdmin
    .from('corporate_crm_reqs')
    .select('req_id, job_title, jd_link, experience, package, openings, priority, timeline, date, location, employment_type, working_days, timings, tool_req, job_summary, rnr, req_skills, preferred_qual, company_offers, contact_details')
    .in('req_id', allReqIds)
]);
        console.log("Domestic Req Data:", domesticReq);
        console.log("Corporate Req Data:", corporateReq);
        domesticReq.data?.forEach(req => {
          reqDataMap.set(req.req_id, { 
            job_title: req.job_title,
            jd_link: req.jd_link,
            experience: req.experience,
            package: req.package,
            openings: req.openings,
            priority: req.priority,
            timeline: req.timeline,
            date: req.date,
            location: req.location,
            employment_type: req.employment_type,
            working_days: req.working_days,
            timings: req.timings,
            tool_req: req.tool_req,
            job_summary: req.job_summary,
            rnr: req.rnr,
            req_skills: req.req_skills,
            preferred_qual: req.preferred_qual,
            company_offers: req.company_offers,
            contact_details: req.contact_details
          });
        });
        
        // Store corporate req data
        corporateReq.data?.forEach(req => {
          if (!reqDataMap.has(req.req_id)) {
            reqDataMap.set(req.req_id, { 
              job_title: req.job_title,
              jd_link: req.jd_link,
              experience: req.experience,
              package: req.package,
              openings: req.openings,
              priority: req.priority,
              timeline: req.timeline,
              date: req.date,
              location: req.location,
              employment_type: req.employment_type,
              working_days: req.working_days,
              timings: req.timings,
              tool_req: req.tool_req,
              job_summary: req.job_summary,
              rnr: req.rnr,
              req_skills: req.req_skills,
              preferred_qual: req.preferred_qual,
              company_offers: req.company_offers,
              contact_details: req.contact_details
            });
          }
        });
      }

      const domesticMap = {};
      domesticJobPosts.data?.forEach(jd => {
        domesticMap[jd.id] = { ...jd, sector: 'Domestic' };
      });

      const corporateMap = {};
      corporateJobPosts.data?.forEach(jd => {
        corporateMap[jd.id] = { ...jd, sector: 'Corporate' };
      });

      // Group platforms by jd_id
      const jdPlatformsMap = {};
      jobPostings.forEach(jp => {
        if (!jdPlatformsMap[jp.jd_id]) {
          jdPlatformsMap[jp.jd_id] = new Set();
        }
        if (jp.platform) {
          jdPlatformsMap[jp.jd_id].add(jp.platform);
        }
      });

      jobs = uniqueJdIds.map(jdId => {
        const domesticJD = domesticMap[jdId];
        const corporateJD = corporateMap[jdId];
        
        // Get platforms for this JD
        const platforms = jdPlatformsMap[jdId] ? Array.from(jdPlatformsMap[jdId]) : [];
        
        if (domesticJD) {
          const reqInfo = reqDataMap.get(domesticJD.req_id);
          
          return {
            id: jdId,
            date: selectedDate,
            sector: 'Domestic',
            client_name: reqInfo?.client_name || domesticJD.client_name || 'Unknown',
            job_title: reqInfo?.job_title || 'N/A',
            req_id: domesticJD.req_id,
            platforms: platforms,
            jd_link: reqInfo?.jd_link || null,
            experience: reqInfo?.experience || null,
            package: reqInfo?.package || null,
            openings: reqInfo?.openings || null,
            priority: reqInfo?.priority || null,
            timeline: reqInfo?.timeline || null,
            req_date: reqInfo?.date || null,
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
          return {
            id: jdId,
            date: selectedDate,
            sector: 'Corporate',
            client_name: reqInfo?.client_name || corporateJD.client_name || 'Unknown',
            job_title: reqInfo?.job_title || 'N/A',
            req_id: corporateJD.req_id,
            platforms: platforms,
            jd_link: reqInfo?.jd_link || null,
            experience: reqInfo?.experience || null,
            package: reqInfo?.package || null,
            openings: reqInfo?.openings || null,
            priority: reqInfo?.priority || null,
            timeline: reqInfo?.timeline || null,
            req_date: reqInfo?.date || null,
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
        
        return {
          id: jdId,
          date: selectedDate,
          sector: 'Unknown',
          client_name: 'Unknown',
          job_title: 'Unknown',
          platforms: platforms
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