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
      .from('corporate_crm_reqs')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)

    if (!allDatabase) {
      if (fromDate) {
        query = query.gte('date', fromDate)
      }
      if (toDate) {
        query = query.lte('date', toDate)
      }
    }

    const { count, error } = await query

    if (error) {
      console.error('Fetch total reqs error:', error)
      return NextResponse.json({ error: 'Failed to fetch total reqs', details: error.message }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      data: {
        totalReqs: count || 0
      }
    })
  } catch (error) {
    console.error('CRM total reqs API error:', error)
    return NextResponse.json({ error: 'Internal server error', details: error.message }, { status: 500 })
  }
}
