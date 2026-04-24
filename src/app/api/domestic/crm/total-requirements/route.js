import { supabaseServer } from '@/lib/supabase-server'
import { NextResponse } from 'next/server'

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
    const fromDate = searchParams.get('fromDate')
    const toDate = searchParams.get('toDate')
    const allDatabase = searchParams.get('allDatabase') === 'true'

    let query = supabaseServer
      .from('domestic_crm_reqs')
      .select('openings', { count: 'exact' })
      .eq('user_id', user.id)
      .not('openings', 'is', null)

    if (!allDatabase) {
      if (fromDate) {
        query = query.gte('date', fromDate)
      }
      if (toDate) {
        query = query.lte('date', toDate)
      }
    }

    const { data: reqsData, error } = await query

    if (error) {
      console.error('Fetch total requirements error:', error)
      return NextResponse.json({ error: 'Failed to fetch total requirements', details: error.message }, { status: 500 })
    }

    // Sum all openings values
    const totalRequirements = (reqsData || []).reduce((sum, row) => sum + (parseInt(row.openings) || 0), 0)

    return NextResponse.json({
      success: true,
      data: {
        totalRequirements
      }
    })
  } catch (error) {
    console.error('CRM total requirements API error:', error)
    return NextResponse.json({ error: 'Internal server error', details: error.message }, { status: 500 })
  }
}
