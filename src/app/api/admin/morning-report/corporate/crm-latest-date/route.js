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

    // Query corporate_crm_conversation to get the latest past date (not today)
    const { data: latestDateData, error: latestDateError } = await supabaseServer
      .from('corporate_crm_conversation')
      .select('date')
      .neq('date', today)  // Exclude today's date
      .order('date', { ascending: false })
      .limit(1)

    // Handle case when no data exists
    let latestDate = null
    if (latestDateData && latestDateData.length > 0) {
      latestDate = latestDateData[0].date
    }

    return NextResponse.json({
      success: true,
      data: {
        latestDate: latestDate
      }
    })

  } catch (error) {
    console.error('CRM latest date API error:', error)
    return NextResponse.json({ 
      error: error.message || 'Internal server error' 
    }, { status: 500 })
  }
}