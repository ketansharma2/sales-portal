import { supabaseServer } from '@/lib/supabase-server'
import { NextResponse } from 'next/server'

// GET - Fetch current month's targets for HOD's managers (SMs) with achievements
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

    // Get query parameters (optional month filter)
    const { searchParams } = new URL(request.url)
    const monthParam = searchParams.get('month') // YYYY-MM format (optional)
    
    // Get current month
    const currentDate = new Date()
    const targetMonth = monthParam 
      ? monthParam 
      : `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}`
    
    const year = parseInt(targetMonth.split('-')[0])
    const monthNum = parseInt(targetMonth.split('-')[1])
    const startDate = `${year}-${String(monthNum).padStart(2, '0')}-01`
    const lastDay = new Date(year, monthNum, 0).getDate()
    const endDate = `${year}-${String(monthNum).padStart(2, '0')}-${lastDay}`

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

    // Fetch targets from hod_sm_targets for the month
    let targetsQuery = supabaseServer
      .from('hod_sm_targets')
      .select('*')
      .eq('month', startDate)

    if (managerIds.length > 0) {
      targetsQuery = targetsQuery.in('sm_id', managerIds)
    }

    const { data: targets, error: targetsError } = await targetsQuery

    if (targetsError) {
      console.error('Targets fetch error:', targetsError)
      return NextResponse.json({
        error: 'Failed to fetch targets',
        details: targetsError.message
      }, { status: 500 })
    }

    // Create a map of targets by sm_id
    const targetsMap = {}
    ;(targets || []).forEach(t => {
      targetsMap[t.sm_id] = t
    })

    // ========== Calculate Achievements ==========
    
    // Get FSEs and LeadGens under each manager
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

    // Separate FSEs and LeadGens
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

    // ========== Calculate FSE Achievements (Visits & Onboards) ==========
    let fseAchievements = {}
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
          
          // Count visits: distinct client per unique date with contact_mode = 'visit'
          if (mode === 'visit') {
            if (!clientsData[int.user_id][dateKey]) {
              clientsData[int.user_id][dateKey] = true
            }
          }
          
          // Track latest status for onboards
          const statusKey = `${int.client_id}_status`
          if (!clientsData[int.user_id][statusKey] || 
              int.contact_date > clientsData[int.user_id][statusKey].date) {
            clientsData[int.user_id][statusKey] = {
              status: int.status,
              date: int.contact_date
            }
          }
        })

        // Group achievements by manager_id
        fseList.forEach(fse => {
          const managerId = fse.manager_id
          if (!fseAchievements[managerId]) {
            fseAchievements[managerId] = { visits: 0, onboards: 0 }
          }
          
          const clients = clientsData[fse.user_id] || {}
          const visits = Object.keys(clients).filter(k => !k.endsWith('_status')).length
          const onboards = Object.keys(clients)
            .filter(k => k.endsWith('_status') && clients[k].status === 'Onboarded')
            .length
          
          fseAchievements[managerId].visits += visits
          fseAchievements[managerId].onboards += onboards
        })
      }
    }

    // ========== Calculate LeadGen Achievements (Calls & Leads) ==========
    let leadgenAchievements = {}
    if (leadgenIds.length > 0) {
      // Fetch interactions for calls count
      const { data: interactions, error: intError } = await supabaseServer
        .from('domestic_leads_interaction')
        .select('leadgen_id, client_id, date')
        .in('leadgen_id', leadgenIds)
        .gte('date', startDate)
        .lte('date', endDate)

      if (!intError && interactions && interactions.length > 0) {
        leadgenList.forEach(lg => {
          const managerId = lg.manager_id
          if (!leadgenAchievements[managerId]) {
            leadgenAchievements[managerId] = { calls: 0, leads: 0 }
          }
        })
        
        interactions.forEach(int => {
          const lg = leadgenList.find(l => l.user_id === int.leadgen_id)
          if (lg) {
            const managerId = lg.manager_id
            if (leadgenAchievements[managerId]) {
              leadgenAchievements[managerId].calls++
            }
          }
        })
      }

      // Fetch leads: sent_to_sm = TRUE and lock_date in period
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
            const managerId = lg.manager_id
            if (leadgenAchievements[managerId]) {
              leadgenAchievements[managerId].leads++
            }
          }
        })
      }
    }

    // Build the response with targets and achievements
    const managersWithTargets = []

    managerList.forEach(manager => {
      const target = targetsMap[manager.user_id]
      const fseAchievement = fseAchievements[manager.user_id] || { visits: 0, onboards: 0 }
      const leadgenAchievement = leadgenAchievements[manager.user_id] || { calls: 0, leads: 0 }
      
      managersWithTargets.push({
        user_id: manager.user_id,
        sm_id: manager.user_id,
        name: manager.name,
        role: 'Manager',
        month: startDate,
        fseCount: target?.fse_count || 0,
        callersCount: target?.callers_count || 0,
        visitsPerFse: target?.["visits/fse"] || 0,
        onboardPerFse: target?.["onboard/fse"] || 0,
        callsPerCaller: target?.["calls/caller"] || 0,
        leadsPerCaller: target?.["leads/caller"] || 0,
        totalVisits: target?.total_visits || 0,
        totalOnboards: target?.total_onboards || 0,
        totalCalls: target?.total_calls || 0,
        totalLeads: target?.total_leads || 0,
        workingDays: target?.working_days || 24,
        remarks: target?.remarks || '',
        achieved_visits: fseAchievement.visits,
        achieved_onboards: fseAchievement.onboards,
        achieved_calls: leadgenAchievement.calls,
        achieved_leads: leadgenAchievement.leads
      })
    })

    // Get member count per manager
    const memberCountMap = {}
    allSubMembers.forEach(member => {
      const managerId = member.manager_id
      if (!memberCountMap[managerId]) {
        memberCountMap[managerId] = { fse: 0, leadgen: 0 }
      }
      const roleStr = Array.isArray(member.role) ? member.role.join(' ') : (member.role || '')
      if (roleStr.toUpperCase().includes('FSE')) {
        memberCountMap[managerId].fse++
      } else if (roleStr.toUpperCase().includes('LEADGEN')) {
        memberCountMap[managerId].leadgen++
      }
    })

    return NextResponse.json({
      success: true,
      data: {
        month: targetMonth,
        targets: managersWithTargets.map(m => ({
          ...m,
          actualFseCount: memberCountMap[m.user_id]?.fse || 0,
          actualCallersCount: memberCountMap[m.user_id]?.leadgen || 0
        })),
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
    console.error('HOD current targets GET error:', error)
    return NextResponse.json({
      error: 'Internal server error',
      details: error.message
    }, { status: 500 })
  }
}
