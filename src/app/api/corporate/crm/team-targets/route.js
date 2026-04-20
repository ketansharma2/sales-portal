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
    const roleFilter = searchParams.get('role')
    const nameFilter = searchParams.get('name')

    const currentUserId = user.user_id || user.id

    let query = supabaseServer
      .from('manager_targets')
      .select('*')
      .eq('user_id', currentUserId)
      .eq('sector', 'Corporate')
      .eq('dept', 'Delivery')
      .order('created_at', { ascending: false })

    if (monthFilter && monthFilter !== 'All') {
      query = query.ilike('month', `%${monthFilter}%`)
    }

    const { data: targets, error: targetsError } = await query

    if (targetsError) {
      console.error('Team targets fetch error:', targetsError)
      return NextResponse.json({ error: 'Failed to fetch targets', details: targetsError.message }, { status: 500 })
    }

    const assignedToUserIds = [...new Set((targets || []).map(t => t.assigned_to).filter(Boolean))]
    
    let assignedToNames = {}
    if (assignedToUserIds.length > 0) {
      const { data: users } = await supabaseServer
        .from('users')
        .select('user_id, name')
        .in('user_id', assignedToUserIds)
      
      if (users) {
        users.forEach(u => { assignedToNames[u.user_id] = u.name })
      }
    }

    let filteredTargets = (targets || []).map(target => ({
      id: target.target_id,
      year: target.year,
      month: target.month,
      workingDays: target.working_days,
      dept: target.dept,
      sector: target.sector,
      role: target.role,
      assignedTo: assignedToNames[target.assigned_to] || target.assigned_to,
      assignedToId: target.assigned_to,
      guideline: target.guideline || '',
      kpi_metric: target.kpi,
      frequency: target.frequency,
      target: target.total_target,
      achieved: target.achieved || 0
    }))

    if (roleFilter && roleFilter !== 'All') {
      filteredTargets = filteredTargets.filter(t => t.role === roleFilter)
    }

    if (nameFilter && nameFilter !== 'All') {
      filteredTargets = filteredTargets.filter(t => t.assignedTo === nameFilter)
    }

    return NextResponse.json({ success: true, data: filteredTargets })

  } catch (error) {
    console.error('Team targets GET error:', error)
    return NextResponse.json({ error: 'Internal server error', details: error.message }, { status: 500 })
  }
}

export async function POST(request) {
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

    const body = await request.json()
    const { year, month, working_days, assigned_to, role, targets } = body

    if (!year || !month || !assigned_to || !targets || !Array.isArray(targets)) {
      return NextResponse.json({ error: 'Missing required fields or invalid targets array' }, { status: 400 })
    }

    const currentUserId = user.user_id || user.id

    const targetsToInsert = targets.map(t => ({
      user_id: currentUserId,
      year: parseInt(year),
      month: month,
      working_days: parseInt(working_days) || 0,
      dept: 'Delivery',
      sector: 'Corporate',
      role: role || '',
      assigned_to: assigned_to,
      kpi: t.kpi_metric,
      frequency: t.frequency || 'Monthly',
      total_target: parseInt(t.target) || 0,
      guideline: t.guideline || ''
    }))

    const { data, error } = await supabaseServer
      .from('manager_targets')
      .insert(targetsToInsert)
      .select()

    if (error) {
      console.error('Insert targets error:', error)
      return NextResponse.json({ error: 'Failed to save targets', details: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, data })

  } catch (error) {
    console.error('POST targets error:', error)
    return NextResponse.json({ error: 'Internal server error', details: error.message }, { status: 500 })
  }
}

export async function PUT(request) {
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

    const body = await request.json()
    const { target_id, year, month, working_days, role, guideline, kpi, frequency, total_target } = body

    if (!target_id) {
      return NextResponse.json({ error: 'Target ID is required' }, { status: 400 })
    }

    const currentUserId = user.user_id || user.id

    const { data, error } = await supabaseServer
      .from('manager_targets')
      .update({
        year: parseInt(year),
        month: month,
        working_days: parseInt(working_days) || 0,
        role: role || '',
        guideline: guideline || '',
        kpi: kpi,
        frequency: frequency || 'Monthly',
        total_target: parseInt(total_target) || 0
      })
      .eq('target_id', target_id)
      .eq('user_id', currentUserId)
      .select()

    if (error) {
      console.error('Update targets error:', error)
      return NextResponse.json({ error: 'Failed to update target', details: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, data })

  } catch (error) {
    console.error('PUT targets error:', error)
    return NextResponse.json({ error: 'Internal server error', details: error.message }, { status: 500 })
  }
}