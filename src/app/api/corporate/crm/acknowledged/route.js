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

    // Count acknowledged clients (status = 'Done') for this user
    const { count, error: countError } = await supabaseServer
      .from('corporate_crm_clients')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('status', 'Done')

    if (countError) {
      console.error('Count acknowledged clients error:', countError)
      return NextResponse.json({
        error: 'Failed to count clients',
        details: countError.message
      }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      data: {
        acknowledged: count || 0
      }
    })

  } catch (error) {
    console.error('CRM acknowledged API error:', error)
    return NextResponse.json({
      error: 'Internal server error',
      details: error.message
    }, { status: 500 })
  }
}
