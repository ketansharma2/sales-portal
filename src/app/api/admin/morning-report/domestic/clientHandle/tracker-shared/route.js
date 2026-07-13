import { supabaseServer } from '@/lib/supabase-server'
import { NextResponse } from 'next/server'
import { getUser } from '@/lib/auth-helper';
export async function GET(request) {
  try {
    const { user, error: authError } = getUser(request);
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url)
    const fromDate = searchParams.get('fromDate')
    const toDate = searchParams.get('toDate')
    const allDatabase = searchParams.get('allDatabase')

    let query = supabaseServer
      .from('domestic_crm_emails')
      .select('*', { count: 'exact', head: true })
     

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