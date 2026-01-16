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

    // Check if user has MANAGER role
    const { data: userProfile, error: profileError } = await supabaseServer
      .from('users')
      .select('role')
      .eq('user_id', user.id)
      .single()

    if (profileError || !userProfile) {
      return NextResponse.json({ error: 'User profile not found' }, { status: 404 })
    }

    if (!userProfile.role || !userProfile.role.includes('MANAGER')) {
      return NextResponse.json({ error: 'Access denied. Manager role required.' }, { status: 403 })
    }

    // Get fse_id
    const { searchParams } = new URL(request.url)
    const fseId = searchParams.get('fse_id')
    if (!fseId) {
      return NextResponse.json({ error: 'FSE ID is required' }, { status: 400 })
    }

    // Calculate cumulative avg for current month till today, excluding Sundays
    const today = new Date().toISOString().split('T')[0]
    const currentMonth = new Date().getMonth() + 1
    const currentYear = new Date().getFullYear()
    const startDate = `${currentYear}-${String(currentMonth).padStart(2, '0')}-01`

    // Total visits from interactions
    const { count: totalVisitsTillNow, error: visitsError } = await supabaseServer
      .from('domestic_clients_interaction')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', fseId)
      .gte('contact_date', startDate)
      .lte('contact_date', today)
      .ilike('contact_mode', 'visit')

    if (visitsError) {
      console.error('Visits fetch error:', visitsError)
      return NextResponse.json({
        error: 'Failed to fetch avg visit',
        details: visitsError.message
      }, { status: 500 })
    }

    const totalVisits = totalVisitsTillNow || 0

    // Calculate working days from startDate to today, excluding Sundays
    const start = new Date(startDate)
    const end = new Date(today)
    let workingDays = 0
    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      if (d.getDay() !== 0) { // 0 is Sunday
        workingDays++
      }
    }

    const avgVisit = workingDays > 0 ? (totalVisits / workingDays).toFixed(2) : '0.00'

    return NextResponse.json({
      success: true,
      data: avgVisit
    })

  } catch (error) {
    console.error('Avg visits API error:', error)
    return NextResponse.json({
      error: 'Internal server error',
      details: error.message
    }, { status: 500 })
  }
}