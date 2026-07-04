import { supabaseServer } from '@/lib/supabase-server'
import { NextResponse } from 'next/server'
import { getUser } from '@/lib/auth-helper';
export async function GET(request) {
  try {
    // Authentication
    const { user, error: authError } = getUser(request);
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get today's date
    const today = new Date().toISOString().split('T')[0]

    // Query domestic_crm_conversation to get the latest past date (not today)
    const { data: latestDateData, error: latestDateError } = await supabaseServer
      .from('domestic_crm_conversation')
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
