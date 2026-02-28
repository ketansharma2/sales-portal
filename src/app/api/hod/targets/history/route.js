import { supabaseServer } from '@/lib/supabase-server'
import { NextResponse } from 'next/server'

// GET - Fetch past months' targets for HOD's managers with achievements
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
    const monthParam = searchParams.get('month') // YYYY-MM format (optional)
    
    // Get current month to filter out
    const currentDate = new Date()
    const currentMonth = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}`
    
    // Determine target months - if monthParam provided, use it, otherwise get all past months
    let targetMonths = []
    
    if (monthParam) {
      // If specific month requested, only use it if it's a past month
      if (monthParam < currentMonth) {
        targetMonths = [monthParam]
      } else {
        return NextResponse.json({
          success: true,
          data: {
            month: monthParam,
            targets: [],
            members: []
          }
        })
      }
    } else {
      // Get last 12 months (excluding current)
      for (let i = 1; i <= 12; i++) {
        const d = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1)
        const month = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
        targetMonths.push(month)
      }
    }

    // Get all managers (SMs) under this HOD
    const { data: teamMembers, error: membersError } = await supabaseServer
      .from('users')
      .select('user_id, name, role, manager_id')
      .eq('manager_id', user.id)
      .order('name')

    if (membersError) {
      console.error('Team members fetch error:', membersError)
      return NextResponse.json({
        error: 'Failed to fetch team members',
        details: membersError.message
      }, { status: 500 })
    }

    // Filter only managers (SM roles)
    const managerList = (teamMembers || []).filter(u => {
      const roleStr = Array.isArray(u.role) ? u.role.join(' ') : (u.role || '')
      return roleStr.toUpperCase().includes('MANAGER') || roleStr.toUpperCase().includes('SM')
    })

    const managerIds = managerList.map(m => m.user_id)

    // Fetch targets from hod_sm_targets for past months
    let targetsQuery = supabaseServer
      .from('hod_sm_targets')
      .select('*')

    if (managerIds.length > 0) {
      targetsQuery = targetsQuery.in('sm_id', managerIds)
    }

    const { data: allTargets, error: targetsError } = await targetsQuery

    if (targetsError) {
      console.error('Targets fetch error:', targetsError)
      return NextResponse.json({
        error: 'Failed to fetch targets',
        details: targetsError.message
      }, { status: 500 })
    }

    // Filter targets for past months only
    const pastTargets = (allTargets || []).filter(t => {
      if (!t.month) return false
      const targetMonth = t.month.substring(0, 7) // YYYY-MM
      return targetMonth < currentMonth && targetMonths.includes(targetMonth)
    })

    // Create a map of targets by sm_id and month
    const targetsMap = {}
    pastTargets.forEach(t => {
      const key = `${t.sm_id}_${t.month.substring(0, 7)}`
      targetsMap[key] = t
    })

    // Get unique months from targets
    const monthsWithTargets = [...new Set(pastTargets.map(t => t.month.substring(0, 7)))]

    // Get all FSEs and LeadGens under managers
    let allSubMembers = []
    if (managerIds.length > 0) {
      const { data: subMembers, error: subError } = await supabaseServer
        .from('users')
        .select('user_id, name, role, manager_id')
        .in('manager_id', managerIds)
        .order('name')

      if (!subError && subMembers) {
        allSubMembers = subMembers
      }
    }

    const fseList = allSubMembers.filter(u => {
      const roleStr = Array.isArray(u.role) ? u.role.join(' ') : (u.role || '')
      return roleStr.toUpperCase().includes('FSE')
    })
    
    const leadgenList = allSubMembers.filter(u => {
      const roleStr = Array.isArray(u.role) ? u.role.join(' ') : (u.role || '')
      return roleStr.toUpperCase().includes('LEADGEN')
    })

    const fseIds = fseList.map(f => f.user_id)
    const leadgenIds = leadgenList.map(l => l.user_id)

    // Build achievements for each month
    const achievementsMap = {}

    // Process each month
    for (const month of monthsWithTargets) {
      const year = parseInt(month.split('-')[0])
      const monthNum = parseInt(month.split('-')[1])
      const startDate = `${year}-${String(monthNum).padStart(2, '0')}-01`
      const lastDay = new Date(year, monthNum, 0).getDate()
      const endDate = `${year}-${String(monthNum).padStart(2, '0')}-${lastDay}`

      const monthKey = month

      // ========== Calculate FSE Achievements (Visits & Onboards) ==========
      if (fseIds.length > 0) {
        const { data: interactions, error: intError } = await supabaseServer
          .from('domestic_clients_interaction')
          .select('user_id, client_id, status, contact_date, contact_mode')
          .in('user_id', fseIds)
          .gte('contact_date', startDate)
          .lte('contact_date', endDate)

        if (!intError && interactions && interactions.length > 0) {
          const clientsData = {}
          interactions.forEach(int => {
            if (!clientsData[int.user_id]) {
              clientsData[int.user_id] = {}
            }
            
            const dateKey = `${int.contact_date}-${int.client_id}`
            const mode = int.contact_mode?.toLowerCase() || ''
            
            if (mode === 'visit') {
              if (!clientsData[int.user_id][dateKey]) {
                clientsData[int.user_id][dateKey] = true
              }
            }
            
            const statusKey = `${int.client_id}_status`
            if (!clientsData[int.user_id][statusKey] || 
                int.contact_date > clientsData[int.user_id][statusKey].date) {
              clientsData[int.user_id][statusKey] = {
                status: int.status,
                date: int.contact_date
              }
            }
          })

          // Group by manager
          fseList.forEach(fse => {
            const managerId = fse.manager_id
            const key = `${managerId}_${monthKey}`
            const clients = clientsData[fse.user_id] || {}
            const visits = Object.keys(clients).filter(k => !k.endsWith('_status')).length
            const onboards = Object.keys(clients)
              .filter(k => k.endsWith('_status') && clients[k].status === 'Onboarded')
              .length
            
            if (!achievementsMap[key]) {
              achievementsMap[key] = { visits: 0, onboards: 0, calls: 0, leads: 0 }
            }
            achievementsMap[key].visits += visits
            achievementsMap[key].onboards += onboards
          })
        }
      }

      // ========== Calculate LeadGen Achievements (Calls & Leads) ==========
      if (leadgenIds.length > 0) {
        const { data: interactions, error: intError } = await supabaseServer
          .from('domestic_leads_interaction')
          .select('leadgen_id, client_id, date')
          .in('leadgen_id', leadgenIds)
          .gte('date', startDate)
          .lte('date', endDate)

        if (!intError && interactions && interactions.length > 0) {
          interactions.forEach(int => {
            const lg = leadgenList.find(l => l.user_id === int.leadgen_id)
            if (lg) {
              const key = `${lg.manager_id}_${monthKey}`
              if (!achievementsMap[key]) {
                achievementsMap[key] = { visits: 0, onboards: 0, calls: 0, leads: 0 }
              }
              achievementsMap[key].calls++
            }
          })
        }

        const { data: leads, error: leadsError } = await supabaseServer
          .from('domestic_leadgen_leads')
          .select('client_id, leadgen_id')
          .in('leadgen_id', leadgenIds)
          .eq('sent_to_sm', true)
          .gte('lock_date', startDate)
          .lte('lock_date', endDate)

        if (!leadsError && leads && leads.length > 0) {
          leads.forEach(lead => {
            const lg = leadgenList.find(l => l.user_id === lead.leadgen_id)
            if (lg) {
              const key = `${lg.manager_id}_${monthKey}`
              if (!achievementsMap[key]) {
                achievementsMap[key] = { visits: 0, onboards: 0, calls: 0, leads: 0 }
              }
              achievementsMap[key].leads++
            }
          })
        }
      }
    }

    // Build the response with targets and achievements
    const managersWithTargets = []

    // Add managers with their past targets
    managerList.forEach(manager => {
      targetMonths.forEach(month => {
        const key = `${manager.user_id}_${month}`
        const target = targetsMap[key]
        const achievements = achievementsMap[key] || { visits: 0, onboards: 0, calls: 0, leads: 0 }
        
        if (target) {
          managersWithTargets.push({
            id: `${manager.user_id}_${month}`,
            user_id: manager.user_id,
            sm_id: manager.user_id,
            name: manager.name,
            role: 'Manager',
            month: month,
            fseCount: target.fse_count || 0,
            callersCount: target.callers_count || 0,
            visitsPerFse: target["visits/fse"] || 0,
            onboardPerFse: target["onboard/fse"] || 0,
            callsPerCaller: target["calls/caller"] || 0,
            leadsPerCaller: target["leads/caller"] || 0,
            totalVisits: target.total_visits || 0,
            totalOnboards: target.total_onboards || 0,
            totalCalls: target.total_calls || 0,
            totalLeads: target.total_leads || 0,
            workingDays: target.working_days || 24,
            remarks: target.remarks || '',
            achieved_visits: achievements.visits,
            achieved_onboards: achievements.onboards,
            achieved_calls: achievements.calls,
            achieved_leads: achievements.leads
          })
        }
      })
    })

    // Sort by month (most recent first)
    managersWithTargets.sort((a, b) => b.month.localeCompare(a.month))

    return NextResponse.json({
      success: true,
      data: {
        month: monthParam || currentMonth,
        targets: managersWithTargets,
        managers: (teamMembers || []).map(m => {
          const roleStr = Array.isArray(m.role) ? m.role.join(' ') : (m.role || '')
          return {
            id: m.user_id,
            name: m.name,
            role: roleStr.toUpperCase().includes('MANAGER') || roleStr.toUpperCase().includes('SM') ? 'Manager' : 
                  roleStr.toUpperCase().includes('FSE') ? 'FSE' : 'LeadGen'
          }
        })
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
