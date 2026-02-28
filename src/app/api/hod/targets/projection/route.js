import { supabaseServer } from '@/lib/supabase-server'
import { NextResponse } from 'next/server'

// GET - Fetch future months' projections for HOD's managers
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
    
    // Get current month to filter out past months
    const currentDate = new Date()
    const currentMonth = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}`
    
    // Determine target months - if monthParam provided, use it, otherwise get future months
    let targetMonths = []
    
    if (monthParam) {
      // If specific month requested, only use it if it's a future month
      if (monthParam > currentMonth) {
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
      // Get next 3 future months
      for (let i = 1; i <= 3; i++) {
        const d = new Date(currentDate.getFullYear(), currentDate.getMonth() + i, 1)
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

    // Fetch targets from hod_sm_targets for future months
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

    // Filter targets for future months only
    const futureTargets = (allTargets || []).filter(t => {
      if (!t.month) return false
      const targetMonth = t.month.substring(0, 7) // YYYY-MM
      return targetMonth > currentMonth && targetMonths.includes(targetMonth)
    })

    // Create a map of targets by sm_id and month
    const targetsMap = {}
    futureTargets.forEach(t => {
      const key = `${t.sm_id}_${t.month.substring(0, 7)}`
      targetsMap[key] = t
    })

    // Get member count per manager (for projections)
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

    // Count FSEs and LeadGens per manager
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

    // Build the response with targets
    const managersWithTargets = []

    managerList.forEach(manager => {
      targetMonths.forEach(month => {
        const key = `${manager.user_id}_${month}`
        const target = targetsMap[key]
        
        managersWithTargets.push({
          id: target?.id ? `${manager.user_id}_${month}` : null,
          user_id: manager.user_id,
          name: manager.name,
          role: 'Manager',
          month: month,
          fseCount: target?.fse_count || memberCountMap[manager.user_id]?.fse || 0,
          callersCount: target?.callers_count || memberCountMap[manager.user_id]?.leadgen || 0,
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
          isProjection: !target // Flag to indicate this is a projection (not yet set)
        })
      })
    })

    // Sort by month (soonest first)
    managersWithTargets.sort((a, b) => a.month.localeCompare(b.month))

    return NextResponse.json({
      success: true,
      data: {
        month: monthParam || targetMonths[0] || currentMonth,
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
    console.error('HOD projection targets GET error:', error)
    return NextResponse.json({
      error: 'Internal server error',
      details: error.message
    }, { status: 500 })
  }
}
