import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// POST: Create new followup
export async function POST(request) {
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
    if (!status || !applyDate || !callingDate) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // 🟢 Step 2: Insert into DB
    const { data, error } = await supabaseAdmin
      .from("candidates_conversation")
      .insert([
        {
          post_id: req_id,
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
      ])
      .select()
      .single();

    if (error) {
      console.error("Insert Error:", error);
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    // 🟢 Step 3: Response
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

// PUT: Update existing followup
export async function PUT(request) {
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

    if (!status || !applyDate || !callingDate) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // 🟢 Build update object
    const updateData = {
      post_id: req_id,
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
