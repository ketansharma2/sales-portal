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

    // Get current month start and end
    const now = new Date()
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0]
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0]

    // Count interactions in current month
    const { count, error } = await supabaseServer
      .from('corporate_leads_interaction')
      .select('*', { count: 'exact', head: true })
      .eq('leadgen_id', user.id)
      .gte('date', startOfMonth)
      .lte('date', endOfMonth)

    if (error) {
      return NextResponse.json({
        error: 'Failed to count monthly interactions',
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