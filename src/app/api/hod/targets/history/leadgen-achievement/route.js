import { supabaseServer } from '@/lib/supabase-server'
import { NextResponse } from 'next/server'

// GET - Fetch Leadgen achievements for HOD targets history
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

    // Get query parameters
    const { searchParams } = new URL(request.url)
    const month = searchParams.get('month') // YYYY-MM-DD format

    // Parse month to get date range
    if (!month) {
      return NextResponse.json({ error: 'Month parameter is required' }, { status: 400 })
    }

    const year = parseInt(month.split('-')[0])
    const monthNum = parseInt(month.split('-')[1])
    const startDate = `${year}-${String(monthNum).padStart(2, '0')}-01`
    const lastDay = new Date(year, monthNum, 0).getDate()
    const endDate = `${year}-${String(monthNum).padStart(2, '0')}-${lastDay}`

    // Fetch managers under this HOD
    const { data: managers, error: managersError } = await supabaseServer
      .from('users')
      .select('user_id, name, email, role, region, sector, manager_id, hod_id')
      .eq('hod_id', user.id)
      .order('name')

    if (managersError) {
      console.error('Managers fetch error:', managersError)
      return NextResponse.json({ error: 'Failed to fetch managers' }, { status: 500 })
    }

    const managerIds = (managers || []).map(m => m.user_id)
    const managerSectors = {}
    ;(managers || []).forEach(mgr => {
      managerSectors[mgr.user_id] = mgr.sector || ''
    })

    // Get all Leadgens under these managers
    // Role might be stored as array, so use contains
    const { data: allLeadgens, error: leadgenError } = await supabaseServer
      .from('users')
      .select('user_id, manager_id, sector')
      .in('manager_id', managerIds.length > 0 ? managerIds : [''])
      .contains('role', ['Leadgen'])

    if (leadgenError) {
      console.error('Leadgens fetch error:', leadgenError)
      return NextResponse.json({ error: 'Failed to fetch leadgens' }, { status: 500 })
    }

    // Group Leadgens by manager
    const leadgensByManager = {}
    ;(allLeadgens || []).forEach(lg => {
      if (!leadgensByManager[lg.manager_id]) {
        leadgensByManager[lg.manager_id] = []
      }
      leadgensByManager[lg.manager_id].push(lg.user_id)
    })

    // Calculate achievements for each manager
    const achievementsByManager = await Promise.all((managers || []).map(async (mgr) => {
      const managerId = mgr.user_id
      const sector = managerSectors[managerId] || ''
      const leadgenIds = leadgensByManager[managerId] || []

      let achievedCalls = 0
      let achievedLeads = 0

      if (leadgenIds.length > 0) {
        // Choose tables based on sector
        const interactionTable = sector === 'Corporate' ? 'corporate_leads_interaction' : 'domestic_leads_interaction'
        const leadsTable = sector === 'Corporate' ? 'corporate_leadgen_leads' : 'domestic_leadgen_leads'

        // Fetch interactions for calls count
        const { data: interactions, error: intError } = await supabaseServer
          .from(interactionTable)
          .select('client_id, date')
          .in('leadgen_id', leadgenIds)
          .gte('date', startDate)
          .lte('date', endDate)

        if (intError) {
          console.error(`Interactions fetch error for ${interactionTable}:`, intError)
        } else if (interactions && interactions.length > 0) {
          // Count DISTINCT client_id per unique date = Total Calls
          const callsSet = new Set()
          interactions.forEach(int => {
            // Each unique client_id + date combination = 1 call
            callsSet.add(`${int.client_id}-${int.date}`)
          })
          achievedCalls = callsSet.size
        }

        // Fetch leads for leads count
        // Count where sent_to_sm = TRUE and lock_date falls in the period
        const { data: leads, error: leadsError } = await supabaseServer
          .from(leadsTable)
          .select('id')
          .in('leadgen_id', leadgenIds)
          .eq('sent_to_sm', true)
          .gte('lock_date', startDate)
          .lte('lock_date', endDate)

        if (leadsError) {
          console.error(`Leads fetch error for ${leadsTable}:`, leadsError)
        } else if (leads && leads.length > 0) {
          achievedLeads = leads.length
        }
      }

      return {
        manager_id: managerId,
        sector: sector,
        achieved_calls: achievedCalls,
        achieved_leads: achievedLeads
      }
    }))

    return NextResponse.json({
      success: true,
      data: {
        month: month,
        achievements: achievementsByManager
      }
    })

  } catch (error) {
    console.error('Leadgen achievements GET error:', error)
    return NextResponse.json({
      error: 'Internal server error',
      details: error.message
    }, { status: 500 })
  }
}
