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
 
    // Fetch domestic JDs (no job_title field, only req_id)
    const { data: domesticJDs, error: dErr } = await supabaseAdmin
      .from("domestic_crm_jobpost")
      .select("id, client_name, req_id, assigned_date");
 
    // Fetch corporate JDs (has req_id reference)
    const { data: corporateJDs, error: cErr } = await supabaseAdmin
      .from("corporate_crm_jobpost")
      .select("id, client_name, req_id, assigned_date");
 
    if (dErr) {
      console.error("Domestic Query Error:", dErr);
    }
    if (cErr) {
      console.error("Corporate Query Error:", cErr);
    }
 
    // Collect all req_ids from both domestic and corporate
    const domesticReqIds = (domesticJDs || [])
      .filter(jd => jd.req_id)
      .map(jd => jd.req_id);
    
    const corporateReqIds = (corporateJDs || [])
      .filter(jd => jd.req_id)
      .map(jd => jd.req_id);
    
    const allReqIds = [...new Set([...domesticReqIds, ...corporateReqIds])];
    
    let reqDataMap = new Map();
    
    // Fetch job titles from domestic_req and corporate_req tables
    if (allReqIds.length > 0) {
      // Fetch from domestic_req table
      const { data: domesticReqData, error: domesticReqErr } = await supabaseAdmin
        .from("domestic_crm_reqs")
        .select("req_id, job_title")
        .in("req_id", allReqIds);
      
      if (domesticReqErr) {
        console.error("Domestic Req Query Error:", domesticReqErr);
      } else {
        (domesticReqData || []).forEach(req => {
          reqDataMap.set(req.req_id, {
            job_title: req.job_title,
          
            source: "domestic_req"
          });
        });
      }
      
      // Fetch from corporate_req table
      const { data: corporateReqData, error: corporateReqErr } = await supabaseAdmin
        .from("corporate_crm_reqs")
        .select("req_id, job_title")
        .in("req_id", allReqIds);
      
      if (corporateReqErr) {
        console.error("Corporate Req Query Error:", corporateReqErr);
      } else {
        (corporateReqData || []).forEach(req => {
          if (!reqDataMap.has(req.req_id)) {
            reqDataMap.set(req.req_id, {
              job_title: req.job_title,
             
              source: "corporate_req"
            });
          }
        });
      }
    }
 
    // Combine both sides
    const combinedMap = new Map();
 
    // Add domestic entries - must use req_id to get job_title
    (domesticJDs || []).forEach(jd => {
      if (jd.id && !combinedMap.has(jd.id)) {
        const reqInfo = reqDataMap.get(jd.req_id);
        const jobTitle = reqInfo?.job_title || "N/A";
        const clientName = jd.client_name || "N/A";
        
        combinedMap.set(jd.id, {
          id: jd.id,
          label: `${clientName} - ${jobTitle}`,
          client_name: clientName,
          job_title: jobTitle,
          sector: "Domestic",
          assigned_date: jd.assigned_date || null,
          req_id: jd.req_id
        });
      }
    });
 
    // Add corporate entries - use req_id to get job_title
    (corporateJDs || []).forEach(jd => {
      if (jd.id && !combinedMap.has(jd.id)) {
        const reqInfo = reqDataMap.get(jd.req_id);
        const jobTitle = reqInfo?.job_title || "N/A";
        const clientName =  jd.client_name || "N/A";
        
        combinedMap.set(jd.id, {
          id: jd.id,
          label: `${clientName} - ${jobTitle}`,
          client_name: clientName,
          job_title: jobTitle,
          sector: "Corporate",
          sent_date: jd.assigned_date || null,
          req_id: jd.req_id
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