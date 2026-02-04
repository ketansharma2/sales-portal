import { supabaseServer } from '@/lib/supabase-server';
import { NextResponse } from 'next/server';

export async function POST(request) {
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
