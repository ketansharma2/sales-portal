import { supabaseServer } from '@/lib/supabase-server'
import { NextResponse } from 'next/server'

export async function GET(request) {
  try {
    // Authentication
    const authHeader = request.headers.get('authorization')
    if (!authHeader) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authError } = await supabaseServer.auth.getUser(token)
    if (authError || !user) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }

    // Get query param
    const { searchParams } = new URL(request.url)
    const date = searchParams.get('date')
    if (!date) {
      return NextResponse.json({ error: 'Date is required' }, { status: 400 })
    }

    // Count interactions on the date
    const { count, error } = await supabaseServer
      .from('corporate_leads_interaction')
      .select('*', { count: 'exact', head: true })
      .eq('leadgen_id', user.id)
      .eq('date', date)

    if (error) {
      return NextResponse.json({
        error: 'Failed to count daily interactions',
        details: error.message
      }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      count: count || 0
    })

  } catch (error) {
    return NextResponse.json({
      error: 'Internal server error',
      details: error.message
    }, { status: 500 })
  }
}