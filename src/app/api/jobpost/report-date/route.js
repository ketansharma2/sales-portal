import { NextResponse } from "next/server";
import { getUser } from "@/lib/auth-helper";
import { supabaseServer } from "@/lib/supabase-server";

// GET - Find max date from job_postings and posting_data tables (excluding today)
// and fetch all report data for that date
// export async function GET(request) {
//   try {
//     const today = new Date().toISOString().split('T')[0];

//     // 1. Get max date from job_postings table (posted_on column) where date != today
//     const { data: jobPostingsData, error: jobPostingsError } = await supabaseServer
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
//     const { data: postingData, error: postingDataError } = await supabaseServer
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
//     const { data: jobPostings, error: jobsError } = await supabaseServer
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
//         supabaseServer
//           .from('domestic_crm_jd')
//           .select('*')
//           .in('jd_id', uniqueJdIds),
//         supabaseServer
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
//     const { data: allData, error: statsError } = await supabaseServer
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
//     const { data: allPostingData, error: totalsError } = await supabaseServer
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
    // Authentication - user injected by middleware (no auth calls needed!)
    const { user, error: authError } = getUser(request);
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const today = new Date().toISOString().split('T')[0];

    // 1. Get max date from candidates_conversation (apply_date column) where date != today
    const { data: conversationDates, error: conversationError } = await supabaseServer
      .from('candidates_conversation')
      .select('apply_date')
      .not('apply_date', 'is', null)
      .neq('apply_date', today)
      .order('apply_date', { ascending: false })
      .limit(1);

    if (conversationError) {
      console.error('Error fetching conversation max date:', conversationError);
      return NextResponse.json({ error: conversationError.message }, { status: 500 });
    }

    const selectedDate = conversationDates && conversationDates.length > 0 
      ? conversationDates[0].apply_date 
      : null;

    // If no date found, return empty data
    if (!selectedDate) {
      return NextResponse.json({
        success: true,
        selectedDate: null,
        jobs: [],
        stats: [],
        platformTotals: {
          naukri: { cvs: 0, calls: 0 },
          indeed: { cvs: 0, calls: 0 },
          internshala: { cvs: 0, calls: 0 }
        }
      });
    }

    // 2. Fetch conversations for the selected date with their parsing data
    const { data: conversations, error: conversationsError } = await supabaseServer
      .from('candidates_conversation')
      .select(`
        conversation_id,
        user_id,
        calling_date,
        call_respond,
        parsing_id,
        created_at,
        req_id,
        apply_date
      `)
      .eq('apply_date', selectedDate)
      .eq('user_id', user.id) // Filter by authenticated user_id
      .not('req_id', 'is', null);

    if (conversationsError) {
      console.error('Error fetching conversations:', conversationsError);
    }
     const { data: jobPostings, error: jobPostingsError } = await supabaseServer
  .from('job_postings')
  .select('jd_id, posted_on, user_id')
  .eq('user_id', user.id)
 
  const jobPostingDateMap = new Map();
    (jobPostings || []).forEach(jp => {
      if (jp.jd_id && jp.posted_on) {
        jobPostingDateMap.set(jp.jd_id, jp.posted_on);
      }
    });

      console.log("Fetched job_postings:", jobPostings);
    // 3. Get all unique jobpost IDs (req_id in conversation is actually jobpost id)
    const jobpostIds = [...new Set((jobPostings || [])
      .map(c => c.jd_id)
      .filter(id => id && typeof id === 'string' && id.length > 0)
    )];

    // 4. Fetch jobpost details from domestic and corporate tables
    let jobpostMap = new Map(); // Map<jobpost_id, {jobpost data, req_id, sector}>
    
    if (jobpostIds.length > 0) {
      const [domesticJobposts, corporateJobposts] = await Promise.all([
        supabaseServer
          .from('domestic_crm_jobpost')
          .select('id, req_id, client_name, profile, location, package, status, assigned_date, assigned_to')
            .in('id', jobpostIds),
        
        supabaseServer
          .from('corporate_crm_jobpost')
          .select('id, req_id, client_name, profile, location, package, status, assigned_date, assigned_to')
           .in('id', jobpostIds),
      ]);
      
      domesticJobposts.data?.forEach(jobpost => {
        jobpostMap.set(jobpost.id, {
          ...jobpost,
          sector: 'Domestic',
          job_title: jobpost.profile // profile is the job title
        });
      });
      
      corporateJobposts.data?.forEach(jobpost => {
        if (!jobpostMap.has(jobpost.id)) {
          jobpostMap.set(jobpost.id, {
            ...jobpost,
            sector: 'Corporate',
            job_title: jobpost.profile // profile is the job title
          });
        }
      });
    
    }
    // 5. Get all unique req_ids from jobposts to fetch requirement details
    const reqIds = [...new Set(Array.from(jobpostMap.values()).map(jp => jp.req_id).filter(Boolean))];
    
    // 6. Fetch requirement details from req tables (both domestic and corporate)
    let reqDataMap = new Map(); // Map<req_id, requirement details>
    
    if (reqIds.length > 0) {
      const [domesticReq, corporateReq] = await Promise.all([
        supabaseServer
          .from('domestic_crm_reqs')
          .select('*')
          .in('req_id', reqIds),
        supabaseServer
          .from('corporate_crm_reqs')
          .select('*')
          .in('req_id', reqIds)
      ]);
      
      domesticReq.data?.forEach(req => {
        reqDataMap.set(req.req_id, { ...req, source: 'Domestic' });
      });
      
      corporateReq.data?.forEach(req => {
        if (!reqDataMap.has(req.req_id)) {
          reqDataMap.set(req.req_id, { ...req, source: 'Corporate' });
        }
      });
    }

    // 7. Get all parsing_ids from conversations
    const parsingIds = [...new Set((conversations || [])
      .map(c => c.parsing_id)
      .filter(id => id && typeof id === 'string' && id.length > 0)
    )];

    // 8. Fetch cv_parsing data for portal information
    let cvParsingMap = new Map();
    
    if (parsingIds.length > 0) {
      const batchSize = 100;
      
      for (let i = 0; i < parsingIds.length; i += batchSize) {
        const batch = parsingIds.slice(i, i + batchSize);
        const { data: cvParsingData, error: cvError } = await supabaseServer
          .from('cv_parsing')
          .select('id, portal')
          .in('id', batch);
        
        if (!cvError && cvParsingData) {
          cvParsingData.forEach(parsing => {
            cvParsingMap.set(parsing.id, parsing);
          });
        }
      }
    }

    // 9. Group by jobpost_id and calculate totals
    const jobDataMap = new Map(); // Map<jobpost_id, job data>
    const dailyPlatformStats = new Map(); // Map<platform, {cvs, calls}>

    (conversations || []).forEach(conv => {
      const cvParsing = conv.parsing_id ? cvParsingMap.get(conv.parsing_id) : null;
      const platform = cvParsing?.portal || 'Unknown';
      const platformLower = platform.toLowerCase();
      
      let portalKey = null;
      if (platformLower.includes('naukri')) portalKey = 'Naukri';
      else if (platformLower.includes('indeed')) portalKey = 'Indeed';
      else if (platformLower.includes('internshala')) portalKey = 'Internshala';
      else portalKey = 'Other';
      
      // Update daily platform stats
      if (!dailyPlatformStats.has(portalKey)) {
        dailyPlatformStats.set(portalKey, { cvs: 0, calls: 0 });
      }
      
      // Count CV (each parsing_id once per conversation)
      if (conv.parsing_id) {
        dailyPlatformStats.get(portalKey).cvs += 1;
      }
      
      // Count call
      const hasCall = (conv.calling_date || (conv.call_respond && conv.call_respond.trim() !== ''));
      if (hasCall) {
        dailyPlatformStats.get(portalKey).calls += 1;
      }
      
      // Group by jobpost_id (req_id in conversation)
      const jobpostId = conv.req_id;
      if (jobpostId && jobpostMap.has(jobpostId)) {
        if (!jobDataMap.has(jobpostId)) {
          jobDataMap.set(jobpostId, {
            jobpostId: jobpostId,
            conversations: [],
            platforms: new Set(),
            totalCvs: 0,
            totalCalls: 0,
            uniqueCandidates: new Set()
          });
        }
        
        const jobData = jobDataMap.get(jobpostId);
        jobData.conversations.push(conv);
        jobData.platforms.add(portalKey);
        
        if (conv.parsing_id) {
          jobData.uniqueCandidates.add(conv.parsing_id);
          jobData.totalCvs += 1;
        }
        
        const hasCallJob = (conv.calling_date || (conv.call_respond && conv.call_respond.trim() !== ''));
        if (hasCallJob) {
          jobData.totalCalls += 1;
        }
      }
    });

    // 10. Build jobs array with complete requirement details
    const jobs = [];
    for (const [jobpostId, jobData] of jobDataMap.entries()) {
      const jobpostInfo = jobpostMap.get(jobpostId);
      const reqInfo = jobpostInfo?.req_id ? reqDataMap.get(jobpostInfo.req_id) : null;
      const postedOnDate = jobPostingDateMap.get(jobpostId) || null;
      jobs.push({
        id: jobpostId,
        posted_on: postedOnDate,
        date: selectedDate,
        sector: jobpostInfo?.sector || 'Unknown',
        client_name: reqInfo?.client_name || jobpostInfo?.client_name || 'Unknown',
        job_title: reqInfo?.job_title || jobpostInfo?.job_title || 'N/A',
        profile: jobpostInfo?.profile || 'N/A',
        location: reqInfo?.location || jobpostInfo?.location || null,
        package: reqInfo?.package || jobpostInfo?.package || null,
        status: jobpostInfo?.status || reqInfo?.status || null,
        req_id: jobpostInfo?.req_id || null,
        platforms: Array.from(jobData.platforms),
        totalCvs: jobData.totalCvs,
        totalCalls: jobData.totalCalls,
        uniqueCandidates: jobData.uniqueCandidates.size,
        totalConversations: jobData.conversations.length,
        // Complete requirement details from req table
        jd_link: reqInfo?.jd_link || null,
        experience: reqInfo?.experience || null,
        openings: reqInfo?.openings || null,
        priority: reqInfo?.priority || null,
        timeline: reqInfo?.timeline || null,
        req_date: reqInfo?.date || null,
        employment_type: reqInfo?.employment_type || null,
        working_days: reqInfo?.working_days || null,
        timings: reqInfo?.timings || null,
        tool_req: reqInfo?.tool_req || null,
        job_summary: reqInfo?.job_summary || null,
        rnr: reqInfo?.rnr || null,
        req_skills: reqInfo?.req_skills || null,
        preferred_qual: reqInfo?.preferred_qual || null,
        company_offers: reqInfo?.company_offers || null,
        contact_details: reqInfo?.contact_details || null,
        branch_id: reqInfo?.branch_id || null,
        user_id: reqInfo?.user_id || null,
        created_at: reqInfo?.created_at || null
      });
    }

    // 11. Convert daily platform stats to array
    const stats = Array.from(dailyPlatformStats.entries()).map(([platform, data]) => ({
      platform: platform,
      cvsReceived: data.cvs,
      callingDone: data.calls
    }));

    // 12. Calculate lifetime platform totals (all time, unique per job)
    const { data: allConversations, error: allConversationsError } = await supabaseServer
      .from('candidates_conversation')
      .select('conversation_id, calling_date, call_respond, parsing_id, req_id')
      .eq('user_id', user.id)
      .not('req_id', 'is', null);

    if (allConversationsError) {
      console.error('Error fetching all conversations:', allConversationsError);
    }

    // Get all jobpost IDs from all conversations
    const allJobpostIds = [...new Set((allConversations || [])
      .map(c => c.req_id)
      .filter(id => id && typeof id === 'string' && id.length > 0)
    )];

    // Fetch all jobpost details to get sector info
    let allJobpostMap = new Map();
    if (allJobpostIds.length > 0) {
      const [allDomesticJobposts, allCorporateJobposts] = await Promise.all([
        supabaseServer
          .from('domestic_crm_jobpost')
          .select('id, req_id')
          .in('id', allJobpostIds),
        supabaseServer
          .from('corporate_crm_jobpost')
          .select('id, req_id')
          .in('id', allJobpostIds)
      ]);
      
      allDomesticJobposts.data?.forEach(jp => {
        allJobpostMap.set(jp.id, { req_id: jp.req_id, sector: 'Domestic' });
      });
      
      allCorporateJobposts.data?.forEach(jp => {
        if (!allJobpostMap.has(jp.id)) {
          allJobpostMap.set(jp.id, { req_id: jp.req_id, sector: 'Corporate' });
        }
      });
    }

    // Get all parsing_ids for lifetime totals
    const allParsingIds = [...new Set((allConversations || [])
      .map(c => c.parsing_id)
      .filter(id => id && typeof id === 'string' && id.length > 0)
    )];

    // Fetch cv_parsing data for all parsing_ids
    let allCvParsingMap = new Map();
    
    if (allParsingIds.length > 0) {
      const batchSize = 100;
      
      for (let i = 0; i < allParsingIds.length; i += batchSize) {
        const batch = allParsingIds.slice(i, i + batchSize);
        const { data: cvParsingData, error: cvError } = await supabaseServer
          .from('cv_parsing')
          .select('id, portal')
          .in('id', batch);
        
        if (!cvError && cvParsingData) {
          cvParsingData.forEach(parsing => {
            allCvParsingMap.set(parsing.id, parsing);
          });
        }
      }
    }

    // Track unique candidates PER JOB for lifetime totals
    const lifetimePerJobUniqueCandidates = new Map();
    const lifetimePerJobCalls = new Map();

    (allConversations || []).forEach(conv => {
      const cvParsing = conv.parsing_id ? allCvParsingMap.get(conv.parsing_id) : null;
      const platform = cvParsing?.portal || 'Unknown';
      const platformLower = platform.toLowerCase();
      
      let portalKey = null;
      if (platformLower.includes('naukri')) portalKey = 'naukri';
      else if (platformLower.includes('indeed')) portalKey = 'indeed';
      else if (platformLower.includes('internshala')) portalKey = 'internshala';
      else return;
      
      const jobpostId = conv.req_id;
      
      if (!lifetimePerJobUniqueCandidates.has(jobpostId)) {
        lifetimePerJobUniqueCandidates.set(jobpostId, new Map());
        lifetimePerJobCalls.set(jobpostId, new Map());
      }
      
      const jobUniqueMap = lifetimePerJobUniqueCandidates.get(jobpostId);
      const jobCallsMap = lifetimePerJobCalls.get(jobpostId);
      
      if (!jobUniqueMap.has(portalKey)) {
        jobUniqueMap.set(portalKey, new Set());
        jobCallsMap.set(portalKey, 0);
      }
      
      if (conv.parsing_id) {
        jobUniqueMap.get(portalKey).add(conv.parsing_id);
      }
      
      const hasCall = (conv.calling_date || (conv.call_respond && conv.call_respond.trim() !== ''));
      if (hasCall) {
        jobCallsMap.set(portalKey, jobCallsMap.get(portalKey) + 1);
      }
    });

    const platformTotals = {
      naukri: { cvs: 0, calls: 0 },
      indeed: { cvs: 0, calls: 0 },
      internshala: { cvs: 0, calls: 0 }
    };

    for (const [jobpostId, jobUniqueMap] of lifetimePerJobUniqueCandidates.entries()) {
      for (const [portal, uniqueSet] of jobUniqueMap.entries()) {
        platformTotals[portal].cvs += uniqueSet.size;
      }
    }

    for (const [jobpostId, jobCallsMap] of lifetimePerJobCalls.entries()) {
      for (const [portal, callCount] of jobCallsMap.entries()) {
        platformTotals[portal].calls += callCount;
      }
    }
    
    // Handle empty jobs array
    if (!jobs || jobs.length === 0) {
      return NextResponse.json({
        success: true,
        selectedDate: selectedDate,
        jobs: [],
        stats: stats,
        platformTotals: platformTotals,
        summary: {
          totalJobs: 0,
          totalConversations: conversations?.length || 0,
          totalUniqueCVs: 0,
          totalCalls: 0
        }
      });
    }
    
    const latestDate = jobs.reduce((latest, job) =>
      job.posted_on > latest ? job.posted_on : latest,
      jobs[0].posted_on
    );

    console.log("Latest date found in jobs:", jobs[0].posted_on);
    // Get all jobs with that date
    const latestJobs = jobs.filter(job => job.posted_on === latestDate);

    console.log("Jobs with latest date:", jobs.filter(job => job.posted_on));
    return NextResponse.json({
      success: true,
      selectedDate: selectedDate,
      jobs: latestJobs,
      stats: stats,
      platformTotals: platformTotals,
      summary: {
        totalJobs: latestJobs.length,
        totalConversations: conversations?.length || 0,
        totalUniqueCVs: latestJobs.reduce((sum, job) => sum + job.uniqueCandidates, 0),
        totalCalls: latestJobs.reduce((sum, job) => sum + job.totalCalls, 0)
      }
    });

  } catch (error) {
    console.error('Error in report-date API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 
