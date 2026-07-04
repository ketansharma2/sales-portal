import { supabaseServer } from '@/lib/supabase-server';
import { NextResponse } from 'next/server';
import { getUser } from "@/lib/auth-helper";

export async function POST(request) {
  try {
    // Authentication
   const { user, error: authError } = getUser(request)

if (authError || !user) {
  console.log('[API] Auth error:', authError)
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
}

    // Check if user has MANAGER role
    const { data: userProfile, error: profileError } = await supabaseServer
      .from('users')
      .select('role')
      .eq('user_id', user.id)
      .single();

    if (profileError || !userProfile) {
      return NextResponse.json({ error: 'User profile not found' }, { status: 404 });
    }

    if (!userProfile.role || !userProfile.role.includes('MANAGER')) {
      return NextResponse.json({ error: 'Access denied. Manager role required.' }, { status: 403 });
    }

    const { exp_id } = await request.json();

    if (!exp_id) {
      return NextResponse.json({ error: 'Expense ID is required' }, { status: 400 });
    }

    // Update the expense status to 'Sent to HR'
    const { error: updateError } = await supabaseServer
      .from('expenses')
      .update({ status: 'Sent to HR' })
      .eq('exp_id', exp_id);

    if (updateError) {
      console.error('Error updating expense status:', updateError);
      return NextResponse.json({ error: 'Failed to send expense to HR' }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: 'Expense sent to HR successfully' });
  } catch (error) {
    console.error('Server error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
