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

    // Count interactions for the user
    const { count, error } = await supabaseServer
      .from('domestic_leads_interaction')
      .select('*', { count: 'exact', head: true })
      .eq('leadgen_id', user.id)

    if (error) {
      return NextResponse.json({
        error: 'Failed to count interactions',
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