import { supabaseServer } from '@/lib/supabase-server';
import { NextResponse } from 'next/server';
import { getUser } from '@/lib/auth-helper';

export async function PUT(request, { params }) {
  try {
    // Authentication - user injected by middleware (no auth calls needed!)
    const { user, error: authError } = getUser(request);
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

     const { id } = await params;

      console.log('Updating journey with ID:', id); // Debug log
    
    if (!id) {
      return NextResponse.json(
        { success: false, message: "id is required" },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { interview_status, client_remark, date } = body;

    if (!interview_status) {
      return NextResponse.json(
        { success: false, message: "interview_status is required" },
        { status: 400 }
      );
    }

    // Update existing interview journey entry
    const { data, error } = await supabaseServer
      .from('corporate_crm_interview')
      .update({
        interview_status,
        client_remark: client_remark || "",
        date: date || new Date().toISOString().split('T')[0],
      })
      .eq('id', id)
      .eq('user_id', user.id)
      .select()
      .single();

    if (error) throw error;

    if (!data) {
      return NextResponse.json(
        { success: false, message: "Journey entry not found or unauthorized" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Interview journey updated successfully",
      data: data,
    });
  } catch (error) {
    console.error("Error updating interview journey:", error);
    return NextResponse.json(
      { success: false, message: error.message || "Failed to update interview journey" },
      { status: 500 }
    );
  }
}