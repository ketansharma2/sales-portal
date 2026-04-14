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
      .from('domestic_crm_emails')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)

    if (allDatabase !== 'true' && fromDate && toDate) {
      query = query.gte('shared_date', fromDate)
      query = query.lte('shared_date', toDate)
    }

    const { count, error: countError } = await query

    if (countError) {
      console.error('Count tracker shared error:', countError)
      return NextResponse.json({
        error: 'Failed to count tracker shared',
        details: countError.message
      }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      data: {
        trackerShared: count || 0
      }
    })

  } catch (error) {
    console.error('CRM tracker shared API error:', error)
    return NextResponse.json({
      error: 'Internal server error',
      details: error.message
    }, { status: 500 })
  }
}