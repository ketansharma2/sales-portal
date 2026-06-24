// app/api/admin/operation-report/route.js
import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase-server";

// ===============================
// HELPER FUNCTIONS
// ===============================


// ===============================
// JOB POST KPI FUNCTIONS
// ===============================


// ===============================
// DELIVERY METRICS FUNCTIONS
// ===============================


// ===============================
// REVENUE METRICS FUNCTIONS
// ===============================

async function getRevenueMetrics(sector, startDate, endDate) {
  try {
    const isCorporate = sector === 'corporate';
    const revenueTableName = isCorporate ? 'corporate_revenue' : 'domestic_revenue';
    const candidateTrackTable = isCorporate ? 'corporate_candidate_track' : 'domestic_candidate_track';
    const paymentTrackTable = isCorporate ? 'corporate_payment_track' : 'domestic_payment_track';

    // Get revenue records filtered by date
    let revenueQuery = supabaseServer
      .from(revenueTableName)
      .select('revenue_id, total_with_gst, created_at');

    // Apply date filters
    if (startDate && endDate) {
      revenueQuery = revenueQuery.gte('sent_date', startDate).lte('sent_date', endDate);
    } else if (startDate) {
      revenueQuery = revenueQuery.gte('sent_date', startDate);
    } else if (endDate) {
      revenueQuery = revenueQuery.lte('sent_date', endDate);
    }

    const { data: revenueRecords, error: revenueError } = await revenueQuery;

    let recoveryBy = 0;
    let totalAmt = 0;
    let received = 0;
    let pending = 0;
    let partial = 0;

    if (revenueRecords && revenueRecords.length > 0) {
      const revenueIds = revenueRecords.map(r => r.revenue_id);
      
      // Get latest candidate statuses from track table
      const { data: candidateTracks } = await supabaseServer
        .from(candidateTrackTable)
        .select('revenue_id, candidate_status, created_at')
        .in('revenue_id', revenueIds)
        .order('created_at', { ascending: false });

      // Get latest payment statuses from track table
      const { data: paymentTracks } = await supabaseServer
        .from(paymentTrackTable)
        .select('revenue_id, payment_status, created_at')
        .in('revenue_id', revenueIds)
        .order('created_at', { ascending: false });

      // Build status maps (latest entry per revenue_id)
      const candidateStatusMap = {};
      if (candidateTracks) {
        candidateTracks.forEach(track => {
          if (track.candidate_status && !candidateStatusMap[track.revenue_id]) {
            candidateStatusMap[track.revenue_id] = track.candidate_status;
          }
        });
      }

      const paymentStatusMap = {};
      if (paymentTracks) {
        paymentTracks.forEach(track => {
          if (track.payment_status && !paymentStatusMap[track.revenue_id]) {
            paymentStatusMap[track.revenue_id] = track.payment_status;
          }
        });
      }

      // Calculate metrics
      revenueRecords.forEach(record => {
        const candidateStatus = candidateStatusMap[record.revenue_id] || 'Pending Join';
        const paymentStatus = paymentStatusMap[record.revenue_id] || 'Pending';
        const amount = parseFloat(record.total_with_gst) || 0;

        // Recovery By: candidate_status = 'Joined' or 'Working'
        if (candidateStatus === 'Joined' || candidateStatus === 'Working') {
          recoveryBy++;
          totalAmt += amount;
        }

        // Received: payment_status = 'Received'
        if (paymentStatus === 'Received') {
          received += amount;
        }

        // Pending: payment_status = 'Pending'
        if (paymentStatus === 'Pending') {
          pending += amount;
        }
         if (paymentStatus === 'Partial Payment') {
          partial += amount;
        }
      });
    }

    return {
      recoveryBy,
      totalAmt,
      received,
      pending,
      partial
    };
  } catch (error) {
    console.error(`Error fetching ${sector} revenue metrics:`, error);
    return {
      recoveryBy: 0,
      totalAmt: 0,
      received: 0,
      pending: 0
    };
  }
}

