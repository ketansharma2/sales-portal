import { supabaseServer } from '@/lib/supabase-server'
import { NextResponse } from 'next/server'

// GET - Fetch past months' targets for domestic manager's FSEs and LeadGens with achievements
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

    // Get all FSEs and LeadGens under this manager
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

    // Separate FSEs and LeadGens
    const fseList = (teamMembers || []).filter(u => {
      const roleStr = Array.isArray(u.role) ? u.role.join(' ') : (u.role || '');
      return roleStr.toUpperCase().includes('FSE');
    })
    
    const leadgenList = (teamMembers || []).filter(u => {
      const roleStr = Array.isArray(u.role) ? u.role.join(' ') : (u.role || '');
      return roleStr.toUpperCase().includes('LEADGEN');
    })

    const fseIds = fseList.map(f => f.user_id)
    const leadgenIds = leadgenList.map(l => l.user_id)

    // Fetch targets from domestic_sm_fse_targets for past months
    let targetsQuery = supabaseServer
      .from('domestic_sm_fse_targets')
      .select('*')

    if (fseIds.length > 0 || leadgenIds.length > 0) {
      const allMemberIds = [...fseIds, ...leadgenIds]
      if (allMemberIds.length > 0) {
        targetsQuery = targetsQuery.in('fse_id', allMemberIds)
      }
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

    // Create a map of targets by fse_id and month
    const targetsMap = {}
    pastTargets.forEach(t => {
      const key = `${t.fse_id}_${t.month.substring(0, 7)}`
      targetsMap[key] = t
    })

    // Get unique months from targets
    const monthsWithTargets = [...new Set(pastTargets.map(t => t.month.substring(0, 7)))]

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

          Object.keys(clientsData).forEach(fseId => {
            const clients = clientsData[fseId]
            const visits = Object.keys(clients).filter(k => !k.endsWith('_status')).length
            const onboards = Object.keys(clients)
              .filter(k => k.endsWith('_status') && clients[k].status === 'Onboarded')
              .length
            
            const key = `${fseId}_${monthKey}`
            if (!achievementsMap[key]) {
              achievementsMap[key] = { visits: 0, onboards: 0, calls: 0, leads: 0 }
            }
            achievementsMap[key].visits = visits
            achievementsMap[key].onboards = onboards
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
            const key = `${int.leadgen_id}_${monthKey}`
            if (!achievementsMap[key]) {
              achievementsMap[key] = { visits: 0, onboards: 0, calls: 0, leads: 0 }
            }
            achievementsMap[key].calls++
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
            const key = `${lead.leadgen_id}_${monthKey}`
            if (!achievementsMap[key]) {
              achievementsMap[key] = { visits: 0, onboards: 0, calls: 0, leads: 0 }
            }
            achievementsMap[key].leads++
          })
        }
      }
    }

    // Build the response with targets and achievements
    const membersWithTargets = []

    // Add FSEs with their past targets
    fseList.forEach(fse => {
      targetMonths.forEach(month => {
        const key = `${fse.user_id}_${month}`
        const target = targetsMap[key]
        const achievements = achievementsMap[key] || { visits: 0, onboards: 0 }
        
        if (target) {
          membersWithTargets.push({
            id: `${fse.user_id}_${month}`,
            user_id: fse.user_id,
            name: fse.name,
            role: 'FSE',
            month: month,
            visits: target.monthly_visits || 0,
            onboards: target.monthly_onboards || 0,
            calls: 0,
            leads: 0,
            workingDays: target.working_days || 24,
            remarks: target.remarks || '',
            achieved_visits: achievements.visits,
            achieved_onboards: achievements.onboards,
            achieved_calls: 0,
            achieved_leads: 0
          })
        }
      })
    })

    // Add LeadGens with their past targets
    leadgenList.forEach(lg => {
      targetMonths.forEach(month => {
        const key = `${lg.user_id}_${month}`
        const target = targetsMap[key]
        const achievements = achievementsMap[key] || { calls: 0, leads: 0 }
        
        if (target) {
          membersWithTargets.push({
            id: `${lg.user_id}_${month}`,
            user_id: lg.user_id,
            name: lg.name,
            role: 'LeadGen',
            month: month,
            visits: 0,
            onboards: 0,
            calls: target.monthly_calls || 0,
            leads: target.monthly_leads || 0,
            workingDays: target.working_days || 24,
            remarks: target.remarks || '',
            achieved_visits: 0,
            achieved_onboards: 0,
            achieved_calls: achievements.calls,
            achieved_leads: achievements.leads
          })
        }
      })
    })

    // Sort by month (most recent first)
    membersWithTargets.sort((a, b) => b.month.localeCompare(a.month))

    return NextResponse.json({
      success: true,
      data: {
        month: monthParam || currentMonth,
        targets: membersWithTargets,
        members: (teamMembers || []).map(m => {
          const roleStr = Array.isArray(m.role) ? m.role.join(' ') : (m.role || '');
          return {
            user_id: m.user_id,
            name: m.name,
            role: roleStr.toUpperCase().includes('FSE') ? 'FSE' : 'LeadGen'
          };
        })
      }
    })

  } catch (error) {
    console.error('Domestic manager history targets GET error:', error)
    return NextResponse.json({
      error: 'Internal server error',
      details: error.message
    }, { status: 500 })
  }
}
