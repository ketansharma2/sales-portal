import { supabaseServer } from '@/lib/supabase-server';
import { NextResponse } from 'next/server';

export async function GET(request) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabaseServer.auth.getUser(token);
    if (authError || !user) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');
    const sector = searchParams.get('sector');
    const tlId = searchParams.get('tlId');

    if (type === 'crms') {
      const { data, error } = await supabaseServer
        .from('users')
        .select('user_id, name, sector')
        .eq('sector', 'Corporate')
        .contains('role', ['CRM'])
        .order('name');
      if (error) return NextResponse.json({ error: 'Failed' }, { status: 500 });
      return NextResponse.json({ success: true, data });
    }

    if (type === 'tls') {
      if (!sector) return NextResponse.json({ error: 'sector required' }, { status: 400 });
      const { data, error } = await supabaseServer
        .from('users')
        .select('user_id, name')
        .eq('sector', sector)
        .contains('role', ['TL'])
        .order('name');
      if (error) return NextResponse.json({ error: 'Failed' }, { status: 500 });
      return NextResponse.json({ success: true, data });
    }

    if (type === 'rcs') {
      if (!tlId) return NextResponse.json({ error: 'tlId required' }, { status: 400 });
      const { data, error } = await supabaseServer
        .from('users')
        .select('user_id, name')
        .eq('tl_id', tlId)
        .contains('role', ['RC'])
        .order('name');
      if (error) return NextResponse.json({ error: 'Failed' }, { status: 500 });
      return NextResponse.json({ success: true, data });
    }

    return NextResponse.json({ error: 'Invalid type' }, { status: 400 });
  } catch (error) {
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
