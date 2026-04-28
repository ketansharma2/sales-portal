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
    const jdIds = safeFollowups
      .map(f => f.post_id)
      .filter(Boolean);
 
    // 🟢 Step 4: Fetch directly from CRM tables
    const { data: domesticData } = await supabaseAdmin
      .from("domestic_crm_jd")
      .select("jd_id, client_name, job_title, sent_date")
      .in("jd_id", jdIds);
 
    const { data: corporateData } = await supabaseAdmin
      .from("corporate_crm_jd")
      .select("jd_id, client_name, job_title, sent_date")
      .in("jd_id", jdIds);
 
    const safeDomestic = domesticData || [];
    const safeCorporate = corporateData || [];
 
    // Create maps for quick lookup
    const domesticMap = new Map(safeDomestic.map(d => [d.jd_id, d]));
    const corporateMap = new Map(safeCorporate.map(c => [c.jd_id, c]));
 
    // Get user names
    const userIds = [...new Set(safeFollowups.map(f => f.user_id).filter(Boolean))];
    const { data: usersData } = await supabaseAdmin
      .from("users")
      .select("user_id, name")
      .in("user_id", userIds);
    const userMap = new Map((usersData || []).map(u => [u.user_id, u.name]));
 
    // 🟢 Step 5: Build response
    const result = safeFollowups.map(f => {
      const domestic = domesticMap.get(f.post_id);
      const corporate = corporateMap.get(f.post_id);
 
      return {
        id: f.conversation_id,
        req_id: f.post_id,
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