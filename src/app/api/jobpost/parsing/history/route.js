import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export async function GET(request) {
  try {
    // 🔐 Auth
    const authHeader = request.headers.get("authorization");
    if (!authHeader) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } =
      await supabaseAdmin.auth.getUser(token);

    if (authError || !user) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

   
     // 🟢 Step 2: Fetch followups (optionally filter by parsing_id)
    const { searchParams } = new URL(request.url);
    const parsingId = searchParams.get("parsing_id");
 
    let query = supabaseAdmin
      .from("candidates_conversation")
      .select("*")
 
    if (parsingId) {
      query = query.eq("parsing_id", parsingId);
    }
 
    const { data: followups, error: followupError } =
      await query.order("created_at", { ascending: false });
 
    if (followupError) throw followupError;
 
    const safeFollowups = followups || [];
 
    // 🟢 Step 3: Get all unique jd_ids (post_id is actually jd_id)
    console.log('Raw followups data:', safeFollowups);
    const jdIds = safeFollowups
      .map(f => f.req_id)
      .filter(Boolean);

      console.log('JD IDs (as strings):', jdIds);
 
    // 🟢 Step 4: Fetch directly from CRM tables
   const { data: domesticJobpostData } = await supabaseAdmin
      .from("domestic_crm_jobpost")
      .select("id, client_name, req_id, assigned_date")
      .in("id", jdIds);
       const safeDomesticJobpost = domesticJobpostData || [];
    console.log('Domestic CRM Jobpost Data:', safeDomesticJobpost);
    // Get all unique reqs_id
    const reqsIds = safeDomesticJobpost
      .map(j => j.req_id)
      .filter(Boolean);
    
    // Fetch job titles from domestic_crm_reqs
    const { data: domesticReqsData } = await supabaseAdmin
      .from("domestic_crm_reqs")
      .select("req_id, job_title")
      .in("req_id", reqsIds);
    
    const reqsMap = new Map((domesticReqsData || []).map(r => [r.req_id, r.job_title]));
    
    // Combine domestic data
    const domesticData = safeDomesticJobpost.map(jobpost => ({
      id: jobpost.id,
      client_name: jobpost.client_name,
      job_title: reqsMap.get(jobpost.req_id) || "-",
      assigned_date: jobpost.assigned_date
    }));
 
     const { data: corporateJobpostData } = await supabaseAdmin
      .from("corporate_crm_jobpost")
      .select("id, client_name, req_id, assigned_date")
      .in("id", jdIds);
       const safeCorporateJobpost = corporateJobpostData || [];
    console.log('Corporate Jobpost Data:', safeCorporateJobpost);
    // Get all unique reqs_id
    const reqscIds = safeCorporateJobpost
      .map(j => j.req_id)
      .filter(Boolean);
    
    // Fetch job titles from corporate_crm_reqs
    const { data: corporateReqsData } = await supabaseAdmin
      .from("corporate_crm_reqs")
      .select("req_id, job_title")
      .in("id", reqscIds);
    
    const reqscMap = new Map((corporateReqsData || []).map(r => [r.req_id, r.job_title]));
    
    // Combine corporate data
    const corporateData = safeCorporateJobpost.map(jobpost => ({
      id: jobpost.id,
      client_name: jobpost.client_name,
      job_title: reqscMap.get(jobpost.req_id) || "-",
      assigned_date: jobpost.assigned_date
    }));
 
    const safeDomestic = domesticData || [];
    const safeCorporate = corporateData || [];
 
    // Create maps for quick lookup
    const domesticMap = new Map(safeDomestic.map(d => [d.id, d]));
    const corporateMap = new Map(safeCorporate.map(c => [c.id, c]));
 
    // Get user names
    const userIds = [...new Set(safeFollowups.map(f => f.user_id).filter(Boolean))];
    const { data: usersData } = await supabaseAdmin
      .from("users")
      .select("user_id, name")
      .in("user_id", userIds);
    const userMap = new Map((usersData || []).map(u => [u.user_id, u.name]));
  console.log('Domestic CRM Data:', domesticData);
    // 🟢 Step 5: Build response
    const result = safeFollowups.map(f => {
      const domestic = domesticMap.get(f.req_id);
      const corporate = corporateMap.get(f.req_id);
       
       
      return {
        id: f.conversation_id,
        req_id: f.req_id,
        company_name: domestic?.client_name || corporate?.client_name || "-",
        profile: domestic?.job_title || corporate?.job_title || "-",
        postDate: domestic?.sent_date || corporate?.sent_date || "-",
        applyDate: f.apply_date,
        callingDate: f.calling_date,
        slot: f.slot || null,
        relExp: f.relevant_exp,
        currCtc: f.curr_ctc,
        expCtc: f.exp_ctc,
        status: f.candidate_status,
        feedback: f.remarks,
        rc_name: userMap.get(f.user_id) || "-",
        rc_id: f.user_id,
        isTracker: f.is_tracker || false,
        created_at: f.created_at
      };
    });


   

    return NextResponse.json({
      success: true,
      count: result.length,
      data: result
    });

  } catch (err) {
    console.error("API ERROR:", err);
    return NextResponse.json(
      { error: err.message || "Internal server error" },
      { status: 500 }
    );
  }
}