import { supabaseServer } from '@/lib/supabase-server'
import { NextResponse } from 'next/server'

// GET: Fetch domestic revenue records (list or single)
export async function GET(request) {
  try {
    // Authentication
    console.log('dhdhsdhdfhfdh2');
    const authHeader = request.headers.get('authorization')
    if (!authHeader) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authError } = await supabaseServer.auth.getUser(token)
    if (authError || !user) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }

    let  currentUserId = user.user_id || user.id
    const { searchParams } = new URL(request.url)
    const revenueId = searchParams.get('revenue_id')


    const { data: userData } = await supabaseServer
      .from('users')
      .select('role')
      .eq('user_id', currentUserId)
      .single()


       const userRoles = userData?.role || 'REVENUE'
      console.log('userData', userData);
      const isAdminOrDirector = userRoles.includes('ADMIN')

      if(isAdminOrDirector){
        const { data: revenueUser,error } = await supabaseServer
      .from('users')
      .select('user_id')
      .contains('role', ['REVENUE'])
      .eq('sector','Domestic')
      .limit(1)
      console.log('error:', error)
      console.log('revenueUser',revenueUser);
       if (revenueUser) {
    currentUserId = revenueUser[0].user_id
  }
      }

    if (revenueId) {
      // Single record fetch (supports numeric revenue_id as per your DB)
      const { data: revenue, error: fetchError } = await supabaseServer
        .from('domestic_revenue')
        .select('*')
        .eq('revenue_id', revenueId)
        .single()

      if (fetchError || !revenue) {
        return NextResponse.json({
          error: 'Revenue record not found',
          details: 'No record found with this revenue_id. Please check the ID.'
        }, { status: 404 })
      }
      let latestRetentionStatus = null

const { data: latestRetention } = await supabaseServer
  .from('domestic_retention_logs')
  .select('retention_status')
  .eq('revenue_id', revenueId)
  .order('created_at', { ascending: false })
  .limit(1)
  .single()

if (latestRetention) {
  latestRetentionStatus = latestRetention.retention_status
}


      // Fetch CRM name
      let crmName = 'Unknown'
      if (revenue.user_id) {
        const { data: userData } = await supabaseServer
          .from('users')
          .select('name')
          .eq('user_id', revenue.user_id)
          .single()
        if (userData) crmName = userData.name
      }

      // Fetch TL name
      let tlName = null
      if (revenue.tl_id) {
        const { data: tlUser } = await supabaseServer
          .from('users')
          .select('name')
          .eq('user_id', revenue.tl_id)
          .single()
        if (tlUser) tlName = tlUser.name
      }

      // Fetch RC name
      let rcName = null
      if (revenue.rc_id) {
        const { data: rcUser } = await supabaseServer
          .from('users')
          .select('name')
          .eq('user_id', revenue.rc_id)
          .single()
        if (rcUser) rcName = rcUser.name
      }

      return NextResponse.json({
        success: true,
        data: {
          ...revenue,
          crm_name: crmName,
          tl_name: tlName,
          rc_name: rcName,
           retention_status: latestRetentionStatus
        }
      })
    }

    // List fetch - all records filtered by sent_to_revenue (exact same as corporate)
    const { data: revenueList, error: listError } = await supabaseServer
      .from('domestic_revenue')
      .select('*')
      .eq('sent_to_revenue', currentUserId)
      .order('created_at', { ascending: false })

    if (listError) {
      return NextResponse.json({ error: 'Failed to fetch revenue data', details: listError.message }, { status: 500 })
    }

    // Get unique user_ids to fetch CRM names
    const uniqueUserIds = [...new Set((revenueList || []).map(r => r.user_id).filter(Boolean))]
    const uniqueRevenueIds = [...new Set((revenueList || []).map(r => r.revenue_id).filter(Boolean))]

    let userMap = {}
    if (uniqueUserIds.length > 0) {
      const { data: users } = await supabaseServer
        .from('users')
        .select('user_id, name')
        .in('user_id', uniqueUserIds)

      if (users) {
        users.forEach(u => { userMap[u.user_id] = u.name })
      }
    }

    // Fetch latest candidate_status for each revenue_id from domestic_candidate_track
    let candidateStatusMap = {}
    if (uniqueRevenueIds.length > 0) {
      const { data: candidateTracks } = await supabaseServer
        .from('domestic_candidate_track')
        .select('revenue_id, candidate_status, created_at')
        .in('revenue_id', uniqueRevenueIds)
        .order('created_at', { ascending: false })

      if (candidateTracks) {
        candidateTracks.forEach(track => {
          if (track.candidate_status && !candidateStatusMap[track.revenue_id]) {
            candidateStatusMap[track.revenue_id] = track.candidate_status
          }
        })
      }
    }

    // Fetch latest payment_status for each revenue_id from domestic_payment_track
    let paymentStatusMap = {}
    if (uniqueRevenueIds.length > 0) {
      const { data: paymentTracks } = await supabaseServer
        .from('domestic_payment_track')
        .select('revenue_id, payment_status, created_at')
        .in('revenue_id', uniqueRevenueIds)
        .order('created_at', { ascending: false })

      if (paymentTracks) {
        paymentTracks.forEach(track => {
          if (track.payment_status && !paymentStatusMap[track.revenue_id]) {
            paymentStatusMap[track.revenue_id] = track.payment_status
          }
        })
      }
    }

    // Fetch latest retention data from domestic_retention_logs (domestic specific)
    let retentionMap = {}
    if (uniqueRevenueIds.length > 0) {
      const { data: retentionLogs } = await supabaseServer
        .from('domestic_retention_logs')
        .select('revenue_id, retention_status, retention_amount, next_followup_date, log_date, created_at')
        .in('revenue_id', uniqueRevenueIds)
        .order('created_at', { ascending: false })

      if (retentionLogs) {
        retentionLogs.forEach(log => {
          if (!retentionMap[log.revenue_id]) {
            retentionMap[log.revenue_id] = {
              retention_status: log.retention_status,
              retention_amount: log.retention_amount,
              retention_target_date: log.next_followup_date
            }
          }
        })
      }
    }

    const transformedData = (revenueList || []).map(record => ({
      ...record,
      crm_name: userMap[record.user_id] || 'Unknown',
      // Override with latest status from track tables (exact same pattern as corporate)
      candidate_status: candidateStatusMap[record.revenue_id] || record.candidate_status || 'Pending Join',
      payment_status: paymentStatusMap[record.revenue_id] || record.payment_status || 'Pending',
      // Domestic retention enrichment
      retention_status: retentionMap[record.revenue_id]?.retention_status || record.retention_status || 'In Progress',
      retention_amount: retentionMap[record.revenue_id]?.retention_amount || record.retention_amount || 0,
      retention_target_date: retentionMap[record.revenue_id]?.retention_target_date || record.retention_target_date || null
    }))

    return NextResponse.json({ success: true, data: transformedData })

  } catch (error) {
    return NextResponse.json({ error: 'Internal server error', details: error.message }, { status: 500 })
  }
}

