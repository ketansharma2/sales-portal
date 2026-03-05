import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

// Get Supabase admin client with service role key for bypassing RLS
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export async function POST(request) {
  try {
    const body = await request.json();
    const { jd_id, user_id, platform, live_url, current_stage, posted_on } = body;

    // Validate required fields
    if (!jd_id || !platform) {
      return NextResponse.json(
        { error: "Missing required fields: jd_id, platform" },
        { status: 400 }
      );
    }

    // Insert into job_postings table
    const insertData = {
      jd_id,
      platform,
      live_url: live_url || null,
      current_stage: current_stage || "Active",
      posted_on: posted_on || new Date().toISOString().split("T")[0],
    };
    
    // Only add user_id if it's provided
    if (user_id) {
      insertData.user_id = user_id;
    }

    const { data, error } = await supabaseAdmin
      .from("job_postings")
      .insert([insertData])
      .select()
      .single();

    if (error) {
      console.error("Error inserting job_posting:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    console.error("Error in job-postings POST:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const jd_id = searchParams.get("jd_id");
    const user_id = searchParams.get("user_id");

    let query = supabaseAdmin.from("job_postings").select("*");

    if (jd_id) {
      query = query.eq("jd_id", jd_id);
    }

    if (user_id) {
      query = query.eq("user_id", user_id);
    }

    const { data, error } = await query.order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching job_postings:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data || []);
  } catch (error) {
    console.error("Error in job-postings GET:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PUT(request) {
  try {
    const body = await request.json();
    const { id, platform, live_url, current_stage, posted_on } = body;

    if (!id) {
      return NextResponse.json(
        { error: "Missing required field: id" },
        { status: 400 }
      );
    }

    const updateData = {};
    if (platform !== undefined) updateData.platform = platform;
    if (live_url !== undefined) updateData.live_url = live_url;
    if (current_stage !== undefined) updateData.current_stage = current_stage;
    if (posted_on !== undefined) updateData.posted_on = posted_on;

    const { data, error } = await supabaseAdmin
      .from("job_postings")
      .update(updateData)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      console.error("Error updating job_posting:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error("Error in job-postings PUT:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function DELETE(request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { error: "Missing required field: id" },
        { status: 400 }
      );
    }

    const { error } = await supabaseAdmin
      .from("job_postings")
      .delete()
      .eq("id", id);

    if (error) {
      console.error("Error deleting job_posting:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error in job-postings DELETE:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
