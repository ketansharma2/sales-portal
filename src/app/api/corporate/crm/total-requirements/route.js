import { supabaseServer } from '@/lib/supabase-server'
import { NextResponse } from 'next/server'
import { getUser } from "@/lib/auth-helper";
export async function GET(request) {
  try {
    const { user, error: authError } = getUser(request)

if (authError || !user) {
  console.log('[API] Auth error:', authError)
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
}

    const { searchParams } = new URL(request.url)
    const fromDate = searchParams.get('fromDate')
    const toDate = searchParams.get('toDate')
    const allDatabase = searchParams.get('allDatabase') === 'true'

    let query = supabaseServer
      .from('corporate_crm_reqs')
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
