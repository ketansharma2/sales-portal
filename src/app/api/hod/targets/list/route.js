import { supabaseServer } from "@/lib/supabase-server";
import { NextResponse } from "next/server";

export async function GET(request) {
  try {
    const authHeader = request.headers.get("authorization");

    if (!authHeader) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const token = authHeader.replace("Bearer ", "");

    const { data: { user }, error: authError } =
      await supabaseServer.auth.getUser(token);

    if (authError || !user) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    // 1️⃣ Fetch targets
   const { data: targets, error: targetError } = await supabaseServer
  .from("hod_targets")
  .select("*")
  .in("role", ["HOD", "Manager"])
  .order("created_at", { ascending: false });

    if (targetError) {
      return NextResponse.json(
        { error: targetError.message },
        { status: 500 }
      );
    }

    // 2️⃣ Fetch users
    const { data: users, error: userError } = await supabaseServer
      .from("users")
      .select("user_id, name");

    if (userError) {
      return NextResponse.json(
        { error: userError.message },
        { status: 500 }
      );
    }

    // 3️⃣ Create lookup map (FAST)
    const userMap = Object.fromEntries(
      users.map((u) => [u.user_id, u.name])
    );

    // 4️⃣ Merge data
    const enrichedTargets = targets.map((t) => ({
      id: t.target_id,
      year: t.year,
      month: t.month,
      working_days: t.working_days,

      dept: t.dept,
      sector: t.sector,
      role: t.role,

      assigned_to: t.assigned_to,
      assigned_name: userMap[t.assigned_to] || "Unknown",

      guideline: t.guideline,
      kpi: t.kpi,
      frequency: t.frequency,

      total_target: t.total_target,
      achieved: t.achieved || 0,

      created_at: t.created_at,
    }));

    return NextResponse.json({
      success: true,
      data: enrichedTargets,
    });

  } catch (err) {
    return NextResponse.json(
      { error: "Server error", details: err.message },
      { status: 500 }
    );
  }
}