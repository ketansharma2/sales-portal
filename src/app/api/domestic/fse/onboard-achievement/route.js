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
    console.log('Onboard achievement - Month:', month, 'Year:', year, 'User:', currentUserId)

    // Get all interactions for the month (following dashboard logic)
    const { data: allInteractions, error: interactionsError } = await supabaseServer
      .from('domestic_clients_interaction')
      .select('client_id, status, contact_date, created_at')
      .eq('user_id', currentUserId)
      .gte('contact_date', startDate)
      .lte('contact_date', monthEnd)
      .order('client_id', { ascending: true })
      .order('contact_date', { ascending: false })
      .order('created_at', { ascending: false })

    console.log('Interactions count:', allInteractions?.length || 0)

    if (interactionsError) {
      console.error('Interactions fetch error:', interactionsError)
      return NextResponse.json({ error: 'Failed to fetch interactions', details: interactionsError.message }, { status: 500 })
    }

    // Process to get latest status per client in month (like dashboard)
    const latestStatuses = new Map()
    allInteractions?.forEach(interaction => {
      if (!latestStatuses.has(interaction.client_id)) {
        latestStatuses.set(interaction.client_id, interaction.status)
      }
    })

    // Count onboarded clients (case insensitive, based on latest interaction per client)
    const achieved = Array.from(latestStatuses.values()).filter(status => status?.toLowerCase() === 'onboarded').length
    console.log('Unique clients:', latestStatuses.size, 'Onboarded:', achieved)

    // Get target from manager_targets table
    const { data: targetData, error: targetError } = await supabaseServer
      .from('manager_targets')
      .select('total_target')
      .eq('assigned_to', currentUserId)
      .eq('role', 'FSE')
      .eq('sector', 'Domestic')
      .ilike('kpi', 'onboard')
      .eq('month', month)
      .eq('year', parseInt(year))
      .single()

    console.log('Target fetch - Found:', !!targetData, 'Value:', targetData?.total_target || 0)

    if (targetError && targetError.code !== 'PGRST116') { // PGRST116 is "not found"
      console.error('Target fetch error:', targetError)
      return NextResponse.json({ error: 'Failed to fetch target', details: targetError.message }, { status: 500 })
    }

    const target = targetData?.total_target || 0
    console.log('Final target:', target)
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
    console.error('Onboard achievement API error:', error)
    return NextResponse.json({
      error: 'Internal server error',
      details: error.message
    }, { status: 500 })
  }
}