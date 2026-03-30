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

    // Get all CRM users for Corporate sector
    const { data: crmUsers, error: crmError } = await supabaseServer
      .from('users')
      .select('user_id, name, email')
      .eq('sector', 'Corporate')
      .contains('role', ['CRM'])
      .order('name', { ascending: true })

    if (crmError) {
      console.error('CRM users fetch error:', crmError)
      return NextResponse.json({ error: 'Failed to fetch CRM users' }, { status: 500 })
    }

    return NextResponse.json({ success: true, data: crmUsers || [] });
  } catch (error) {
    console.error('Server error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}