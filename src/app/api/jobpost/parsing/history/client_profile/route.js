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
 
    // Fetch ALL unique JDs from both domestic and corporate tables
    const { data: domesticJDs, error: dErr } = await supabaseAdmin
      .from("domestic_crm_jd")
      .select("jd_id, client_name, job_title, sent_date");
 
    const { data: corporateJDs, error: cErr } = await supabaseAdmin
      .from("corporate_crm_jd")
      .select("jd_id, client_name, job_title, sent_date");
 
     if (dErr) {
      console.error("Domestic Query Error:", dErr);
    }
    if (cErr) {
      console.error("Corporate Query Error:", cErr);
    }
 
    // Combine with sector info, using jd_id as key to deduplicate
    // If same jd_id appears in both tables, prefer domestic
    const combinedMap = new Map();
 
    // Add domestic entries first (higher priority)
    (domesticJDs || []).forEach(jd => {
      if (jd.jd_id && !combinedMap.has(jd.jd_id)) {
        combinedMap.set(jd.jd_id, {
          id: jd.jd_id,
          label: `${jd.client_name} - ${jd.job_title}`,
          client_name: jd.client_name,
          job_title: jd.job_title,
          sector: "Domestic",
          sent_date: jd.sent_date || null
        });
      }
    });
 
    // Add corporate entries (only if jd_id not already present)
    (corporateJDs || []).forEach(jd => {
      if (jd.jd_id && !combinedMap.has(jd.jd_id)) {
        combinedMap.set(jd.jd_id, {
          id: jd.jd_id,
          label: `${jd.client_name} - ${jd.job_title}`,
          client_name: jd.client_name,
          job_title: jd.job_title,
          sector: "Corporate",
          sent_date: jd.sent_date || null
        });
      }
    });
 
    const combined = Array.from(combinedMap.values());
 
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