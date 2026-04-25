import { supabaseServer } from '@/lib/supabase-server';
import { NextResponse } from 'next/server';

export async function GET(request) {
  try {
    // Authentication
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabaseServer.auth.getUser(token);
    if (authError || !user) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    // Fetch users with sector = Corporate and role containing REVENUE
    const { data: users, error: usersError } = await supabaseServer
      .from('users')
      .select('user_id, name')
      .eq('sector', 'Corporate')
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