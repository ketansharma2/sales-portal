import { supabaseServer } from '@/lib/supabase-server';
import { NextResponse } from 'next/server';
import { getUser } from '@/lib/auth-helper';

export async function GET(request) {
  try {
    // Authentication - user injected by middleware (no auth calls needed!)
    const { user, error: authError } = getUser(request);
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const currentUserId = user.user_id || user.id

    // Fetch jobpost data from corporate_crm_jobpost table
    let query = supabaseServer
      .from('corporate_crm_jobpost')
      .select('*')
      .order('created_at', { ascending: false })

    const { data: jobpostData, error: jobpostError } = await query

    if (jobpostError) {
      console.error('Fetch jobpost data error:', jobpostError)
      return NextResponse.json({ error: 'Failed to fetch jobpost data', details: jobpostError.message }, { status: 500 })
    }

    if (!jobpostData || jobpostData.length === 0) {
      return NextResponse.json({ success: true, data: [] })
    }

    // Fetch req data from corporate_crm_reqs
    const reqIds = [...new Set(jobpostData.map(item => item.req_id).filter(Boolean))]
    let reqDataMap = {}
    if (reqIds.length > 0) {
      const { data: reqsData, error: reqsError } = await supabaseServer
        .from('corporate_crm_reqs')
        .select('*')
        .in('req_id', reqIds)

      if (!reqsError && reqsData) {
        reqsData.forEach(req => {
          reqDataMap[req.req_id] = req
        })
      }
    }


     // Get all jobpost IDs for counting CVs
const jobpostIds = [...new Set(jobpostData.map(item => item.id).filter(Boolean))]

let cvCountMap = {};
let latestConversationMap = {};

if (jobpostIds.length > 0) {
  // Fetch all conversations
  const { data: conversations } = await supabaseServer
    .from('candidates_conversation')
    .select('*')
    .in('req_id', jobpostIds)
    .order('created_at', { ascending: false })

  if (conversations) {
    // Track latest conversation per candidate (parsing_id) within each jobpost
    const candidateLatestMap = new Map(); // Key: `${req_id}_${parsing_id}`
    
    conversations.forEach(conv => {
      const key = `${conv.req_id}_${conv.parsing_id}`;
      
      // Only count if this is the first time we see this candidate for this jobpost
      if (!candidateLatestMap.has(key)) {
        candidateLatestMap.set(key, conv);
        
        // Count only unique/latest candidates per jobpost
        cvCountMap[conv.req_id] = (cvCountMap[conv.req_id] || 0) + 1;
        
        // Store latest conversation per jobpost (first one overall)
        if (!latestConversationMap[conv.req_id]) {
          latestConversationMap[conv.req_id] = conv;
        }
      }
    })
  }
}

    
   
    
    // Transform data to match expected format
    const transformedData = jobpostData.map(item => ({
      id: item.id,
      date: item.assigned_date,
      client_name: item.client_name,
      job_title: item.profile,
      location: item.location,
      package: item.package,
      status: item.status || 'Assigned',
      jd_id: item.jd_id,
      cv_count:  cvCountMap[item.id] || 0, 
      req_data: reqDataMap[item.req_id] || null
    }))

    return NextResponse.json({
      success: true,
      data: transformedData
    })

  } catch (error) {
    console.error('Jobpost make API error:', error)
    return NextResponse.json({ error: 'Internal server error', details: error.message }, { status: 500 })
  }
}

export async function POST(request) {
  try {
    // Authentication - user injected by middleware (no auth calls needed!)
    const { user, error: authError } = getUser(request);
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json()
    const {
      date,
      client_id,
      req_id,
      job_title,
      location,
      pkg,
      branch_id,
      assigned_to
    } = body

    if (!date || !client_id || !req_id || !job_title) {
      return NextResponse.json({
        error: 'Date, client_id, req_id, and job_title are required'
      }, { status: 400 })
    }

    // Get client name from client_id
    const { data: clientData, error: clientError } = await supabaseServer
      .from('corporate_crm_clients')
      .select('company_name')
      .eq('client_id', client_id)
      .single()

    if (clientError) {
      return NextResponse.json({ error: 'Invalid client_id' }, { status: 400 })
    }

    const { data: newJobpost, error: insertError } = await supabaseServer
      .from('corporate_crm_jobpost')
      .insert({
        req_id: req_id,
        client_name: clientData.company_name,
        profile: job_title,
        location: location,
        package: pkg,
        status: 'pending',
        assigned_date: date,
        assigned_to: assigned_to || user.user_id || user.id,
        branch_id: branch_id || null
      })
      .select()
      .single()

    if (insertError) {
      console.error('Insert jobpost error:', insertError)
      return NextResponse.json({
        error: 'Failed to create jobpost assignment',
        details: insertError.message
      }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      data: newJobpost
    })

  } catch (error) {
    console.error('Create jobpost assignment API error:', error)
    return NextResponse.json({
      error: 'Internal server error',
      details: error.message
    }, { status: 500 })
  }
}