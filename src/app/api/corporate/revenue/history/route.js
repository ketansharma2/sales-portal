import { supabaseServer } from '@/lib/supabase-server'
import { NextResponse } from 'next/server'

// GET: Fetch revenue records (list or single)
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

    let currentUserId = user.user_id || user.id
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
        const { data: revenueUser } = await supabaseServer
      .from('users')
      .select('user_id')
      .contains('role', ['REVENUE'])
      .eq('sector','Corporate')
      .limit(1)

        if (revenueUser) {
    currentUserId = revenueUser[0].user_id
  }
      }

    if (revenueId) {
      // Single record fetch
      const { data: revenue, error: fetchError } = await supabaseServer
        .from('corporate_revenue')
        .select('*')
        .eq('revenue_id', revenueId)
        .single()

      if (fetchError || !revenue) {
        return NextResponse.json({
          error: 'Revenue record not found',
          details: fetchError?.message
        }, { status: 404 })
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
          rc_name: rcName
        }
      })
    }

     // List fetch - all records filtered by sent_to_revenue
     const { data: revenueList, error: listError } = await supabaseServer
       .from('corporate_revenue')
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
 
     // Fetch latest candidate_status for each revenue_id from corporate_candidate_track
     let candidateStatusMap = {}
     if (uniqueRevenueIds.length > 0) {
       const { data: candidateTracks } = await supabaseServer
         .from('corporate_candidate_track')
         .select('revenue_id, candidate_status, created_at')
         .in('revenue_id', uniqueRevenueIds)
         .order('created_at', { ascending: false })
 
       if (candidateTracks) {
         // For each revenue_id, take the latest (first when sorted desc)
         candidateTracks.forEach(track => {
           if (track.candidate_status && !candidateStatusMap[track.revenue_id]) {
             candidateStatusMap[track.revenue_id] = track.candidate_status
           }
         })
       }
     }
 
     // Fetch latest payment_status for each revenue_id from corporate_payment_track
     let paymentStatusMap = {}
     if (uniqueRevenueIds.length > 0) {
       const { data: paymentTracks } = await supabaseServer
         .from('corporate_payment_track')
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
 
     const transformedData = (revenueList || []).map(record => ({
       ...record,
       crm_name: userMap[record.user_id] || 'Unknown',
       // Override with latest status from track tables if available, otherwise keep existing
       candidate_status: candidateStatusMap[record.revenue_id] || record.candidate_status || 'Pending Join',
       payment_status: paymentStatusMap[record.revenue_id] || record.payment_status || 'Pending'
     }))
 
     return NextResponse.json({ success: true, data: transformedData })

  } catch (error) {
    console.log("ERROR:",error);
    return NextResponse.json({ error: 'Internal server error', details: error.message }, { status: 500 })
  }
}

// PUT: Update revenue record
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

    if (!revenue_id) {
      return NextResponse.json({ error: 'Revenue ID is required' }, { status: 400 })
    }

    // Verify record exists
    const { data: existing, error: fetchError } = await supabaseServer
      .from('corporate_revenue')
      .select('revenue_id')
      .eq('revenue_id', revenue_id)
      .single()

    if (fetchError || !existing) {
      return NextResponse.json({ error: 'Record not found' }, { status: 404 })
    }

    // Build update object - whitelist allowed fields
    const allowedFields = [
      // Financial
      'payment_from', 'offer_salary', 'terms', 'payment_days', 'joining_date',
      'payment_due_date', 'payment_client_follow_date', 'base_invoice', 'total_amount', 'pi_date',
      // Candidate
      'candidate_name', 'candidate_email', 'candidate_mobile', 'profile',
      // Client
      'client_name', 'client_email', 'client_mobile'
    ]

    const updateData = {}
    allowedFields.forEach(field => {
      if (updateFields[field] !== undefined) {
        updateData[field] = updateFields[field] === '' ? null : updateFields[field]
      }
    })

    // Update
    const { data: updated, error: updateError } = await supabaseServer
      .from('corporate_revenue')
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
