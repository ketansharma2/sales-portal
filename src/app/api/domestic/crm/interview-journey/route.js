import { supabaseServer } from '@/lib/supabase-server';
import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const authHeader = request.headers.get('authorization')
    if (!authHeader) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authError } = await supabaseServer.auth.getUser(token)
    if (authError || !user) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }

    const body = await request.json();
    const { email_draft_id, interview_status, client_remark, date, req_id, candidate_name, candidate_email, candidate_phone } = body;

    if (!email_draft_id || !interview_status) {
      return NextResponse.json(
        { success: false, message: "email_draft_id and interview_status are required" },
        { status: 400 }
      );
    }

    const { data, error } = await supabaseServer
      .from('domestic_crm_interview')
      .insert({
        email_draft_id,
        interview_status,
        client_remark: client_remark || "",
        date: date || new Date().toISOString().split('T')[0],
        user_id: user.id,
        req_id: req_id || null,
        candidate_name: candidate_name || null,
        candidate_email: candidate_email || null,
        candidate_phone: candidate_phone || null,
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({
      success: true,
      message: "Interview journey added successfully",
      data: data,
    });
  } catch (error) {
    console.error("Error creating interview journey:", error);
    return NextResponse.json(
      { success: false, message: error.message || "Failed to add interview journey" },
      { status: 500 }
    );
  }
}

export async function GET(request) {
  try {
    const authHeader = request.headers.get('authorization')
    if (!authHeader) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authError } = await supabaseServer.auth.getUser(token)
    if (authError || !user) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url);
    const email_draft_id = searchParams.get("email_draft_id");

    if (!email_draft_id) {
      return NextResponse.json(
        { success: false, message: "email_draft_id is required" },
        { status: 400 }
      );
    }

    const { data, error } = await supabaseServer
      .from('domestic_crm_interview')
      .select('*')
      .eq('email_draft_id', email_draft_id)
      .order('created_at', { ascending: false });

    if (error) throw error;

    return NextResponse.json({
      success: true,
      data: data || [],
    });
  } catch (error) {
    console.error("Error fetching interview journeys:", error);
    return NextResponse.json(
      { success: false, message: error.message || "Failed to fetch interview journeys" },
      { status: 500 }
    );
  }
}