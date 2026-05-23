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
    const revenueId = searchParams.get('revenue_id')

    if (!revenueId) {
      return NextResponse.json({ error: 'revenue_id is required' }, { status: 400 })
    }

    const { data: revenue, error } = await supabaseServer
      .from('domestic_revenue')
      .select('*')
      .eq('revenue_id', revenueId)
      .single()

    if (error || !revenue) {
      return NextResponse.json({ error: 'Revenue record not found' }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      data: revenue
    })

  } catch (error) {
    console.error('Domestic revenue [id] GET error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
