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

    const currentUserId = user.user_id || user.id
    const { id } = await request.json();

    if (!id) {
      return NextResponse.json({ error: 'ID is required' }, { status: 400 })
    }

    // First, delete related interview records
    const { error: interviewError } = await supabaseServer
      .from('domestic_crm_interview')
      .delete()
      .eq('email_draft_id', id);

    if (interviewError) throw interviewError;

    // Then, delete the email record
    const { error: emailError } = await supabaseServer
      .from('domestic_crm_emails')
      .delete()
      .eq('id', id)
      .eq('user_id', currentUserId);

    if (emailError) throw emailError;

    return NextResponse.json({
      success: true,
      message: 'Record deleted successfully'
    });
  } catch (error) {
    console.error("Error deleting email record:", error);
    return NextResponse.json(
      { success: false, message: error.message || "Failed to delete record" },
      { status: 500 }
    );
  }
}