  import { supabaseServer } from '@/lib/supabase-server'
import { NextResponse } from 'next/server'

export async function GET(request) {
  try {
    // Debug: Log the request URL and parameters
    const { searchParams } = new URL(request.url);
    const requestedMonth = searchParams.get('month');
    console.log('=== DOMESTIC FSE TARGETS API DEBUG ===');
    console.log('Requested month param:', requestedMonth);
    
    // Authentication
    const authHeader = request.headers.get('authorization')
    if (!authHeader) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authError } = await supabaseServer.auth.getUser(token)
    if (authError || !user) {
      console.log('Auth error:', authError);
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }
    console.log('Authenticated user ID:', user.id);

    // Get all targets for this FSE from domestic_sm_fse_targets table
    // Return all rows - frontend will filter by month
    let query = supabaseServer
      .from('domestic_sm_fse_targets')
      .select('id, month, fse_id, monthly_visits, monthly_onboards, monthly_calls, monthly_leads, working_days, remarks, ctc_generation')
      .eq('fse_id', user.id)
    
    // Filter by month if provided (format: YYYY-MM-DD)
    if (requestedMonth) {
      const monthPrefix = requestedMonth.substring(0, 7); // Extract YYYY-MM from YYYY-MM-DD
      console.log('Filtering by month prefix:', monthPrefix);
      query = query.like('month', `${monthPrefix}%`);
    }
    
    let { data: targets, error: targetsError } = await query
      .order('month', { ascending: false })
    
    // If month filter returned no results, get the latest target as fallback
    if ((!targets || targets.length === 0) && requestedMonth) {
      console.log('No target for specific month, fetching latest target as fallback');
      const { data: fallbackTarget, error: fallbackError } = await supabaseServer
        .from('domestic_sm_fse_targets')
        .select('id, month, fse_id, monthly_visits, monthly_onboards, monthly_calls, monthly_leads, working_days, remarks, ctc_generation')
        .eq('fse_id', user.id)
        .order('month', { ascending: false })
        .limit(1);
      
      if (!fallbackError && fallbackTarget && fallbackTarget.length > 0) {
        targets = fallbackTarget;
        console.log('Using fallback target:', targets[0]);
      }
    }

    console.log('Database query result - targets count:', targets?.length || 0);
    console.log('Database query result - targets:', targets);

    if (targetsError) {
      console.error('Targets fetch error:', targetsError)
      return NextResponse.json({
        error: 'Failed to fetch targets',
        details: targetsError.message
      }, { status: 500 })
    }

    if (!targets || targets.length === 0) {
      console.log('No targets found in database for user:', user.id);
    }

    // Fetch all FSE interactions (for achievements calculation per month)
    const { data: allInteractions, error: intError } = await supabaseServer
      .from('domestic_clients_interaction')
      .select('user_id, client_id, status, contact_date, contact_mode')
      .eq('user_id', user.id)
      .order('contact_date', { ascending: false })

    // Calculate achievements per month
    const achievementsMap = {}
    
    if (!intError && allInteractions && allInteractions.length > 0) {
      // Group interactions by month
      allInteractions.forEach(int => {
        if (!int.contact_date) return
        
        const monthKey = int.contact_date.substring(0, 7) // YYYY-MM
        if (!achievementsMap[monthKey]) {
          achievementsMap[monthKey] = { visits: 0, onboards: 0, clients: {} }
        }
        
        const clientId = int.client_id
        if (!achievementsMap[monthKey].clients[clientId]) {
          achievementsMap[monthKey].clients[clientId] = {}
        }
        
        const dateKey = `${int.contact_date}`
        const mode = int.contact_mode?.toLowerCase() || ''
        
        // Count visits: distinct client per unique date with contact_mode = 'visit'
        if (mode === 'visit') {
          if (!achievementsMap[monthKey].clients[clientId][dateKey]) {
            achievementsMap[monthKey].clients[clientId][dateKey] = { visit: true }
          } else {
            achievementsMap[monthKey].clients[clientId][dateKey].visit = true
          }
        }
        
        // Track latest status for onboards
        const statusKey = `${clientId}_status`
        if (!achievementsMap[monthKey].clients[clientId][statusKey] || 
            int.contact_date > achievementsMap[monthKey].clients[clientId][statusKey].date) {
          achievementsMap[monthKey].clients[clientId][statusKey] = {
            status: int.status,
            date: int.contact_date
          }
        }
      })

      // Calculate achievements per month
      Object.keys(achievementsMap).forEach(monthKey => {
        const monthData = achievementsMap[monthKey]
        let visits = 0
        let onboards = 0
        Object.keys(monthData.clients).forEach(clientId => {
          const client = monthData.clients[clientId]
          // Count unique dates with visits
          const visitDates = Object.keys(client).filter(k => !k.endsWith('_status') && client[k]?.visit)
          visits += visitDates.length
          // Count onboards
          if (client[`${clientId}_status`]?.status === 'Onboarded') {
            onboards++
          }
        })
        monthData.visits = visits
        monthData.onboards = onboards
      })
    }

    // Transform data - convert month from YYYY-MM-DD to YYYY-MM format
    // Include achievements for each target's month
    const transformedTargets = (targets || []).map(target => {
      const monthKey = target.month ? target.month.substring(0, 7) : null
      const monthAchievements = achievementsMap?.[monthKey] || { visits: 0, onboards: 0 }
      
      return {
        id: target.id,
        month: monthKey, // Transform YYYY-MM-DD to YYYY-MM
        fse_id: target.fse_id,
        monthly_visits: target.monthly_visits,
        monthly_onboards: target.monthly_onboards,
        monthly_calls: target.monthly_calls,
        monthly_leads: target.monthly_leads,
        working_days: target.working_days,
        remarks: target.remarks,
        ctc_generation: target.ctc_generation,
        achieved_visits: monthAchievements.visits,
        achieved_onboards: monthAchievements.onboards
      }
    })

    return NextResponse.json({
      success: true,
      data: {
        targets: transformedTargets,
        count: transformedTargets.length
      }
    })

  } catch (error) {
    console.error('Domestic FSE targets GET error:', error)
    return NextResponse.json({
      error: 'Internal server error',
      details: error.message
    }, { status: 500 })
  }
}
