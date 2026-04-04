import { supabaseServer } from '@/lib/supabase-server';
import { NextResponse } from 'next/server';

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

    const { searchParams } = new URL(request.url)
    const workbench_id = searchParams.get('workbench_id')

    if (!workbench_id) {
      return NextResponse.json({ error: 'workbench_id is required' }, { status: 400 })
    }

    const { data, error } = await supabaseServer
      .from('corporate_workbench_sti')
      .select('*')
      .eq('workbench_id', workbench_id)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Fetch STI history error:', error)
      return NextResponse.json({ error: 'Failed to fetch STI history', details: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, data })

  } catch (error) {
    console.error('Server error:', error)
    return NextResponse.json({ error: 'Internal server error', details: error.message }, { status: 500 })
  }
}

export async function PUT(request) {
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

    const body = await request.json()
    const { id, advance_sti, date } = body

    if (!id || !advance_sti) {
      return NextResponse.json({ error: 'workbench_id and advance_sti are required' }, { status: 400 })
    }

    const { data, error } = await supabaseServer
      .from('corporate_workbench_sti')
      .insert({
        workbench_id: id,
        user_id: user.id,
        advance_sti: advance_sti,
        date: date || null
      })
      .select()
      .single()

    if (error) {
      console.error('Insert STI error:', error)
      return NextResponse.json({ error: 'Failed to save STI', details: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, data })

  } catch (error) {
    console.error('Server error:', error)
    return NextResponse.json({ error: 'Internal server error', details: error.message }, { status: 500 })
  }
}
