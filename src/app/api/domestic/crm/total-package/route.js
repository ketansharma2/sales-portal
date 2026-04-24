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
      .select('openings,package', { count: 'exact' })
      .eq('user_id', user.id)
      .not('openings', 'is', null)
      .not('package', 'is', null)

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
      console.error('Fetch total package error:', error)
      return NextResponse.json({ error: 'Failed to fetch total package', details: error.message }, { status: 500 })
    }

    // Sum of (openings × package_value) per row
    const totalPackage = (reqsData || []).reduce((sum, row) => {
      const openings = parseInt(row.openings) || 0
      const pkgStr = String(row.package || '').trim()
      const numericMatch = pkgStr.match(/(\d+(?:\.\d+)?)/)
      const pkgValue = numericMatch ? parseFloat(numericMatch[1]) : 0
      return sum + (openings * pkgValue)
    }, 0)

    return NextResponse.json({
      success: true,
      data: {
        totalPackage: parseFloat(totalPackage.toFixed(2))
      }
    })
  } catch (error) {
    console.error('CRM total package API error:', error)
    return NextResponse.json({ error: 'Internal server error', details: error.message }, { status: 500 })
  }
}
