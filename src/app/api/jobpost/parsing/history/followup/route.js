import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { supabaseServer } from '@/lib/supabase-server'
import { getUser } from "@/lib/auth-helper";
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// POST: Create new followup
export async function POST(request) {
  try {
    // 🔐 Auth
// 🔐 Auth using auth-helper (middleware headers)
const { user, error: authError } = getUser(request);

if (authError || !user) {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}

    const userId = user.id;

    // 🟢 Step 1: Get Body
    const body = await request.json();
    const {
      req_id,
      applyDate,
      callingDate,
      candidate_id,
      relExp,
      currCtc,
      expCtc,
      status,
      feedback,
      slot
    } = body;

    // 🛑 Validation
    if (!applyDate || !callingDate) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }


        if (!candidate_id) {
          console.log('Validation failed: missing candidate_id')
          return NextResponse.json({ error: 'Candidate ID is required' }, { status: 400 })
        }
    
        const { data: cvData, error: cvError } = await supabaseServer
          .from('cv_parsing')
          .select('*')
          .eq('id', candidate_id)
          .single()
    
    
    
    
        
        const externalApiData = {
          unique_id: cvData.id,
          fullName: cvData.name || "",
          email: cvData.email || "",
          phone: cvData.mobile || "",
          resumeUrl: cvData.cv_url || "",
          designation: cvData.designation || "",
          location: cvData.location || "",
          topSkills: cvData.top_skills || "",
          skills: cvData.skills_all || "",
          companyNamesAll: cvData.company_names_all || "",
          recentCompany: cvData.recent_company || "",
          portal: cvData.portal || "",
          portalDate: cvData.portal_date || "",
          applyDate: applyDate || null,
          experience: cvData.experience || "",
          ctcCurrent: currCtc || "",
          ctcExpected: expCtc || "",
          feedback: feedback || "",
          remark: status || ""
        }
    
        console.log('📤 Sending to external API:', externalApiData)
    
        // ✅ Call external API
        const response = await fetch(
          "http://search-bar-backend-env.eba-zdtxcvjr.ap-south-1.elasticbeanstalk.com/api/candidate",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify(externalApiData),
          }
        );
         
       let externalResult = null;
        if (response.ok) {
          externalResult = await response.json();
    
              const insertData = {
          req_id: req_id,
          user_id: userId,
          parsing_id: candidate_id,
          apply_date: applyDate,
          calling_date: callingDate,
          relevant_exp: relExp,
          curr_ctc: currCtc,
          exp_ctc: expCtc,
          candidate_status: status,
          remarks: feedback,
          slot: slot || null,
        }
    
        console.log('Inserting data:', insertData)
    
        const { data, error } = await supabaseServer
          .from('candidates_conversation')
          .insert([insertData])
          .select()
    
        if (error) {
          console.error('Insert conversation error:', error)
          return NextResponse.json({
            error: 'Failed to insert candidate conversation',
            details: error.message
          }, { status: 500 })
        }
        
     return NextResponse.json({
          success: true,
          data: data[0],
          externalResult: externalResult
        })
    
          console.log('✅ External API success:', externalResult);
        } else {
          console.error('❌ External API error:', response.status, await response.text());
        }


  } catch (err) {
    console.error("API Error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// PUT: Update existing followup
export async function PUT(request) {
  try {
    // 🔐 Auth
// 🔐 Auth using auth-helper (middleware headers)
const { user, error: authError } = getUser(request);

if (authError || !user) {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}

    const body = await request.json();
    const {
      conversation_id,
      req_id,
      applyDate,
      callingDate,
      relExp,
      currCtc,
      expCtc,
      status,
      feedback,
      slot
    } = body;

    // 🛑 Validation
    if (!conversation_id) {
      return NextResponse.json(
        { error: "Conversation ID is required" },
        { status: 400 }
      );
    }

    if (!applyDate || !callingDate) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // 🟢 Build update object
    const updateData = {
      req_id: req_id,
      candidate_status: status,
      remarks: feedback,
      relevant_exp: relExp,
      curr_ctc: currCtc,
      exp_ctc: expCtc,
      apply_date: applyDate,
      calling_date: callingDate,
      slot: slot,
    };

    const { data, error } = await supabaseAdmin
      .from("candidates_conversation")
      .update(updateData)
      .eq("conversation_id", conversation_id)
      .select()
      .single();

    if (error) {
      console.error("Update Error:", error);
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data
    });

  } catch (err) {
    console.error("API Error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// DELETE: Delete followup
export async function DELETE(request) {
  try {
    // 🔐 Auth
  // 🔐 Auth using auth-helper (middleware headers)
const { user, error: authError } = getUser(request);

if (authError || !user) {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}

    const { searchParams } = new URL(request.url);
    const conversationId = searchParams.get("conversation_id");

    if (!conversationId) {
      return NextResponse.json(
        { error: "Conversation ID is required" },
        { status: 400 }
      );
    }

    const { error } = await supabaseAdmin
      .from("candidates_conversation")
      .delete()
      .eq("conversation_id", conversationId);

    if (error) {
      console.error("Delete Error:", error);
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Followup deleted successfully"
    });

  } catch (err) {
    console.error("API Error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
