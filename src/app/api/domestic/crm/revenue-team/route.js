import { supabaseServer } from '@/lib/supabase-server';
import { NextResponse } from 'next/server';
import { getUser } from "@/lib/auth-helper";

export async function GET(request) {
  try {
    // Authentication
   const { user, error: authError } = getUser(request)

if (authError || !user) {
  console.log('[API] Auth error:', authError)
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
}

    // Fetch users with sector = Domestic and role containing REVENUE
    const { data: users, error: usersError } = await supabaseServer
      .from('users')
      .select('user_id, name')
      .eq('sector', 'Domestic')
      .contains('role', ['REVENUE']) // Using contains for array matching
      .order('name');

    if (usersError) throw usersError;

    return NextResponse.json({
      success: true,
      data: users || []
    });
  } catch (error) {
    console.error("Error fetching revenue team users:", error);
    return NextResponse.json(
      { success: false, message: error.message || "Failed to fetch revenue team users" },
      { status: 500 }
    );
  }
}