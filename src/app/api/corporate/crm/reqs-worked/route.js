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
    const allDatabase = searchParams.get('allDatabase')

    let query = supabaseServer
      .from('corporate_workbench')
      .select('req_id')
      .eq('user_id', user.id)

    if (allDatabase !== 'true' && fromDate && toDate) {
      query = query.gte('date', fromDate)
      query = query.lte('date', toDate)
    }

    const { data, error: fetchError } = await query

    if (fetchError) {
      console.error('Count reqs worked error:', fetchError)
      return NextResponse.json({
        error: 'Failed to count reqs worked',
        details: fetchError.message
      }, { status: 500 })
    }

    const uniqueReqIds = new Set(data.map(row => row.req_id).filter(Boolean))
    const count = uniqueReqIds.size

    return NextResponse.json({
      success: true,
      data: {
        reqsWorked: count || 0
      }
    })

  } catch (error) {
    console.error('CRM reqs worked API error:', error)
    return NextResponse.json({
      error: 'Internal server error',
      details: error.message
    }, { status: 500 })
  }
}