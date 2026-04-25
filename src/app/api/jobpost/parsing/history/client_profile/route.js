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

    const userId = user.id;

    // 🟢 Step 1: Get job_postings
    const { data: jobs, error: jobError } = await supabaseAdmin
      .from("job_postings")
      .select("id, posted_on, jd_id")
      .eq("user_id", userId);


    if (jobError) throw jobError;

 
  const jobIds = jobs.map(j => j.jd_id);

const { data: domesticData, error: dErr } = await supabaseAdmin
  .from("domestic_crm_jd")
  .select("jd_id, client_name, job_title")
  .in("jd_id", jobIds);

const { data: corporateData, error: cErr } = await supabaseAdmin
  .from("corporate_crm_jd")
  .select("jd_id, client_name, job_title")
  .in("jd_id", jobIds);

 
if (dErr) console.error("Domestic Error:", dErr);
if (cErr) console.error("Corporate Error:", cErr);

const domesticMap = new Map((domesticData || []).map(d => [d.jd_id, d]));
const corporateMap = new Map((corporateData || []).map(c => [c.jd_id, c]));

const combined = jobs.map(job => {
  const domestic = domesticMap.get(job.jd_id);
  const corporate = corporateMap.get(job.jd_id);

  return {
    id: job.id,
    posted_date: job.posted_on,
    client_name: domestic?.client_name || corporate?.client_name || null,
    job_title: domestic?.job_title || corporate?.job_title || null,
    sector: domestic ? "Domestic" : corporate ? "Corporate" : null
  };
});
    return NextResponse.json({
      success: true,
      count: combined.length,
      data: combined
    });

  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}