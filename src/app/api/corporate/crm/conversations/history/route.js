import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);


export async function GET(request) {
  try {
    // Get query parameters
    const { searchParams } = new URL(request.url);
    const conversation_id = searchParams.get('conversation_id');
    
    // Get authorization token
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.split(' ')[1];
    
    if (!token) {
      return NextResponse.json(
        { error: 'Unauthorized - No token provided' },
        { status: 401 }
      );
    }
    
    // Verify user session
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
    
    if (userError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized - Invalid token' },
        { status: 401 }
      );
    }
    
    console.log("Fetching history for:", { conversation_id, user_id: user.id });
    
    // Build query - use conversation_history table for consistency
    let query = supabase
      .from('candidates_conversation')
      .select('*')
      .order('created_at', { ascending: false });
    
    // Filter by conversation_id/parsing_id
    if (conversation_id) {
      query = query.eq('parsing_id', conversation_id);
    }
    
    const { data: history, error: historyError } = await query;
    
    console.log("Raw history data:", history);
    if (historyError) {
      console.error('Error fetching history:', historyError);
      return NextResponse.json(
        { error: 'Failed to fetch conversation history', details: historyError.message },
        { status: 500 }
      );
    }
    
    // Fetch related job details for each history record
    let formattedData = history || [];
    
    if (history && history.length > 0) {
      // Extract unique req_ids from history
      const jdIds = [...new Set(history.map(item => item.req_id).filter(Boolean))];
      
      if (jdIds.length > 0) {
        // Fetch job details from corporate_crm_jobpost
        const { data: corporateJobpostData } = await supabase
          .from("corporate_crm_jobpost")
          .select("id, client_name, req_id, assigned_date,assigned_to")
          .in("id", jdIds);
        
        const safeCorporateJobpost = corporateJobpostData || [];
      
        // Extract unique req_ids for job titles
        const reqsIds = [...new Set(safeCorporateJobpost.map(j => j.req_id).filter(Boolean))];
        
        // Fetch job titles from corporate_crm_reqs
        const { data: corporateReqsData } = await supabase
          .from("corporate_crm_reqs")
          .select("req_id, job_title")
          .in("req_id", reqsIds);
        console.log('Corporate CRM Reqs Data:', corporateReqsData);
       const reqsMap = new Map((corporateReqsData || []).map(r => [r.req_id, r.job_title]));
        const assignedToMap = new Map(safeCorporateJobpost.map(j => [j.id, j.assigned_to]));
const clientMap = new Map(safeCorporateJobpost.map(j => [j.req_id, j.client_name]));
  const userIds = [...new Set(safeCorporateJobpost.map(j => j.assigned_to).filter(Boolean))];
    
    // Fetch user names from users table
    let userMap = new Map();
    if (userIds.length > 0) {
      const { data: usersData } = await supabase
        .from("users")
        .select("user_id, name, email")
        .in("user_id", userIds);
      
      usersData?.forEach(user => {
        userMap.set(user.user_id, user.name);
      });
    }
    

// Create a map to get jobpost details by jobpost id
const jobpostMap = new Map(safeCorporateJobpost.map(j => [j.id, {
  client_name: j.client_name,
  req_id: j.req_id
}]));

// Format data with job details
formattedData = history.map(item => {
  // item.req_id is actually the jobpost ID
  const assignedToUserId = assignedToMap.get(item.req_id);
      const rcName = userMap.get(assignedToUserId) || 'N/A';
  const jobpost = jobpostMap.get(item.req_id);
  const reqId = jobpost?.req_id; // Get the actual requirement ID
  const jobTitle = reqsMap.get(reqId); // Get job title using requirement ID
  
  return {
    ...item,
    client_name: jobpost?.client_name || 'N/A',
    rc_name: rcName, 
    job_title: jobTitle || 'N/A',
    client_profile: item.designation || 'N/A'
  };
});
      }
    }
    
    console.log("Formatted history data:", formattedData);
    
    return NextResponse.json({
      success: true,
      data: formattedData,
      count: formattedData.length
    });
    
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}

