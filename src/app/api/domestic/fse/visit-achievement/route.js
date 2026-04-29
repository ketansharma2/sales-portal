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

    const { searchParams } = new URL(request.url)
    const month = searchParams.get('month')
    const year = searchParams.get('year')

    if (!month || !year) {
      return NextResponse.json({ error: 'Month and year parameters required' }, { status: 400 })
    }

    const currentUserId = user.id

    // Calculate month date range
    const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
    const monthIndex = monthNames.indexOf(month)
    if (monthIndex === -1) {
      return NextResponse.json({ error: 'Invalid month' }, { status: 400 })
    }

    const startDate = `${year}-${String(monthIndex + 1).padStart(2, '0')}-01`
    const monthEnd = `${year}-${String(monthIndex + 1).padStart(2, '0')}-${new Date(parseInt(year), monthIndex + 1, 0).getDate()}`

    // Debug logging for troubleshooting
    console.log('Visit achievement - Month:', month, 'Year:', year, 'User:', currentUserId)

    // Get all visit interactions for the month (filter by user_id first)
    const { data: visitInteractions, error: interactionsError } = await supabaseServer
      .from('domestic_clients_interaction')
      .select('client_id, contact_date, contact_mode')
      .eq('user_id', currentUserId) // Filter by user_id first
      .ilike('contact_mode', 'visit') // Case-insensitive match for 'visit'
      .gte('contact_date', startDate)
      .lte('contact_date', monthEnd)

    console.log('Visit interactions count:', visitInteractions?.length || 0)

    if (interactionsError) {
      console.error('Visit interactions fetch error:', interactionsError)
      return NextResponse.json({ error: 'Failed to fetch visit interactions', details: interactionsError.message }, { status: 500 })
    }

    // Count distinct (contact_date, client_id) combinations
    // This ensures only 1 visit per client per date (deduplicates same-day visits)
    const uniqueVisits = new Set()
    visitInteractions?.forEach(interaction => {
      const key = `${interaction.contact_date}-${interaction.client_id}`
      uniqueVisits.add(key)
    })

    const achieved = uniqueVisits.size
    console.log('Unique visit instances:', achieved)

    // Get target from manager_targets table
    const { data: targetData, error: targetError } = await supabaseServer
      .from('manager_targets')
      .select('total_target')
      .eq('assigned_to', currentUserId)
      .eq('role', 'FSE')
      .eq('sector', 'Domestic')
      .ilike('kpi', 'visit')
      .eq('month', month)
      .eq('year', parseInt(year))
      .single()

    console.log('Target fetch - Found:', !!targetData, 'Value:', targetData?.total_target || 0)

    if (targetError && targetError.code !== 'PGRST116') { // PGRST116 is "not found"
      console.error('Target fetch error:', targetError)
      return NextResponse.json({ error: 'Failed to fetch target', details: targetError.message }, { status: 500 })
    }

    const target = targetData?.total_target || 0
    const percentage = target > 0 ? Math.round((achieved / target) * 100) : 0

    return NextResponse.json({
      success: true,
      data: {
        achieved,
        target,
        percentage,
        month,
        year
      }
    })

  } catch (error) {
    console.error('Visit achievement API error:', error)
    return NextResponse.json({
      error: 'Internal server error',
      details: error.message
    }, { status: 500 })
  }
}