import { supabaseServer } from '@/lib/supabase-server';
import { NextResponse } from 'next/server';

export async function GET(request) {
  try {
    // Authentication
    const authHeader = request.headers.get('authorization')
    if (!authHeader) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authError } = await supabaseServer.auth.getUser(token)
    if (authError || !user) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }

    const currentUserId = user.user_id || user.id

    // Fetch all emails for this user
    const { data: emails, error: emailsError } = await supabaseServer
      .from('corporate_crm_emails')
      .select('*')
      .eq('user_id', currentUserId)
      .order('created_at', { ascending: false });

    if (emailsError) throw emailsError;

    // For each email, get the latest interview status
    const processedData = await Promise.all(
      (emails || []).map(async (email) => {
        // Get the latest interview for this email_draft
        const { data: latestInterview } = await supabaseServer
          .from('corporate_crm_interview')
          .select('interview_status, date, client_remark, created_at')
          .eq('email_draft_id', email.id)
          .order('created_at', { ascending: false })
          .limit(1)
          .single();

        return {
          ...email,
          latest_interview_status: latestInterview?.interview_status || null,
          latest_interview_date: latestInterview?.date || null,
          latest_interview_remark: latestInterview?.client_remark || null,
        };
      })
    );

    return NextResponse.json({
      success: true,
      data: processedData,
    });
  } catch (error) {
    console.error("Error fetching email history:", error);
    return NextResponse.json(
      { success: false, message: error.message || "Failed to fetch email history" },
      { status: 500 }
    );
  }
}