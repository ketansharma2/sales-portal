import { supabaseServer } from '@/lib/supabase-server'
import { NextResponse } from 'next/server'

export async function GET(request) {
  try {
    // ✅ Auth check
    const authHeader = request.headers.get('authorization')
    if (!authHeader) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authError } = await supabaseServer.auth.getUser(token)

    if (authError || !user) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }

    // ✅ Fetch BOTH jobpost tables
    const [domesticRes, corporateRes] = await Promise.all([
      supabaseServer
        .from('domestic_crm_jobpost')
        .select('*')
        .eq('assigned_to', user.user_id || user.id), // Fetch only assigned jobposts for the authenticated user

      supabaseServer
        .from('corporate_crm_jobpost')
        .select('*').eq('assigned_to', user.user_id || user.id) // Fetch only assigned jobposts for the authenticated user
    ])

    if (domesticRes.error || corporateRes.error) {
      return NextResponse.json({
        error: 'Failed to fetch jobposts',
        details: domesticRes.error?.message || corporateRes.error?.message
      }, { status: 500 })
    }

    const domesticData = domesticRes.data || []
    const corporateData = corporateRes.data || []

    // ✅ Add job_type
    const combinedJobposts = [
      ...domesticData.map(item => ({ ...item, job_type: 'domestic' })),
      ...corporateData.map(item => ({ ...item, job_type: 'corporate' }))
    ]

    if (combinedJobposts.length === 0) {
      return NextResponse.json({ success: true, data: [] })
    }

    // ✅ Collect req_ids
    const reqIds = [...new Set(combinedJobposts.map(i => i.req_id).filter(Boolean))]

    // ✅ Fetch BOTH req tables
    let reqDataMap = {}

    if (reqIds.length > 0) {
      const [domesticReqRes, corporateReqRes] = await Promise.all([
        supabaseServer
          .from('domestic_crm_reqs')
          .select('*')
          .in('req_id', reqIds),

        supabaseServer
          .from('corporate_crm_reqs')
          .select('*')
          .in('req_id', reqIds)
      ])

      const domesticReqs = domesticReqRes.data || []
      const corporateReqs = corporateReqRes.data || []

      // ✅ Merge reqs
      const combinedReqs = [
        ...domesticReqs.map(r => ({ ...r, job_type: 'domestic' })),
        ...corporateReqs.map(r => ({ ...r, job_type: 'corporate' }))
      ]

      combinedReqs.forEach(req => {
        // safer key (avoids collision)
        reqDataMap[`${req.req_id}_${req.job_type}`] = req
      })
    }

    // ✅ Transform final response
    const transformedData = combinedJobposts.map(item => ({
      id: item.id,
      date: item.assigned_date,
      client_name: item.client_name,
      job_title: item.profile,
      location: item.location,
      package: item.package,
      status: item.status || 'Assigned',
      jd_id: item.jd_id,
      job_type: item.job_type,
      req_data: reqDataMap[`${item.req_id}_${item.job_type}`] || null
    }))

    const jdIds = [...new Set(combinedJobposts.map(item => item.id).filter(Boolean))]
    
      
  let cvCountMap = {};       
let allConversationsCountMap = {};  
let latestConversationMap = {};
const portalDateWiseCombinedOutput = {};
let portalWiseCountMap = {};
// Structure for combined counts
// portalDateWiseCombinedMap: Map<req_id, Map<date, Map<portal, { total: number, unique: Set }>>>

let portalDateWiseCombinedMap = new Map(); // For BOTH total and unique counts