async function getDeliveryMetrics(sector, startDate, endDate) {
  try {
    const isCorporate = sector === 'corporate';
    
    // Get RC users for this sector
    const { data: rcUsers } = await supabaseServer
      .from('users')
      .select('user_id')
      .contains('role', ['RC'])
      .eq('sector', isCorporate ? 'Corporate' : 'Domestic');

    const { data: tlUsers } = await supabaseServer
      .from('users')
      .select('user_id')
      .contains('role', ['TL'])
      .eq('sector', isCorporate ? 'Corporate' : 'Domestic');

    const rcUserIds = rcUsers?.map(u => u.user_id) || [];

    // 1. CV Parse - from cv_parsing
    let cvParseQuery = supabaseServer
      .from('cv_parsing')
      .select('id', { count: 'exact' });

    if (rcUserIds.length > 0) {
      cvParseQuery = cvParseQuery.in('user_id', rcUserIds);
    }

    if (startDate && endDate) {
      cvParseQuery = cvParseQuery.gte('portal_date', startDate).lte('portal_date', endDate);
    } else if (startDate) {
      cvParseQuery = cvParseQuery.gte('portal_date', startDate);
    } else if (endDate) {
      cvParseQuery = cvParseQuery.lte('portal_date', endDate);
    }

    const { count: cvParse } = await cvParseQuery;

    // 2. Tracker Share - RC to TL (sent_to_tl is not null)
    let trackerShareRCQuery = supabaseServer
      .from('candidates_conversation')
      .select('conversation_id', { count: 'exact' })
      .not('sent_to_tl', 'is', null);

    if (rcUserIds.length > 0) {
      trackerShareRCQuery = trackerShareRCQuery.in('user_id', rcUserIds);
    }

    if (startDate && endDate) {
      trackerShareRCQuery = trackerShareRCQuery.gte('sent_date', startDate).lte('sent_date', endDate);
    } else if (startDate) {
      trackerShareRCQuery = trackerShareRCQuery.gte('sent_date', startDate);
    } else if (endDate) {
      trackerShareRCQuery = trackerShareRCQuery.lte('sent_date', endDate);
    }

    const { count: trackerShareRC } = await trackerShareRCQuery;

    // 3. Tracker Share - TL to CRM (sent_to_crm is not null)
    let trackerShareTLQuery = supabaseServer
      .from('candidates_conversation')
      .select('conversation_id', { count: 'exact' })
      .not('sent_to_crm', 'is', null);

    if (rcUserIds.length > 0) {
      trackerShareTLQuery = trackerShareTLQuery.in('user_id', rcUserIds);
    }

    if (startDate && endDate) {
      trackerShareTLQuery = trackerShareTLQuery.gte('crm_sent_date', startDate).lte('crm_sent_date', endDate);
    } else if (startDate) {
      trackerShareTLQuery = trackerShareTLQuery.gte('crm_sent_date', startDate);
    } else if (endDate) {
      trackerShareTLQuery = trackerShareTLQuery.lte('crm_sent_date', endDate);
    }

    const { count: trackerShareTL } = await trackerShareTLQuery;

    // 4. Tracker Share - CRM (cv_status is not null)
    const revenueTable = isCorporate ? 'corporate_crm_emails' : 'domestic_crm_emails';
    
    let trackerShareCRMQuery = supabaseServer
      .from(revenueTable)
      .select('id', { count: 'exact' });
      

    

    if (startDate && endDate) {
      trackerShareCRMQuery = trackerShareCRMQuery.gte('shared_date', startDate).lte('shared_date', endDate);
    } else if (startDate) {
      trackerShareCRMQuery = trackerShareCRMQuery.gte('shared_date', startDate);
    } else if (endDate) {
      trackerShareCRMQuery = trackerShareCRMQuery.lte('shared_date', endDate);
    }

    const { count: trackerShareCRM } = await trackerShareCRMQuery;

    // 5. Total Trackers Received (sent_to_tl is not null for these RCs)
    let totalTrackersQuery = supabaseServer
      .from('candidates_conversation')
      .select('conversation_id', { count: 'exact' })
      .not('sent_to_tl', 'is', null);

    if (rcUserIds.length > 0) {
      totalTrackersQuery = totalTrackersQuery.in('user_id', rcUserIds);
    }

    if (startDate && endDate) {
      totalTrackersQuery = totalTrackersQuery.gte('sent_date', startDate).lte('sent_date', endDate);
    } else if (startDate) {
      totalTrackersQuery = totalTrackersQuery.gte('sent_date', startDate);
    } else if (endDate) {
      totalTrackersQuery = totalTrackersQuery.lte('sent_date', endDate);
    }

    const { count: totalTrackersReceived } = await totalTrackersQuery;

    // 6. Tracker Sent to CRM (sent_to_crm is not null)
    let trackerSentToCrmQuery = supabaseServer
      .from('candidates_conversation')
      .select('conversation_id', { count: 'exact' })
      .not('sent_to_crm', 'is', null);

    if (rcUserIds.length > 0) {
      trackerSentToCrmQuery = trackerSentToCrmQuery.in('user_id', rcUserIds);
    }

    if (startDate && endDate) {
      trackerSentToCrmQuery = trackerSentToCrmQuery.gte('crm_sent_date', startDate).lte('crm_sent_date', endDate);
    } else if (startDate) {
      trackerSentToCrmQuery = trackerSentToCrmQuery.gte('crm_sent_date', startDate);
    } else if (endDate) {
      trackerSentToCrmQuery = trackerSentToCrmQuery.lte('crm_sent_date', endDate);
    }

    const { count: trackerSentToCrm } = await trackerSentToCrmQuery;

    // 7. Rejected CV (cv_status = 'Rejected')
    let rejectedQuery = supabaseServer
      .from('candidates_conversation')
      .select('conversation_id', { count: 'exact' })
      .eq('cv_status', 'Rejected');

    if (rcUserIds.length > 0) {
      rejectedQuery = rejectedQuery.in('user_id', rcUserIds);
    }

    if (startDate && endDate) {
      rejectedQuery = rejectedQuery.gte('sent_date', startDate).lte('sent_date', endDate);
    } else if (startDate) {
      rejectedQuery = rejectedQuery.gte('sent_date', startDate);
    } else if (endDate) {
      rejectedQuery = rejectedQuery.lte('sent_date', endDate);
    }

    const { count: rejectedCv } = await rejectedQuery;

    // 8. Not Responding (call_respond = 'No')
    let notRespondingQuery = supabaseServer
      .from('candidates_conversation')
      .select('conversation_id', { count: 'exact' })
      .eq('call_respond', 'No');

    if (rcUserIds.length > 0) {
      notRespondingQuery = notRespondingQuery.in('user_id', rcUserIds);
    }

    if (startDate && endDate) {
      notRespondingQuery = notRespondingQuery.gte('sent_date', startDate).lte('sent_date', endDate);
    } else if (startDate) {
      notRespondingQuery = notRespondingQuery.gte('sent_date', startDate);
    } else if (endDate) {
      notRespondingQuery = notRespondingQuery.lte('sent_date', endDate);
    }

    const { count: notResponding } = await notRespondingQuery;

    // 9. JD Match (cv_status = 'JD Match')
    let jdMatchQuery = supabaseServer
      .from('candidates_conversation')
      .select('conversation_id', { count: 'exact' })
      .eq('cv_status', 'JD Match');

    if (rcUserIds.length > 0) {
      jdMatchQuery = jdMatchQuery.in('user_id', rcUserIds);
    }

    if (startDate && endDate) {
      jdMatchQuery = jdMatchQuery.gte('sent_date', startDate).lte('sent_date', endDate);
    } else if (startDate) {
      jdMatchQuery = jdMatchQuery.gte('sent_date', startDate);
    } else if (endDate) {
      jdMatchQuery = jdMatchQuery.lte('sent_date', endDate);
    }

    const { count: jdMatchCount } = await jdMatchQuery;

    // 10. Pipeline CV = Total - Rejected - Sent to CRM - Not responding
    const pipelineCv = (totalTrackersReceived || 0) - (rejectedCv || 0) - (trackerSentToCrm || 0) - (notResponding || 0);

    // 11. Delayed Pipeline CV (sent_to_crm is null AND sent_date < today - 2 days)
    const today = new Date();
    const twoDaysAgo = new Date(today);
    twoDaysAgo.setDate(today.getDate() - 2);
    const twoDaysAgoStr = twoDaysAgo.toISOString().split('T')[0];

    let delayedQuery = supabaseServer
      .from('candidates_conversation')
      .select('conversation_id', { count: 'exact' })
      .is('sent_to_crm', null);

    if (rcUserIds.length > 0) {
      delayedQuery = delayedQuery.in('user_id', rcUserIds);
    }

    delayedQuery = delayedQuery.lt('sent_date', twoDaysAgoStr);

    const { count: delayedPipelineCv } = await delayedQuery;

const interviewTable = isCorporate ? 'corporate_crm_interview' : 'domestic_crm_interview';
    // 12. Interview Count
    let interviewQuery = supabaseServer
      .from(interviewTable)
      .select('email_draft_id', { count: 'exact' })
      .eq('interview_status', 'Interviewed');

    // if (rcUserIds.length > 0) {
    //   interviewQuery = interviewQuery.in('user_id', rcUserIds);
    // }

    if (startDate && endDate) {
      interviewQuery = interviewQuery.gte('date', startDate).lte('date', endDate);
    } else if (startDate) {
      interviewQuery = interviewQuery.gte('date', startDate);
    } else if (endDate) {
      interviewQuery = interviewQuery.lte('date', endDate);
    }
    
const { data: interviewData, error: interviewError } = await interviewQuery;

   const uniqueEmailDraftIds = new Set();
if (!interviewError && interviewData) {
  interviewData.forEach(item => {
    if (item.email_draft_id) {
      uniqueEmailDraftIds.add(item.email_draft_id);
    }
  });
}
const interview = uniqueEmailDraftIds.size;

  
      
    let joiningQuery = supabaseServer
      .from(interviewTable)
      .select('email_draft_id', { count: 'exact' })
      .eq('interview_status', 'Joining');

    // if (rcUserIds.length > 0) {
    //   joiningQuery = joiningQuery.in('user_id', rcUserIds);
    // }

    if (startDate && endDate) {
      joiningQuery = joiningQuery.gte('date', startDate).lte('date', endDate);
    } else if (startDate) {
      joiningQuery = joiningQuery.gte('date', startDate);
    } else if (endDate) {
      joiningQuery = joiningQuery.lte('date', endDate);
    }

    const { count: joining } = await joiningQuery;

    return {
      // RC Metrics
      cvParse: cvParse || 0,
      trackerShareRC: trackerShareRC || 0,
      trackerShareTL: trackerShareTL || 0,
      trackerShareCRM: trackerShareCRM || 0,
      
      // TL Metrics
      totalTrackersReceived: totalTrackersReceived || 0,
      trackerSentToCrm: trackerSentToCrm || 0,
      rejectedCv: rejectedCv || 0,
      notResponding: notResponding || 0,
      pipelineCv: pipelineCv > 0 ? pipelineCv : 0,
      jdMatchCount: jdMatchCount || 0,
      delayedPipelineCv: delayedPipelineCv || 0,
      
      // CRM Metrics
      interview: interview || 0,
      joining: joining || 0,
      
      // Placeholder metrics
      recoveryBy: "-",
      totalAmt: "-",
      received: "-",
      pending: "-"
    };
  } catch (error) {
    console.error(`Error fetching ${sector} delivery metrics:`, error);
    return {
      cvParse: 0,
      trackerShareRC: 0,
      trackerShareTL: 0,
      trackerShareCRM: 0,
      totalTrackersReceived: 0,
      trackerSentToCrm: 0,
      rejectedCv: 0,
      notResponding: 0,
      pipelineCv: 0,
      jdMatchCount: 0,
      delayedPipelineCv: 0,
      interview: 0,
      joining: 0,
      recoveryBy: "-",
      totalAmt: "-",
      received: "-",
      pending: "-"
    };
  }
}

