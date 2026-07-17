import { supabaseServer } from '@/lib/supabase-server'
import { NextResponse } from 'next/server'
import { notificationService } from '@/lib/services/notificationService'
import { actions } from '@/lib/messages/userMessages';   // your notification file
import { getUser, getUserName } from '@/lib/auth-helper' // Import getUserName

// ✅ CREATE TARGET
export async function POST(request) {
  try {
    // 🔐 Auth check
   const { user, error: authError } = getUser(request)

if (authError || !user) {
  console.log('[API] Auth error:', authError)
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
}
      const actorName = await getUserName(request);
 

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
     await notificationService.createDynamicNotification( [user_id],actions.hod.targetCreated,user.id, { 
        extra: { actorName: actorName } 
      }  );

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

// ✅ UPDATE TARGET
export async function PUT(request) {
  try {
  const { user, error: authError } = getUser(request)

if (authError || !user) {
  console.log('[API] Auth error:', authError)
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
}

     const actorName = await getUserName(request);

    const body = await request.json()

    const {
      id,
      year,
      month,
      working_days,
      department,
      sector,
      role,
      user_id,
      targets
    } = body

    if (!id) {
      return NextResponse.json({ error: 'Target ID is required' }, { status: 400 })
    }

    if (!month || !department || !role || !user_id) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    const targetData = {
      year,
      month,
      working_days: Number(working_days),
      dept: department,
      sector,
      role,
      assigned_to: user_id,
    }

    if (targets && targets.length > 0) {
      targetData.kpi = targets[0].kpi_metric
      targetData.frequency = targets[0].frequency
      targetData.total_target = Number(targets[0].target)
      targetData.guideline = targets[0].guideline
    }

    const { error , data } = await supabaseServer
      .from('hod_targets')
      .update(targetData)
      .eq('target_id', id)
      .select('assigned_to')

    if (error) {
      console.error('Update error:', error)
      return NextResponse.json(
        { error: 'Failed to update target', details: error.message },
        { status: 500 }
      )
    }
    const assignedTo = data?.[0]?.assigned_to;
    await notificationService.createDynamicNotification( [assignedTo],actions.hod.targetUpdated,user.id , { 
        extra: { actorName: actorName } 
      } );

    return NextResponse.json({
      success: true,
      message: 'Target updated successfully'
    })

  } catch (err) {
    console.error('PUT API error:', err)
   
    return NextResponse.json(
      { error: 'Internal server error', details: err.message },
      { status: 500 }
    )
  }
}