import { supabaseServer } from '@/lib/supabase-server'
import { NextResponse } from 'next/server'

export async function GET(request) {
  try {
    const authHeader = request.headers.get('authorization')
    if (!authHeader) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authError } = await supabaseServer.auth.getUser(token)
    if (authError || !user) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const monthFilter = searchParams.get('month')

    const currentUserId = user.user_id || user.id

    let query = supabaseServer
      .from('manager_targets')
      .select('*')
      .eq('assigned_to', currentUserId)
      .eq('role', 'FSE')
      .eq('sector', 'Corporate')
      .order('month', { ascending: false })

    if (monthFilter && monthFilter !== 'All') {
      query = query.ilike('month', `%${monthFilter}%`)
    }

    const { data: targets, error: targetsError } = await query

    if (targetsError) {
      console.error('FSE targets fetch error:', targetsError)
      return NextResponse.json({ error: 'Failed to fetch targets', details: targetsError.message }, { status: 500 })
    }

    const creatorUserIds = [...new Set((targets || []).map(t => t.user_id).filter(Boolean))]
    
    let creatorNames = {}
    if (creatorUserIds.length > 0) {
      const { data: users } = await supabaseServer
        .from('users')
        .select('user_id, name')
        .in('user_id', creatorUserIds)
      
      if (users) {
        users.forEach(u => { creatorNames[u.user_id] = u.name })
      }
    }

    const transformedTargets = (targets || []).map(target => ({
      id: target.target_id,
      year: target.year,
      month: target.month,
      workingDays: target.working_days,
      kpi_metric: target.kpi,
      frequency: target.frequency,
      totalTarget: target.total_target,
      achieved: target.achieved || 0,
      guideline: target.guideline || '',
      assignedBy: creatorNames[target.user_id] || '',
      assignedRole: target.role || 'FSE'
    }))

    return NextResponse.json({ success: true, data: transformedTargets })

  } catch (error) {
    console.error('FSE targets GET error:', error)
    return NextResponse.json({ error: 'Internal server error', details: error.message }, { status: 500 })
  }
}