async function getJobPostKPIs(startDate, endDate) {
  try {
    // Get all job posts from both domestic and corporate
    const [domesticJobs, corporateJobs] = await Promise.all([
      supabaseServer
        .from('domestic_crm_jobpost')
        .select('*'),
      supabaseServer
        .from('corporate_crm_jobpost')
        .select('*')
    ]);

    if (domesticJobs.error || corporateJobs.error) {
      console.error('Error fetching job posts:', domesticJobs.error || corporateJobs.error);
      return {
        total: 0,
        open: 0,
        paused: 0,
        flagged: 0,
        closed: 0,
        pending: 0,
        totalCVs: 0,
        totalCalls: 0,
        cvByJobPost: 0,
        cvCalling: 0
      };
    }

    const domesticData = domesticJobs.data || [];
    const corporateData = corporateJobs.data || [];

    // Combine all job posts
    const allJobPosts = [
      ...domesticData.map(item => ({ ...item, job_type: 'domestic' })),
      ...corporateData.map(item => ({ ...item, job_type: 'corporate' }))
    ];

    // Apply date filter if provided
    let filteredJobs = allJobPosts;
    if (startDate && endDate) {
      filteredJobs = allJobPosts.filter(job => {
        const jobDate = job.assigned_date || job.created_at?.split('T')[0];
        if (!jobDate) return false;
        return jobDate >= startDate && jobDate <= endDate;
      });
    } else if (startDate) {
      filteredJobs = allJobPosts.filter(job => {
        const jobDate = job.assigned_date || job.created_at?.split('T')[0];
        if (!jobDate) return false;
        return jobDate >= startDate;
      });
    } else if (endDate) {
      filteredJobs = allJobPosts.filter(job => {
        const jobDate = job.assigned_date || job.created_at?.split('T')[0];
        if (!jobDate) return false;
        return jobDate <= endDate;
      });
    }

    // Count by status
    const total = filteredJobs.length;
    const open = filteredJobs.filter(job => 
      job.status === 'Open' 
    ).length;
    const paused = filteredJobs.filter(job => 
      job.status === 'Paused' || job.status === 'Hold'
    ).length;
    const flagged = filteredJobs.filter(job => 
      job.status === 'Flagged' || job.status === 'Issue'
    ).length;
    const closed = filteredJobs.filter(job => 
      job.status === 'Closed' || job.status === 'Deleted' || job.status === 'Completed'
    ).length;
    const pending = filteredJobs.filter(job => 
      job.status === 'Pending' || job.status === 'Sent' || !job.status
    ).length;

    // Get CV and calling data from candidates_conversation
    const jdIds = [...new Set(filteredJobs.map(job => job.id).filter(Boolean))];
    
    let totalCVs = 0;
    let totalCalls = 0;
    let cvByJobPost = 0;
    let cvCalling = 0;

    if (jdIds.length > 0) {
      // Get conversations for these job posts
      const { data: conversations, error: convError } = await supabaseServer
        .from('candidates_conversation')
        .select('*')
        .in('req_id', jdIds);

      if (!convError && conversations) {
        // Get unique candidates per job post
        const uniqueCandidatesPerJob = new Map();
        const callsPerJob = new Map();

        conversations.forEach(conv => {
          const jobId = conv.req_id;
          
          // Count unique candidates (CVs)
          if (!uniqueCandidatesPerJob.has(jobId)) {
            uniqueCandidatesPerJob.set(jobId, new Set());
          }
          if (conv.parsing_id) {
            uniqueCandidatesPerJob.get(jobId).add(conv.parsing_id);
          }

          // Count calls
          if (!callsPerJob.has(jobId)) {
            callsPerJob.set(jobId, 0);
          }
          callsPerJob.set(jobId, callsPerJob.get(jobId) + 1);
        });

        // Calculate totals
        uniqueCandidatesPerJob.forEach((candidates) => {
          totalCVs += candidates.size;
        });

        callsPerJob.forEach((count) => {
          totalCalls += count;
        });

        // CV by job post (average)
        cvByJobPost = filteredJobs.length > 0 ? Math.round(totalCVs / filteredJobs.length) : 0;

        // CV Calling (calls per CV)
        cvCalling = totalCVs > 0 ? Math.round(totalCalls / totalCVs) : 0;
      }
    }

    return {
      total,
      open,
      paused,
      flagged,
      closed,
      pending,
      totalCVs,
      totalCalls,
      cvByJobPost,
      cvCalling
    };
  } catch (error) {
    console.error('Error fetching job post KPIs:', error);
    return {
      total: 0,
      open: 0,
      paused: 0,
      flagged: 0,
      closed: 0,
      pending: 0,
      totalCVs: 0,
      totalCalls: 0,
      cvByJobPost: 0,
      cvCalling: 0
    };
  }
}

