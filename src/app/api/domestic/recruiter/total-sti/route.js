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

    const currentUserId = user.user_id || user.id
    const { searchParams } = new URL(request.url)
    const fromDate = searchParams.get('fromDate')
    const toDate = searchParams.get('toDate')

    let query = supabaseServer
      .from('domestic_workbench_sti')
      .select('advance_sti')
      .eq('user_id', currentUserId)

    if (fromDate && toDate) {
      query = query.gte('date', fromDate).lte('date', toDate)
    }

    const { data, error } = await query

    if (error) {
      console.error('Fetch advance STI error:', error)
      return NextResponse.json({ error: 'Failed to fetch advance STI', details: error.message }, { status: 500 })
    }

    const totalSti = (data || []).reduce((sum, row) => {
      const stiValue = parseFloat(row.advance_sti) || 0
      return sum + stiValue
    }, 0)

    return NextResponse.json({ 
      success: true, 
      totalSti: totalSti
    })

  } catch (error) {
    console.error('Server error:', error)
    return NextResponse.json({ error: 'Internal server error', details: error.message }, { status: 500 })
  }
}