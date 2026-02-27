import { supabaseServer } from '@/lib/supabase-server'
import { NextResponse } from 'next/server'

// GET - Fetch historical targets for HOD with achievements
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

    // Fetch managers under this HOD by checking hod_id field
    const { data: managers, error: managersError } = await supabaseServer
      .from('users')
      .select('user_id, name, email, role, region, sector, manager_id, hod_id')
      .eq('hod_id', user.id)
      .order('name')

    if (managersError) {
      console.error('Managers fetch error:', managersError)
      return NextResponse.json({
        error: 'Failed to fetch managers',
        details: managersError.message
      }, { status: 500 })
    }

    // Format managers for response
    const managersList = (managers || []).map(mgr => ({
      id: mgr.user_id,
      name: mgr.name,
      email: mgr.email,
      region: mgr.region || '',
      sector: mgr.sector || ''
    }))

    // Get manager IDs under this HOD
    const managerIds = (managers || []).map(m => m.user_id)

    // Fetch ALL historical targets for these managers (no month filter - frontend will filter)
    let targetsQuery = supabaseServer
      .from('hod_sm_targets')
      .select('*')
      .in('sm_id', managerIds.length > 0 ? managerIds : [''])
      .order('month', { ascending: false })

    if (month) {
      targetsQuery = targetsQuery.eq('month', month)
    }

    const { data: targets, error: targetsError } = await targetsQuery

    if (targetsError) {
      console.error('Historical targets fetch error:', targetsError)
      return NextResponse.json({
        error: 'Failed to fetch historical targets',
        details: targetsError.message
      }, { status: 500 })
    }

    // Get all managers with their sector info
    const managerSectors = {}
    ;(managers || []).forEach(mgr => {
      managerSectors[mgr.user_id] = mgr.sector || ''
    })

    // Get all FSEs and Leadgens under these managers - fetch all and filter in JS
    const { data: allUsersUnderManagers, error: usersError } = await supabaseServer
      .from('users')
      .select('user_id, manager_id, sector, role')
      .in('manager_id', managerIds.length > 0 ? managerIds : [''])

    console.log('Users under managers:', { managerIds, usersError, count: allUsersUnderManagers?.length })
    
    // Filter to get FSEs - handle role as string or array (FSE is uppercase in DB)
    const allFSEs = (allUsersUnderManagers || []).filter(u => {
      const role = u.role
      if (Array.isArray(role)) return role.includes('FSE') || role.includes('fse')
      if (typeof role === 'string') return role.toUpperCase().includes('FSE')
      return false
    })
    
    // Filter to get Leadgens - handle role as string or array (LEADGEN is uppercase in DB)
    const allLeadgens = (allUsersUnderManagers || []).filter(u => {
      const role = u.role
      if (Array.isArray(role)) return role.includes('LEADGEN') || role.includes('Leadgen')
      if (typeof role === 'string') return role.toUpperCase().includes('LEADGEN')
      return false
    })
    
    console.log('Filtered FSEs:', { count: allFSEs?.length })
    console.log('Filtered Leadgens:', { count: allLeadgens?.length })

    // Group FSEs by manager
    const fsesByManager = {}
    ;(allFSEs || []).forEach(fse => {
      if (!fsesByManager[fse.manager_id]) {
        fsesByManager[fse.manager_id] = []
      }
      fsesByManager[fse.manager_id].push(fse.user_id)
    })

    // Group Leadgens by manager
    const leadgensByManager = {}
    ;(allLeadgens || []).forEach(lg => {
      if (!leadgensByManager[lg.manager_id]) {
        leadgensByManager[lg.manager_id] = []
      }
      leadgensByManager[lg.manager_id].push(lg.user_id)
    })

    // Calculate achievements for each target
    const targetsWithAchievements = await Promise.all((targets || []).map(async (target) => {
      const managerId = target.sm_id
      const sector = managerSectors[managerId] || ''
      const fseIds = fsesByManager[managerId] || []
      const leadgenIds = leadgensByManager[managerId] || []

      // Get month start and end
      const targetMonth = target.month ? target.month.substring(0, 7) : null // YYYY-MM
      if (!targetMonth) return target

      const year = parseInt(targetMonth.split('-')[0])
      const monthNum = parseInt(targetMonth.split('-')[1])
      const startDate = `${year}-${String(monthNum).padStart(2, '0')}-01`
      const lastDay = new Date(year, monthNum, 0).getDate()
      const endDate = `${year}-${String(monthNum).padStart(2, '0')}-${lastDay}`

      let achievedVisits = 0
      let achievedOnboards = 0
      let achievedCalls = 0
      let achievedLeads = 0

      // ========== FSE Achievements (Visits & Onboards) ==========
      if (fseIds.length > 0) {
        const tableName = sector === 'Corporate' ? 'corporate_clients_interaction' : 'domestic_clients_interaction'

        const { data: interactions, error: intError } = await supabaseServer
          .from(tableName)
          .select('client_id, status, contact_date, contact_mode')
          .in('user_id', fseIds)
          .gte('contact_date', startDate)
          .lte('contact_date', endDate)

        if (intError) {
          console.error(`Interactions fetch error for ${tableName}:`, intError)
        } else if (interactions && interactions.length > 0) {
          const visitsSet = new Set()
          const clientLatestStatus = {}

          interactions.forEach(int => {
            const dateKey = `${int.contact_date}-${int.client_id}`
            const mode = int.contact_mode?.toLowerCase() || ''

            if (mode === 'visit') {
              visitsSet.add(dateKey)
            }

            if (!clientLatestStatus[int.client_id] || int.contact_date > clientLatestStatus[int.client_id].date) {
              clientLatestStatus[int.client_id] = {
                status: int.status,
                date: int.contact_date
              }
            }
          })

          achievedVisits = visitsSet.size
          achievedOnboards = Object.values(clientLatestStatus).filter(
            c => c.status === 'Onboarded'
          ).length
        }
      }

      // ========== Leadgen Achievements (Calls & Leads) ==========
      if (leadgenIds.length > 0) {
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
          console.error(`Leadgen interactions fetch error for ${interactionTable}:`, intError)
        } else if (interactions && interactions.length > 0) {
          // Count DISTINCT client_id per unique date = Total Calls
          const callsSet = new Set()
          interactions.forEach(int => {
            callsSet.add(`${int.client_id}-${int.date}`)
          })
          achievedCalls = callsSet.size
        }

        // Fetch leads: sent_to_sm = TRUE and lock_date in period
        const { data: leads, error: leadsError } = await supabaseServer
          .from(leadsTable)
          .select('client_id')
          .in('leadgen_id', leadgenIds)
          .eq('sent_to_sm', true)
          .gte('lock_date', startDate)
          .lte('lock_date', endDate)

        if (leadsError) {
          console.error(`Leadgen leads fetch error for ${leadsTable}:`, leadsError)
        } else if (leads && leads.length > 0) {
          achievedLeads = leads.length
        }
      }

      return {
        ...target,
        achieved_visits: achievedVisits,
        achieved_onboards: achievedOnboards,
        achieved_calls: achievedCalls,
        achieved_leads: achievedLeads
      }
    }))

    return NextResponse.json({
      success: true,
      data: {
        month: month || null,
        managers: managersList,
        targets: targetsWithAchievements
      }
    })

  } catch (error) {
    console.error('HOD history targets GET error:', error)
    return NextResponse.json({
      error: 'Internal server error',
      details: error.message
    }, { status: 500 })
  }
}