const getInteractionDate = (interaction) => {
  const date = interaction.date;
  const createdAt = interaction.created_at;
  
  if (date) {
    return typeof date === 'string' ? date.split('T')[0] : date;
  }
  
  if (createdAt) {
    return typeof createdAt === 'string' ? createdAt.split('T')[0] : createdAt;
  }
  
  return null;
};

// Helper function to apply date filters
const applyDateFilter = (query, dateColumn = 'created_at', startDate, endDate) => {
  if (startDate && endDate) {
    return query.gte(dateColumn, startDate).lte(dateColumn, endDate);
  }
  if (startDate) {
    return query.gte(dateColumn, startDate);
  }
  if (endDate) {
    return query.lte(dateColumn, endDate);
  }
  return query;
};

// Helper function to safely execute queries
const safeQuery = async (queryFn) => {
  try {
    const result = await queryFn();
    return { data: result.data || [], error: null, count: result.count || 0 };
  } catch (error) {
    console.error('Query error:', error.message);
    return { data: [], error: error.message, count: 0 };
  }
};

// ===============================
// FRANCHISE STATS FUNCTIONS - MATCHING INDIVIDUAL API EXACTLY
// ===============================

async function getFranchiseStats(leadgenIds, startDate, endDate) {
  // Handle both single ID and array of IDs
  const leadgenIdArray = Array.isArray(leadgenIds) ? leadgenIds : [leadgenIds];
  
  if (leadgenIdArray.length === 0 || (leadgenIdArray.length === 1 && !leadgenIdArray[0])) {
    return {
      discussed: 0,
      formAsk: 0,
      formShared: 0,
      acceptance: 0,
      total: 0
    };
  }

  try {
    // STEP 1: Get ALL interactions (same as individual API)
    const { data: allInteractions, error } = await supabaseServer
      .from('corporate_leads_interaction')
      .select('id, client_id, date, created_at, franchise_status')
      .in('leadgen_id', leadgenIdArray)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error fetching franchise interactions:', error);
      throw error;
    }

    // STEP 2: Filter by status for EACH metric (matching individual API)
    // For DISCUSSED: Exclude "no franchise discuss"
    const discussedInteractions = (allInteractions || []).filter(interaction => {
      const fs = interaction.franchise_status;
      if (!fs) return false;
      const fsLower = fs.toLowerCase();
      return !fsLower.includes('no franchise discuss');
    });

    // For FORM ASK & FORM SHARED: Contains "application form share"
    const formAskInteractions = (allInteractions || []).filter(interaction => {
      const fs = interaction.franchise_status;
      if (!fs) return false;
      const fsLower = fs.toLowerCase();
      return fsLower.includes('application form share');
    });

    // For ACCEPTANCE: Contains or equals "form filled"
    const acceptanceInteractions = (allInteractions || []).filter(interaction => {
      const fs = interaction.franchise_status;
      if (!fs) return false;
      const fsLower = fs.toLowerCase();
      const statusLower = 'form filled';
      return fsLower.includes(statusLower) || fsLower === statusLower;
    });

    // STEP 3: Get FIRST interaction per client for each metric (matching individual API)
    const getFirstPerClient = (interactions) => {
      const map = new Map();
      interactions.forEach(interaction => {
        const clientId = interaction.client_id;
        if (!map.has(clientId)) {
          map.set(clientId, interaction);
        }
      });
      return Array.from(map.values());
    };

    let discussedFirst = getFirstPerClient(discussedInteractions);
    let formAskFirst = getFirstPerClient(formAskInteractions);
    let formSharedFirst = getFirstPerClient(formAskInteractions); // Same as form ask
    let acceptanceFirst = getFirstPerClient(acceptanceInteractions);

    // STEP 4: Apply date filter (client-side, matching individual API)
    const applyDateFilterToInteractions = (interactions) => {
      if (!startDate && !endDate) return interactions;
      
      return interactions.filter(interaction => {
        const interactionDate = getInteractionDate(interaction);
        if (!interactionDate) return false;
        
        if (startDate && endDate) {
          return interactionDate >= startDate && interactionDate <= endDate;
        } else if (startDate) {
          return interactionDate >= startDate;
        } else if (endDate) {
          return interactionDate <= endDate;
        }
        return true;
      });
    };

    discussedFirst = applyDateFilterToInteractions(discussedFirst);
    formAskFirst = applyDateFilterToInteractions(formAskFirst);
    formSharedFirst = applyDateFilterToInteractions(formSharedFirst);
    acceptanceFirst = applyDateFilterToInteractions(acceptanceFirst);

    // STEP 5: Count
    const discussed = discussedFirst.length;
    const formAsk = formAskFirst.length;
    const formShared = formSharedFirst.length;
    const acceptance = acceptanceFirst.length;
    const total = discussed; // Total is discussed count

    console.log('Franchise Stats:', { discussed, formAsk, formShared, acceptance, total });

    return {
      discussed,
      formAsk,
      formShared,
      acceptance,
      total
    };
  } catch (error) {
    console.error('Error in getFranchiseStats:', error);
    return {
      discussed: 0,
      formAsk: 0,
      formShared: 0,
      acceptance: 0,
      total: 0
    };
  }
}

