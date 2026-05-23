import { supabaseServer } from '@/lib/supabase-server'
import { NextResponse } from 'next/server'

export async function GET(request) {
  try {
    // Authentication
    console.log('dhdhsdhdfhfdh1');
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

    // Fetch revenue record by ID from domestic table
    const { data: revenue, error } = await supabaseServer
      .from('domestic_revenue')
      .select('*')
      .eq('revenue_id', revenueId)
      .single()

    if (error) {
      console.error('Fetch domestic revenue detail error:', error)
      return NextResponse.json({ error: 'Failed to fetch revenue record' }, { status: 500 })
    }

    if (!revenue) {
      return NextResponse.json({ error: 'Revenue record not found' }, { status: 404 })
    }

    // Fetch CRM name from users table (same as corporate)
    let crmName = 'Unknown'
    if (revenue.user_id) {
      const { data: userData } = await supabaseServer
        .from('users')
        .select('name')
        .eq('user_id', revenue.user_id)
        .single()
      if (userData) crmName = userData.name
    }

    // Fetch TL name
    let tlName = null
    if (revenue.tl_id) {
      const { data: tlUser } = await supabaseServer
        .from('users')
        .select('name')
        .eq('user_id', revenue.tl_id)
        .single()
      if (tlUser) tlName = tlUser.name
    }

    // Fetch RC name
    let rcName = null
    if (revenue.rc_id) {
      const { data: rcUser } = await supabaseServer
        .from('users')
        .select('name')
        .eq('user_id', revenue.rc_id)
        .single()
      if (rcUser) rcName = rcUser.name
    }

    
    return NextResponse.json({
      success: true,
      data: {
        ...revenue,
        crm_name: crmName,
        tl_name: tlName,
        rc_name: rcName,
       
      }
    })

  } catch (error) {
    console.error('Domestic revenue [id] GET error:', error)
    return NextResponse.json({
      error: 'Internal server error',
      details: error.message
    }, { status: 500 })
  }
}