// PUT: Update revenue record (exact same structure as corporate)
export async function PUT(request) {
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

    

    const body = await request.json()
    const { revenue_id, ...updateFields } = body
    console.log("body:", body);
    if (!revenue_id) {
      return NextResponse.json({ error: 'Revenue ID is required' }, { status: 400 })
    }

    // Verify record exists
    const { data: existing, error: fetchError } = await supabaseServer
      .from('domestic_revenue')
      .select('revenue_id')
      .eq('revenue_id', revenue_id)
      .single()

    if (fetchError || !existing) {
      return NextResponse.json({ error: 'Record not found' }, { status: 404 })
    }

    // Build update object - whitelist allowed fields (adapted for domestic)
    const allowedFields = [
      // Financial
      'payment_from', 'offer_salary', 'terms', 'payment_days', 'joining_date',
      'payment_due_date', 'payment_follow_up', 'base_invoice', 'total_with_gst', 'pi_date',
      // Candidate
      'candidate_name', 'candidate_email', 'candidate_mobile', 'profile',
      // Client
      'client_name', 'client_email', 'client_mobile', 'retention_with_gst',
      // Retention
      'retention_amount', 'retention_target_date'
    ]

    const updateData = {}
    allowedFields.forEach(field => {
      if (updateFields[field] !== undefined) {
        updateData[field] = updateFields[field] === '' ? null : updateFields[field]
      }
    })

    // Update
    const { data: updated, error: updateError } = await supabaseServer
      .from('domestic_revenue')
      .update(updateData)
      .eq('revenue_id', revenue_id)
      .select()
      .single()

    if (updateError) {
      return NextResponse.json({ error: 'Failed to update record', details: updateError.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, data: updated })

  } catch (error) {
    return NextResponse.json({ error: 'Internal server error', details: error.message }, { status: 500 })
  }
}
