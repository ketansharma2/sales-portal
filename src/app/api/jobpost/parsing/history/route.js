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

   
    // 🟢 Step 1: Fetch followups (optionally filter by parsing_id)
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

    // 🟢 Step 2: Job IDs
    const jobIds = safeFollowups
      .map(f => f.post_id)
      .filter(Boolean);
console.log("jobIds:",jobIds );
    const { data: jobs } = await supabaseAdmin
      .from("job_postings")
      .select("id, posted_on, jd_id")
      .in("id", jobIds);

      console.log("jobs:",jobs);

    const safeJobs = jobs || [];

    const jdIds = safeJobs
      .map(j => j.jd_id)
      .filter(Boolean);

    // 🟢 Step 3: JD tables
    const { data: domesticData } = await supabaseAdmin
      .from("domestic_crm_jd")
      .select("jd_id, client_name, job_title")
      .in("jd_id", jdIds);

      console.log("domesticData",domesticData);
    const { data: corporateData } = await supabaseAdmin
      .from("corporate_crm_jd")
      .select("jd_id, client_name, job_title")
      .in("jd_id", jdIds);
       console.log("corporateData",corporateData);
    // 🟢 Maps
    const domesticMap = new Map((domesticData || []).map(d => [d.jd_id, d]));
    const corporateMap = new Map((corporateData || []).map(c => [c.jd_id, c]));
    const jobMap = new Map(safeJobs.map(j => [j.id, j]));
   const userIds = [...new Set(
  safeFollowups.map(f => f.user_id).filter(Boolean)
)];
const { data: usersData } = await supabaseAdmin
  .from("users")
  .select("user_id, name")
  .in("user_id", userIds);
  const userMap = new Map(
  (usersData || []).map(u => [u.user_id, u.name])
);
     // 🟢 Step 4: Final Response
     const result = safeFollowups.map(f => {
       const job = jobMap.get(f.post_id);
       const domestic = job ? domesticMap.get(job.jd_id) : null;
       const corporate = job ? corporateMap.get(job.jd_id) : null;
       
       return {
         id: f.conversation_id,
         req_id: f.post_id,

         company_name:
           domestic?.client_name ||
           corporate?.client_name ||
           "-",

         profile:
           domestic?.job_title ||
           corporate?.job_title ||
           "-",

         postDate: job?.posted_on || "-",

         applyDate: f.apply_date,
         callingDate: f.calling_date,
         slot: f.slot || null,
         relExp: f.relevant_exp,
         currCtc: f.curr_ctc,
         expCtc: f.exp_ctc,
         status: f.candidate_status,
         feedback: f.remarks,
         rc_name: userMap.get(f.user_id) || "-", // ✅ correct
         rc_id: f.user_id, // ✅ from conversation table
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