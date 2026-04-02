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

    // Get today's date
    const today = new Date().toISOString().split('T')[0]

    // Step 1: Get the latest past date (not today)
    const { data: latestDateData } = await supabaseServer
      .from('corporate_crm_conversation')
      .select('date')
      .neq('date', today)
      .order('date', { ascending: false })
      .limit(1)

    // Handle case when no data exists
    let latestDate = null
    if (latestDateData && latestDateData.length > 0) {
      latestDate = latestDateData[0].date
    }
    
    const latestDateStr = latestDate ? String(latestDate).split('T')[0] : null

    // Step 2: Get total count of all rows in corporate_crm_conversation
    const { count: totalCount } = await supabaseServer
      .from('corporate_crm_conversation')
      .select('*', { count: 'exact', head: true })

    // Step 3: Get count of rows where date = latest fetched date
    let yesterdayCount = 0
    if (latestDateStr) {
      const { count: yesterdayCountResult } = await supabaseServer
        .from('corporate_crm_conversation')
        .select('*', { count: 'exact', head: true })
        .eq('date', latestDateStr)

      yesterdayCount = yesterdayCountResult || 0
    }

    return NextResponse.json({
      success: true,
      data: {
        total: totalCount || 0,
        yesterday: yesterdayCount,
        latestDate: latestDateStr,
        latestDateFormatted: latestDateStr ? new Date(latestDateStr).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' }) : null
      }
    })

  } catch (error) {
    console.error('CRM calling API error:', error)
    return NextResponse.json({ 
      error: error.message || 'Internal server error' 
    }, { status: 500 })
  }
}