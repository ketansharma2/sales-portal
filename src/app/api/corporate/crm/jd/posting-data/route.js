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

// POST - Create new posting data (CVs received)
export async function POST(request) {
  try {
    const body = await request.json();
    const { jd_id, date, platform, cv_received, calls_done } = body;

    // Validate required fields
    if (!jd_id || !platform) {
      return NextResponse.json(
        { error: "Missing required fields: jd_id, platform" },
        { status: 400 }
      );
    }

    // Insert into posting_data table
    const insertData = {
      jd_id,
      date: date || new Date().toISOString().split("T")[0],
      platform,
      cv_received: cv_received || 0,
      calls_done: calls_done || 0,
    };

    const { data, error } = await supabaseAdmin
      .from("posting_data")
      .insert([insertData])
      .select()
      .single();

    if (error) {
      console.error("Error inserting posting_data:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    console.error("Error in posting_data POST:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// GET - Fetch posting data
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const jd_id = searchParams.get("jd_id");

    let query = supabaseAdmin.from("posting_data").select("*");

    if (jd_id) {
      query = query.eq("jd_id", jd_id);
    }

    const { data, error } = await query.order("date", { ascending: false });

    if (error) {
      console.error("Error fetching posting_data:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data || []);
  } catch (error) {
    console.error("Error in posting_data GET:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// PUT - Update posting data
export async function PUT(request) {
  try {
    const body = await request.json();
    const { id, date, platform, cv_received, calls_done } = body;

    if (!id) {
      return NextResponse.json(
        { error: "Missing required field: id" },
        { status: 400 }
      );
    }

    const updateData = {};
    if (date !== undefined) updateData.date = date;
    if (platform !== undefined) updateData.platform = platform;
    if (cv_received !== undefined) updateData.cv_received = cv_received;
    if (calls_done !== undefined) updateData.calls_done = calls_done;

    const { data, error } = await supabaseAdmin
      .from("posting_data")
      .update(updateData)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      console.error("Error updating posting_data:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error("Error in posting_data PUT:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// DELETE - Delete posting data
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
      .from("posting_data")
      .delete()
      .eq("id", id);

    if (error) {
      console.error("Error deleting posting_data:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error in posting_data DELETE:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