// ===============================
// MAIN GET HANDLER
// ===============================

export async function GET(request) {
  try {
    // 🔒 Authentication
    const authHeader = request.headers.get('authorization')
    if (!authHeader) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authError } = await supabaseServer.auth.getUser(token)
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }

    // Get user profile
    const { data: userProfile, error: profileError } = await supabaseServer
      .from('users')
      .select('role, user_id, manager_id')
      .eq('user_id', user.id)
      .single();

    if (profileError || !userProfile) {
      return NextResponse.json({ error: 'User profile not found' }, { status: 404 });
    }

    // 📊 Get URL parameters
    const url = new URL(request.url);
    const startDate = url.searchParams.get('startDate');
    const endDate = url.searchParams.get('endDate');

    // 📊 Get leadgen IDs - MATCHING INDIVIDUAL APIS
    let leadgenIds = [];
    
    // Check if user is MANAGER (matching individual APIs)
    if (userProfile.role && userProfile.role.includes('MANAGER')) {
      // If manager, get all leadgens under this manager
      const { data: leadgenUsers, error: leadgenError } = await supabaseServer
        .from('users')
        .select('user_id')
        .eq('manager_id', userProfile.user_id)
        .contains('role', ['LEADGEN']);
      
      if (!leadgenError && leadgenUsers) {
        leadgenIds = leadgenUsers.map(u => u.user_id);
      }
    } else {
      // If admin, get all corporate leadgens
      const { data: leadgenUsers, error: leadgenError } = await supabaseServer
        .from('users')
        .select('user_id')
        .contains('role', ['LEADGEN'])
        .eq('sector', 'Corporate');
      
      if (!leadgenError && leadgenUsers) {
        leadgenIds = leadgenUsers.map(u => u.user_id);
      }
    }

    console.log("leadgenIds:", leadgenIds);
    console.log("Date Range:", startDate, "to", endDate);

    // 📊 USERS
    const usersResult = await safeQuery(async () => {
      let query = supabaseServer
        .from('users')
        .select('*', { count: 'exact', head: true });
      return await query;
    });

    // 📊 CORPORATE LEADS
    const leadsCorpResult = await safeQuery(async () => {
      let query = supabaseServer
        .from('corporate_leadgen_leads')
        .select('*', { count: 'exact', head: true });
      query = applyDateFilter(query, 'created_at', startDate, endDate);
      return await query;
    });

    // 📊 DOMESTIC LEADS
    const leadsDomsResult = await safeQuery(async () => {
      let query = supabaseServer
        .from('domestic_clients')
        .select('*', { count: 'exact', head: true });
      query = applyDateFilter(query, 'created_at', startDate, endDate);
      return await query;
    });

    // 📊 DOMESTIC ONBOARD
    const onboardDomsResult = await safeQuery(async () => {
      let query = supabaseServer
        .from('domestic_crm_clients')
        .select('*', { count: 'exact', head: true });
      query = applyDateFilter(query, 'created_at', startDate, endDate);
      return await query;
    });

    // 📊 CORPORATE ONBOARD
    const onboardCorpResult = await safeQuery(async () => {
      let query = supabaseServer
        .from('corporate_crm_clients')
        .select('*', { count: 'exact', head: true });
      query = applyDateFilter(query, 'created_at', startDate, endDate);
      return await query;
    });

    // 📊 DOMESTIC PROFILES
    const profDomsResult = await safeQuery(async () => {
      let query = supabaseServer
        .from('domestic_crm_reqs')
        .select('*', { count: 'exact', head: true });
      query = applyDateFilter(query, 'date', startDate, endDate);
      return await query;
    });

    // 📊 CORPORATE PROFILES
    const profCorpsResult = await safeQuery(async () => {
      let query = supabaseServer
        .from('corporate_crm_reqs')
        .select('*', { count: 'exact', head: true });
      query = applyDateFilter(query, 'date', startDate, endDate);
      return await query;
    });

    // 📊 DOMESTIC REQUIREMENTS WITH OPENINGS
    const profReqDomsResult = await safeQuery(async () => {
      let query = supabaseServer
        .from('domestic_crm_reqs')
        .select('openings')
        .not('openings', 'is', null);
      query = applyDateFilter(query, 'date', startDate, endDate);
      return await query;
    });
    const totalDomRequirements = (profReqDomsResult.data || []).reduce(
      (sum, row) => sum + (parseInt(row.openings) || 0), 0
    );

    // 📊 CORPORATE REQUIREMENTS WITH OPENINGS
    const profReqCorpResult = await safeQuery(async () => {
      let query = supabaseServer
        .from('corporate_crm_reqs')
        .select('openings')
        .not('openings', 'is', null);
      query = applyDateFilter(query, 'date', startDate, endDate);
      return await query;
    });
    const totalCopRequirements = (profReqCorpResult.data || []).reduce(
      (sum, row) => sum + (parseInt(row.openings) || 0), 0
    );

    // 📊 DOMESTIC PACKAGE (CTC)
    const packageDomsResult = await safeQuery(async () => {
      let query = supabaseServer
        .from('domestic_crm_reqs')
        .select('openings,package')
        .not('package', 'is', null)
        .not('openings', 'is', null);
      query = applyDateFilter(query, 'date', startDate, endDate);
      return await query;
    });
   
    const totalPackageDoms = (packageDomsResult.data || []).reduce((sum, row) => {
      const openings = parseInt(row.openings) || 0
      const pkgStr = String(row.package || '').trim()
      const numericMatch = pkgStr.match(/(\d+(?:\.\d+)?)/)
      const pkgValue = numericMatch ? parseFloat(numericMatch[1]) : 0
      return sum + (openings * pkgValue)
    }, 0)

    // 📊 CORPORATE PACKAGE (CTC)
    const packageCorpResult = await safeQuery(async () => {
      let query = supabaseServer
        .from('corporate_crm_reqs')
        .select('openings,package')
        .not('package', 'is', null)
        .not('openings', 'is', null);
      query = applyDateFilter(query, 'date', startDate, endDate);
      return await query;
    });
    
    const totalPackageCorp = (packageCorpResult.data || []).reduce((sum, row) => {
      const openings = parseInt(row.openings) || 0
      const pkgStr = String(row.package || '').trim()
      const numericMatch = pkgStr.match(/(\d+(?:\.\d+)?)/)
      const pkgValue = numericMatch ? parseFloat(numericMatch[1]) : 0
      return sum + (openings * pkgValue)
    }, 0)

    // 📊 FRANCHISE STATS - Now matching individual APIs exactly
    const franchiseStats = await getFranchiseStats(leadgenIds, startDate, endDate);

    console.log("Franchise Stats Result:", franchiseStats);

    // 📊 JOB POST KPIs
