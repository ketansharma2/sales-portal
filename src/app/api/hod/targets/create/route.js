import { supabaseServer } from '@/lib/supabase-server'
import { NextResponse } from 'next/server'

// ✅ CREATE TARGET
export async function POST(request) {
  try {
    // 🔐 Auth check
    const authHeader = request.headers.get('authorization')
    if (!authHeader) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const token = authHeader.replace('Bearer ', '')

    const { data: { user }, error: authError } =
      await supabaseServer.auth.getUser(token)

    if (authError || !user) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }

    // 📥 Get body
    const body = await request.json()

    const {
      year,
      month,
      working_days,
      department,
      sector,
      role,
      user_id,
      targets
    } = body

    // ✅ Basic validation
    if (!month || !department || !role || !user_id) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // 📦 Prepare insert data (multiple KPI rows)
    const rows = targets.map(t => ({
        user_id:user.id,
      year,
      month,
      working_days,
      dept:department,
      sector,
      role,
     assigned_to: user_id,
      kpi: t.kpi_metric,
      frequency: t.frequency,
      total_target: t.target,
      guideline: t.guideline,
      
    }))

    const { error } = await supabaseServer
      .from('hod_targets')
      .insert(rows)

    if (error) {
      console.error('Insert error:', error)
      return NextResponse.json(
        { error: 'Failed to create target', details: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Target created successfully'
    })

  } catch (err) {
    console.error('POST API error:', err)

    return NextResponse.json(
      { error: 'Internal server error', details: err.message },
      { status: 500 }
    )
  }
}