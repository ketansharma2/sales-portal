import { supabaseServer } from '@/lib/supabase-server'
import { NextResponse } from 'next/server'

// GET - Fetch current month's targets for corporate manager's FSEs and LeadGens with achievements
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

    // Fetch targets from corporate_sm_fse_targets for the month
    let targetsQuery = supabaseServer
      .from('corporate_sm_fse_targets')
      .select('*')
      .eq('month', startDate)

    if (fseIds.length > 0 || leadgenIds.length > 0) {
      const allMemberIds = [...fseIds, ...leadgenIds]
      if (allMemberIds.length > 0) {
        targetsQuery = targetsQuery.in('fse_id', allMemberIds)
      }
    }

    const { data: targets, error: targetsError } = await targetsQuery

    if (targetsError) {
      console.error('Targets fetch error:', targetsError)
      return NextResponse.json({
        error: 'Failed to fetch targets',
        details: targetsError.message
      }, { status: 500 })
    }

    // Create a map of targets by fse_id
    const targetsMap = {}
    ;(targets || []).forEach(t => {
      targetsMap[t.fse_id] = t
    })

    // ========== Calculate FSE Achievements (Visits & Onboards) ==========
    let fseAchievements = {}
    if (fseIds.length > 0) {
      const { data: interactions, error: intError } = await supabaseServer
        .from('corporate_clients_interaction')
        .select('user_id, client_id, status, contact_date, contact_mode')
        .in('user_id', fseIds)
        .gte('contact_date', startDate)
        .lte('contact_date', endDate)

      if (intError) {
        console.error('FSE interactions fetch error:', intError)
      } else if (interactions && interactions.length > 0) {
        // Group by user_id
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

        // Calculate achievements
        Object.keys(clientsData).forEach(fseId => {
          const clients = clientsData[fseId]
          const visits = Object.keys(clients).filter(k => !k.endsWith('_status')).length
          const onboards = Object.keys(clients)
            .filter(k => k.endsWith('_status') && clients[k].status === 'Onboarded')
            .length
          fseAchievements[fseId] = { visits, onboards }
        })
      }
    }

    // ========== Calculate LeadGen Achievements (Calls & Leads) ==========
    let leadgenAchievements = {}
    if (leadgenIds.length > 0) {
      // Fetch interactions for calls count
      const { data: interactions, error: intError } = await supabaseServer
        .from('corporate_leads_interaction')
        .select('leadgen_id, client_id, date')
        .in('leadgen_id', leadgenIds)
        .gte('date', startDate)
        .lte('date', endDate)

      if (intError) {
        console.error('Leadgen interactions fetch error:', intError)
      } else if (interactions && interactions.length > 0) {
        // Count DISTINCT client_id per unique date = Total Calls
        interactions.forEach(int => {
          if (!leadgenAchievements[int.leadgen_id]) {
            leadgenAchievements[int.leadgen_id] = { calls: 0, leads: 0 }
          }
          leadgenAchievements[int.leadgen_id].calls++
        })
      }

      // Fetch leads: sent_to_sm = TRUE and lock_date in period
      const { data: leads, error: leadsError } = await supabaseServer
        .from('corporate_leadgen_leads')
        .select('client_id, leadgen_id')
        .in('leadgen_id', leadgenIds)
        .eq('sent_to_sm', true)
        .gte('lock_date', startDate)
        .lte('lock_date', endDate)

      if (leadsError) {
        console.error('Leadgen leads fetch error:', leadsError)
      } else if (leads && leads.length > 0) {
        // Count leads per leadgen
        leads.forEach(lead => {
          if (!leadgenAchievements[lead.leadgen_id]) {
            leadgenAchievements[lead.leadgen_id] = { calls: 0, leads: 0 }
          }
          leadgenAchievements[lead.leadgen_id].leads++
        })
      }
    }

    // Build the response with targets and achievements
    const membersWithTargets = []

    // Add FSEs
    fseList.forEach(fse => {
      const target = targetsMap[fse.user_id]
      const achievements = fseAchievements[fse.user_id] || { visits: 0, onboards: 0 }
      
      membersWithTargets.push({
        user_id: fse.user_id,
        name: fse.name,
        role: 'FSE',
        month: startDate,
        visits: target?.monthly_visits || 0,
        onboards: target?.monthly_onboards || 0,
        calls: 0,
        leads: 0,
        workingDays: target?.working_days || 24,
        remarks: target?.remarks || '',
        achieved_visits: achievements.visits,
        achieved_onboards: achievements.onboards,
        achieved_calls: 0,
        achieved_leads: 0
      })
    })

    // Add LeadGens
    leadgenList.forEach(lg => {
      const target = targetsMap[lg.user_id]
      const achievements = leadgenAchievements[lg.user_id] || { calls: 0, leads: 0 }
      
      membersWithTargets.push({
        user_id: lg.user_id,
        name: lg.name,
        role: 'LeadGen',
        month: startDate,
        visits: 0,
        onboards: 0,
        calls: target?.monthly_calls || 0,
        leads: target?.monthly_leads || 0,
        workingDays: target?.working_days || 24,
        remarks: target?.remarks || '',
        achieved_visits: 0,
        achieved_onboards: 0,
        achieved_calls: achievements.calls,
        achieved_leads: achievements.leads
      })
    })

    return NextResponse.json({
      success: true,
      data: {
        month: targetMonth,
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
    console.error('Corporate manager current targets GET error:', error)
    return NextResponse.json({
      error: 'Internal server error',
      details: error.message
    }, { status: 500 })
  }
}
