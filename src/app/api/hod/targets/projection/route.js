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
    const monthParam = searchParams.get('month') // YYYY-MM or YYYY-MM-DD format
    
    // Normalize month to YYYY-MM format
    const normalizedMonth = monthParam ? monthParam.substring(0, 7) : null
    
    // Get current user info to check role
    const { data: userData, error: userDataError } = await supabaseServer
      .from('users')
      .select('user_id, name, role')
      .eq('user_id', user.id)
      .single()
    
    const userRole = userData?.role
    const roleStr = Array.isArray(userRole) ? userRole.join(' ') : (userRole || '')
    const isHod = roleStr.toUpperCase().includes('HOD')
    
    console.log('HOD projection - user role:', roleStr, 'isHod:', isHod)
    
    // Get current month to filter out past months (only for reference, not filtering)
    const currentDate = new Date()
    const currentMonth = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}`
    
    // Determine target months - fetch all if no month param, otherwise get specific month
    let targetMonths = []
    
    if (normalizedMonth) {
      // If specific month requested (normalized to YYYY-MM)
      targetMonths = [normalizedMonth]
    } else {
      // Get all months from database
      targetMonths = []
    }

    // Get all managers (SMs) under this HOD by matching hod_id
    console.log('HOD projection - user.id:', user.id)
    const { data: teamMembers, error: membersError } = await supabaseServer
      .from('users')
      .select('user_id, name, role, manager_id, hod_id, region, sector')
      .eq('hod_id', user.id)
      .order('name')

    console.log('HOD projection - teamMembers count:', teamMembers?.length || 0)
    console.log('HOD projection - membersError:', membersError)
    
    // Filter only managers (SM roles)
    const managerList = (teamMembers || []).filter(u => {
      const roleStr = Array.isArray(u.role) ? u.role.join(' ') : (u.role || '')
      return roleStr.toUpperCase().includes('MANAGER') || roleStr.toUpperCase().includes('SM')
    })
    
    console.log('HOD projection - managerList count:', managerList.length)
    console.log('HOD projection - all team member roles:', (teamMembers || []).map(u => ({ name: u.name, role: u.role })))
    
    // If no team members found, return informative message
    if (!teamMembers || teamMembers.length === 0) {
      return NextResponse.json({
        success: true,
        data: {
          month: monthParam || targetMonths[0] || currentMonth,
          targets: [],
          managers: [],
          message: isHod ? 'No team members found under your hod_id. Check that users have hod_id set to your user_id.' : 'You do not have HOD role. Contact administrator.',
          debug: {
            userId: user.id,
            userRole: roleStr,
            isHod: isHod,
            teamMembersCount: 0
          }
        }
      })
    }
    
    // If managers list is empty after filtering, return info
    if (managerList.length === 0) {
      return NextResponse.json({
        success: true,
        data: {
          month: monthParam || targetMonths[0] || currentMonth,
          targets: [],
          managers: [],
          message: 'No managers (SMs) found under you. The team members exist but their roles do not contain "MANAGER" or "SM".',
          debug: {
            userId: user.id,
            userRole: roleStr,
            isHod: isHod,
            teamMembersCount: teamMembers.length,
            teamMemberRoles: teamMembers.map(u => ({ name: u.name, role: u.role }))
          }
        }
      })
    }
    
    if (membersError) {
      console.error('Team members fetch error:', membersError)
      return NextResponse.json({
        error: 'Failed to fetch team members',
        details: membersError.message
      }, { status: 500 })
    }

    const managerIds = managerList.map(m => m.user_id)

    // Fetch ALL targets from hod_sm_targets (no month filter)
    // Frontend will handle filtering by month
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

    // Don't filter by month - return all targets
    // Get all targets from DB (no filtering)
    const existingTargets = allTargets || []

    // Create a map of targets by sm_id and month
    const targetsMap = {}
    existingTargets.forEach(t => {
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

    // Build the response with targets - only include months that have targets in DB
    const monthsToShow = [...new Set((existingTargets || []).map(t => t.month?.substring(0, 7)).filter(Boolean))]
    
    // Only show managers who actually have targets in DB (when no specific month is requested)
    // Get unique manager IDs that have targets in DB
    const managerIdsWithTargets = [...new Set(existingTargets.map(t => t.sm_id))]
    
    // If specific month requested, show all managers; otherwise only show managers with existing targets
    const displayManagers = normalizedMonth ? managerList : managerList.filter(m => managerIdsWithTargets.includes(m.user_id))

    // Build the response with targets
    const managersWithTargets = []

    // If no targets exist at all, don't show any cards
    if (existingTargets.length === 0) {
      return NextResponse.json({
        success: true,
        data: {
          month: normalizedMonth || currentMonth,
          targets: [],
          managers: managerList.map(m => ({
            id: m.user_id,
            name: m.name,
            region: m.region || '',
            sector: m.sector || '',
            role: 'Manager',
            fseCount: memberCountMap[m.user_id]?.fse || 0,
            callerCount: memberCountMap[m.user_id]?.leadgen || 0
          }))
        }
      })
    }

    displayManagers.forEach(manager => {
      // Get months that have targets for this specific manager
      const managerTargetMonths = [...new Set(
        existingTargets
          .filter(t => t.sm_id === manager.user_id)
          .map(t => t.month?.substring(0, 7))
          .filter(Boolean)
      )]
      
      // If specific month requested, only show that month if this manager has a target for it
      // Otherwise show only months that have targets for this manager
      let monthsToProcess = []
      if (normalizedMonth) {
        // Check if this manager has a target for the requested month
        const key = `${manager.user_id}_${normalizedMonth}`
        if (targetsMap[key]) {
          monthsToProcess = [normalizedMonth]
        }
      } else {
        monthsToProcess = managerTargetMonths
      }
      
      // If no months to process (manager has no targets), skip this manager
      if (monthsToProcess.length === 0) {
        return
      }
      
      monthsToProcess.forEach(month => {
        const key = `${manager.user_id}_${month}`
        const target = targetsMap[key]
        
        managersWithTargets.push({
          id: target?.id || null,
          user_id: manager.user_id,
          sm_id: manager.user_id,
          name: manager.name,
          region: manager.region || '',
          sector: manager.sector || '',
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
          ctcGeneration: target?.ctc_generation || 0,
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
        month: monthParam || (monthsToShow.length > 0 ? monthsToShow[0] : currentMonth),
        targets: managersWithTargets,
        managers: managerList.map(m => {
          const roleStr = Array.isArray(m.role) ? m.role.join(' ') : (m.role || '')
          return {
            id: m.user_id,
            name: m.name,
            region: m.region || '',
            sector: m.sector || '',
            role: 'Manager',
            fseCount: memberCountMap[m.user_id]?.fse || 0,
            callerCount: memberCountMap[m.user_id]?.leadgen || 0
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