if (jdIds.length > 0) {
  const { data: conversations, error: conversationsError } = await supabaseServer
    .from('candidates_conversation')
    .select('*')
    .in('req_id', jdIds)
    .order('created_at', { ascending: false })
  
  if (conversations && conversations.length > 0) {
    const parsingIds = [...new Set(conversations
      .map(c => c.parsing_id)
      .filter(id => id && typeof id === 'string' && id.length > 0)
    )];
    
    let cvParsingMap = new Map();
    const batchSize = 100;
    
    for (let i = 0; i < parsingIds.length; i += batchSize) {
      const batch = parsingIds.slice(i, i + batchSize);
      const { data: cvParsingData, error: cvError } = await supabaseServer
        .from('cv_parsing')
        .select('*')
        .in('id', batch);
      
      if (!cvError && cvParsingData) {
        cvParsingData.forEach(parsing => {
          cvParsingMap.set(parsing.id, parsing);
        });
      }
    }
    
    const uniqueCandidateMap = new Map(); // For latest conversation per candidate
    
    conversations.forEach(conv => {
      const key = `${conv.req_id}_${conv.parsing_id}`;
      const cvParsing = conv.parsing_id ? cvParsingMap.get(conv.parsing_id) : null;
      const portal = cvParsing?.portal || 'Unknown';
      const portalDate = cvParsing?.portal_date || null;
      const countDate = portalDate || conv.apply_date || conv.created_at?.split('T')[0];
      
      // ========== COMBINED: BOTH TOTAL AND UNIQUE COUNTS PER PORTAL/DATE ==========
      if (!portalDateWiseCombinedMap.has(conv.req_id)) {
        portalDateWiseCombinedMap.set(conv.req_id, new Map());
      }
      
      const jobDateMap = portalDateWiseCombinedMap.get(conv.req_id);
      
      if (!jobDateMap.has(countDate)) {
        jobDateMap.set(countDate, new Map());
      }
      
      const datePortalMap = jobDateMap.get(countDate);
      
      if (!datePortalMap.has(portal)) {
        datePortalMap.set(portal, {
          total: 0,           // Counts ALL conversations
          unique: new Set()   // Stores unique parsing_ids
        });
      }
      
      const portalData = datePortalMap.get(portal);
      portalData.total += 1;  // Increment total conversation count
      
      // Add to unique set (automatically handles duplicates)
      if (conv.parsing_id) {
        portalData.unique.add(conv.parsing_id);
      }
      
      // ========== TOTAL CONVERSATIONS COUNT (ALL) ==========
      allConversationsCountMap[conv.req_id] = (allConversationsCountMap[conv.req_id] || 0) + 1;
      
      // ========== PORTAL WISE COUNT (ALL CONVERSATIONS) ==========
      if (!portalWiseCountMap[conv.req_id]) {
        portalWiseCountMap[conv.req_id] = {};
      }
      portalWiseCountMap[conv.req_id][portal] = (portalWiseCountMap[conv.req_id][portal] || 0) + 1;
      
      // ========== UNIQUE LATEST CONVERSATION PER CANDIDATE ==========
      if (!uniqueCandidateMap.has(key)) {
        uniqueCandidateMap.set(key, true);
        cvCountMap[conv.req_id] = (cvCountMap[conv.req_id] || 0) + 1;
        
        if (!latestConversationMap[conv.req_id]) {
          latestConversationMap[conv.req_id] = [];
        }
        
        latestConversationMap[conv.req_id].push({
          conversation_id: conv.conversation_id,
          created_at: conv.created_at,
          apply_date: conv.apply_date,
          calling_date: conv.calling_date,
          candidate_status: conv.candidate_status,
          candidate_name: cvParsing?.name || null,
          portal: portal,
          portal_date: portalDate,
          parsing_id: conv.parsing_id
        });
      }
    });
    
    
    // Convert portalDateWiseCombinedMap to serializable object
 
    for (const [reqId, jobDateMap] of portalDateWiseCombinedMap.entries()) {
      portalDateWiseCombinedOutput[reqId] = {};
      const sortedDates = [...jobDateMap.keys()].sort((a, b) => new Date(b) - new Date(a));
      for (const date of sortedDates) {
        portalDateWiseCombinedOutput[reqId][date] = {};
        const datePortalMap = jobDateMap.get(date);
        for (const [portal, portalData] of datePortalMap.entries()) {
          portalDateWiseCombinedOutput[reqId][date][portal] = {
            totalCall: portalData.total,    // ALL conversations count
            totalCv: portalData.unique.size // UNIQUE candidates count
          };
        }
      }
    }
    
  }
}