const jobPostKPIs = await getJobPostKPIs(startDate, endDate);

console.log("Job Post KPIs:", jobPostKPIs);

// 📊 DELIVERY METRICS - Corporate
const deliveryCorporateMetrics = await getDeliveryMetrics('corporate', startDate, endDate);

// 📊 DELIVERY METRICS - Domestic
const deliveryDomesticMetrics = await getDeliveryMetrics('domestic', startDate, endDate);

console.log("Delivery Corporate Metrics:", deliveryCorporateMetrics);
console.log("Delivery Domestic Metrics:", deliveryDomesticMetrics);
  

const corporateRevenueMetrics = await getRevenueMetrics('corporate', startDate, endDate);
const domesticRevenueMetrics = await getRevenueMetrics('domestic', startDate, endDate);

console.log("Revenue Corporate Metrics:", corporateRevenueMetrics);
console.log("Revenue Domestic Metrics:", domesticRevenueMetrics);
    // Get counts from results
    const totalUsers = usersResult.count || 0;
    const totalLeadsCorp = leadsCorpResult.count || 0;
    const totalLeadsDoms = leadsDomsResult.count || 0;
    const totalOnboardDoms = onboardDomsResult.count || 0;
    const totalOnboardCorp = onboardCorpResult.count || 0;
    const totalProfDoms = profDomsResult.count || 0;
    const totalProfCorps = profCorpsResult.count || 0;

    // ✅ Return ALL data for the operations report
    return NextResponse.json({
      success: true,
      data: {
        totalUsers: totalUsers || 0,
        corporate: {
          leads: totalLeadsCorp || 0,
          pipelineClients: "-",
          onboard: totalOnboardCorp || 0,
          requirementProfiles: totalProfCorps || 0,
          totalRequirements: totalCopRequirements || 0,
          totalCTC: totalPackageCorp || 0,
          franchise: {
            discussed: franchiseStats.discussed || 0,
            formAsk: franchiseStats.formAsk || 0,
            formShared: franchiseStats.formShared || 0,
            acceptance: franchiseStats.acceptance || 0,
            total: franchiseStats.total || 0
          }
        },
        domestic: {
          leads: totalLeadsDoms || 0,
          pipelineClients: "-",
          onboard: totalOnboardDoms || 0,
          requirementProfiles: totalProfDoms || 0,
          totalRequirements: totalDomRequirements || 0,
          totalCTC: totalPackageDoms || 0,
          jobPosts: {
            total: jobPostKPIs.total || 0,
    open: jobPostKPIs.open || 0,
    paused: jobPostKPIs.paused || 0,
    flagged: jobPostKPIs.flagged || 0,
    cvByJobPost: jobPostKPIs.totalCVs || 0,
    cvCalling: jobPostKPIs.totalCalls || 0,
    totalCVs: jobPostKPIs.totalCVs || 0,
    totalCalls: jobPostKPIs.totalCalls || 0,
    closed: jobPostKPIs.closed || 0,
    pending: jobPostKPIs.pending || 0
          }
        },
      deliveryCorporate: {
  rc: {
    cvParse: deliveryCorporateMetrics.cvParse || 0,
    trackerShareRC: deliveryCorporateMetrics.trackerShareRC || 0,
    trackerShareTL: deliveryCorporateMetrics.trackerShareTL || 0,
    trackerShareCRM: deliveryCorporateMetrics.trackerShareCRM || 0
  },
  crm: {
    interview: deliveryCorporateMetrics.interview || 0,
    joining: deliveryCorporateMetrics.joining || 0,
    recoveryBy: corporateRevenueMetrics.recoveryBy || "-",
    totalAmt: corporateRevenueMetrics.totalAmt || "-",
    received: corporateRevenueMetrics.received || "-",
    pending: corporateRevenueMetrics.pending || "-",
    partial:corporateRevenueMetrics.partial || "-"
  }
},
deliveryDomestic: {
  rc: {
    cvParse: deliveryDomesticMetrics.cvParse || 0,
    trackerShareRC: deliveryDomesticMetrics.trackerShareRC || 0,
    trackerShareTL: deliveryDomesticMetrics.trackerShareTL || 0,
    trackerShareCRM: deliveryDomesticMetrics.trackerShareCRM || 0
  },
  crm: {
    interview: deliveryDomesticMetrics.interview || 0,
    joining: deliveryDomesticMetrics.joining || 0,
    recoveryBy: domesticRevenueMetrics.recoveryBy || "-",
    totalAmt: domesticRevenueMetrics.totalAmt || "-",
    received: domesticRevenueMetrics.received || "-",
    pending: domesticRevenueMetrics.pending || "-",
    partial:domesticRevenueMetrics.partial || "-"
  }
},
        tech: {
          dataMgmt: {
            sheets:"-",
            mailId: "-",
            tools: "-",
            dataCleanup: "-"
          },
          monitor: {
            scanner: {
              application: "-",
              company: "-",
              user: "-"
            },
            searchbar: {
              cvUploaded: "-",
              view: "-",
              cvDownload: "-",
              user: "-"
            },
            wpr: {
              totalUser: "-",
              fill: "-"
            },
            salesDelivery: {
              totalUser: totalUsers || 0
            }
          },
          development: {
            inHouse: {
              total:"-",
              done: "-",
              inProgress:"-",
              pending: "-"
            },
            outSource: {
              total: "-",
              done: "-",
              inProgress: "-",
              pending: "-"
            }
          },
          digitalMarketing: {
            inHouse: {
              company: "-",
              platforms: "-",
              pages: "-",
              postDesign: "-",
              postPublish: "-",
              linkedinConnections: {
                bhavishya: "-",
                ketan: "-"
              }
            },
            outSource: {
              postPublish: "-",
              leadsGen: "-"
            }
          }
        },
        raw: {
          totalUsers,
          totalLeadsCorp,
          totalLeadsDoms,
          totalOnboardDoms,
          totalOnboardCorp,
          totalProfDoms,
          totalProfCorps,
          totalDomRequirements,
          totalCopRequirements,
          totalPackageDoms,
          totalPackageCorp,
          franchise: franchiseStats
        }
      },
      filters: {
        startDate: startDate || null,
        endDate: endDate || null,
        leadgenIds: leadgenIds.length > 0 ? leadgenIds : 'All'
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('API Error:', error);
    
    return NextResponse.json({
      success: false,
      error: error.message,
      message: 'Failed to fetch operation report data'
    }, { status: 500 });
  }
}