// Add to enrichedData

    // ✅ Fetch job_postings for these JD IDs
    let jobPostings = []
    if (jdIds.length > 0) {
      const { data: postings, error: postingsError } = await supabaseServer
        .from('job_postings')
        .select('*')
        .in('jd_id', jdIds)
        .order('created_at', { ascending: false })

      if (!postingsError && postings) {
        jobPostings = postings
      }
    }

    // ✅ Transform final response with enrichment
    let enrichedData = combinedJobposts.map(item => ({
      id: item.id,
      date: item.assigned_date,
      client_name: item.client_name,
      job_title: item.profile,
      location: item.location,
      package: item.package,
      status: item.status || 'Assigned',
      jd_id: item.jd_id,
      job_type: item.job_type,
      req_data: reqDataMap[`${item.req_id}_${item.job_type}`] || null,

       portalDateWiseCounts: portalDateWiseCombinedOutput[item.id] || {},
      uniqueCandidatesCount: cvCountMap[item.id] || 0,
      // ✅ Add total conversations count
      totalConversationsCount: allConversationsCountMap[item.id] || 0,
      // ✅ Add latest conversation
      latestConversation: latestConversationMap[item.id] || null,
      // ✅ Add publishing details like JDs API
      publishingDetails: jobPostings
        .filter(p => p.jd_id === item.id)
        .map(p => ({
          id: p.id,
          platform: p.platform,
          live_url: p.live_url,
          stage: p.current_stage,
          postedOn: p.posted_on,
          createdAt: p.created_at
        })),
      // ✅ Add CV logs like JDs API
    
    }))

    // ✅ Sort by latest date
    enrichedData.sort(
      (a, b) => new Date(b.date || 0) - new Date(a.date || 0)
    )

    // ✅ Fetch created_by/assigned_to user names like JDs API
    const dataWithNames = await Promise.all(enrichedData.map(async (item) => {
      let userName = null

      // Try to get user name from various possible fields
      const userId = item.req_data?.created_by || item.req_data?.assigned_to

      if (userId) {
        const { data: userData } = await supabaseServer
          .from('users')
          .select('name')
          .eq('user_id', userId)
          .single()
        userName = userData?.name || null
      }

      return { ...item, created_by_name: userName }
    }))

    return NextResponse.json({
      success: true,
      data: dataWithNames
    })

  } catch (error) {
    console.error('Combined Jobpost API error:', error)
    return NextResponse.json({
      error: 'Internal server error',
      details: error.message
    }, { status: 500 })
  }
}

// Add this to your existing route.js file alongside the GET method

export async function PUT(request) {
  try {
    // Auth check
    const authHeader = request.headers.get('authorization')
    if (!authHeader) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authError } = await supabaseServer.auth.getUser(token)

    if (authError || !user) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }

    // Get request body
    const body = await request.json()
    const { jd_id, status, job_type } = body
    console.log("body",body);
    if (!jd_id || !status) {
      return NextResponse.json({ 
        error: 'Missing required fields: jd_id, status' 
      }, { status: 400 })
    }

    // Determine which table to update
    const tableName = job_type === 'corporate' 
      ? 'corporate_crm_jobpost' 
      : 'domestic_crm_jobpost'

    // Update the status
    const { data, error } = await supabaseServer
      .from(tableName)
      .update({ status: status })
      .eq('id', jd_id)
      .select()

    if (error) {
      return NextResponse.json({ 
        error: 'Failed to update status', 
        details: error.message 
      }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: 'Status updated successfully',
      data: data[0]
    })

  } catch (error) {
    console.error('Status update API error:', error)
    return NextResponse.json({
      error: 'Internal server error',
      details: error.message
    }, { status: 500 })
  }
}