import { supabaseServer } from '@/lib/supabase-server'
import { NextResponse } from 'next/server'

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

    const { searchParams } = new URL(request.url)
    const crmId = searchParams.get('crm_id')

    // Build query - filter by crm_id if provided, otherwise get all for this user
    let query = supabaseServer
      .from('corporate_revenue')
      .select('*')
      .order('created_at', { ascending: false })

    if (crmId) {
      query = query.eq('crm_id', crmId)
    } else {
      query = query.eq('crm_id', user.id)
    }

    const { data: revenue, error } = await query

    // If we have revenue data, fetch recruiter names and payment followups
    if (revenue && revenue.length > 0) {
      // Get unique revenue IDs
      const revenueIds = revenue.map(r => r.id)
      
      // Fetch payment followups for all revenue records
      const { data: allFollowups, error: followupsError } = await supabaseServer
        .from('corporate_payment_followup')
        .select('*')
        .in('id', revenueIds)
        .order('created_at', { ascending: false })
      
      // Group followups by revenue ID and get latest next_follow_up
      const followupByRevenue = {}
      const allFollowupsList = {}
      const latestPaymentStatusByRevenue = {}
      
      if (allFollowups && allFollowups.length > 0) {
        allFollowups.forEach(followup => {
          const revId = followup.id
          if (!allFollowupsList[revId]) {
            allFollowupsList[revId] = []
          }
          allFollowupsList[revId].push(followup)
          
          // Store latest next_follow_up (most recent created_at has the latest next_follow_up)
          if (followup.next_follow_up) {
            if (!followupByRevenue[revId] || 
                new Date(followup.created_at) > new Date(followupByRevenue[revId].created_at)) {
              followupByRevenue[revId] = followup
            }
          }
          
          // Store latest payment_status (most recent followup has the latest status)
          if (!latestPaymentStatusByRevenue[revId] || 
              new Date(followup.created_at) > new Date(latestPaymentStatusByRevenue[revId].created_at)) {
            latestPaymentStatusByRevenue[revId] = { 
              payment_status: followup.payment_status,
              created_at: followup.created_at 
            }
          }
        })
      }
      
      // Get unique recruiter IDs
      const recruiterIds = [...new Set(revenue.map(r => r.recruiter_id).filter(Boolean))]
      
      if (recruiterIds.length > 0) {
        const { data: recruiters, error: recruiterError } = await supabaseServer
          .from('users')
          .select('user_id, name')
          .in('user_id', recruiterIds)
        
        if (!recruiterError && recruiters) {
          // Create a map of recruiter_id -> name
          const recruiterMap = {}
          recruiters.forEach(r => {
            recruiterMap[r.user_id] = r.name
          })
          
          // Add recruiter_name, next_follow_up, and followup_history to each revenue record
          revenue.forEach(r => {
            r.recruiter_name = r.recruiter_id ? recruiterMap[r.recruiter_id] || null : null
            r.next_follow_up = followupByRevenue[r.id]?.next_follow_up || null
            r.followup_history = allFollowupsList[r.id] || []
            r.latest_payment_status = latestPaymentStatusByRevenue[r.id]?.payment_status || null
          })
        }
      } else {
        // No recruiters but still add followup data
        revenue.forEach(r => {
          r.recruiter_name = null
          r.next_follow_up = followupByRevenue[r.id]?.next_follow_up || null
          r.followup_history = allFollowupsList[r.id] || []
          r.latest_payment_status = latestPaymentStatusByRevenue[r.id]?.payment_status || null
        })
      }
    }

    if (error) {
      console.error('Fetch revenue error:', error)
      return NextResponse.json({ error: 'Failed to fetch revenue data' }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      data: revenue || []
    })

  } catch (error) {
    console.error('Revenue GET API error:', error)
    return NextResponse.json({
      error: 'Internal server error',
      details: error.message
    }, { status: 500 })
  }
}

export async function POST(request) {
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
    const {
      user_id,
      client_id,
      client_name,
      client_email,
      client_mobile,
      parsing_id,
      candidate_name,
      candidate_email,
      candidate_mobile,
      kyc_doc,
      offer_salary,
      terms,
      payment_days,
      sent_to_revenue
    } = body

    // Validate required fields
    if (!candidate_name || !client_name) {
      return NextResponse.json({ 
        error: 'Missing required fields',
        details: 'candidate_name and client_name are required'
      }, { status: 400 })
    }

    // Insert revenue record
    const insertData = {
      user_id: user_id || user.id,
      client_id,
      client_name,
      client_email,
      client_mobile,
      parsing_id,
      candidate_name,
      candidate_email,
      candidate_mobile,
      kyc_doc,
      offer_salary: offer_salary || null,
      terms,
      payment_days: payment_days || null,
      sent_to_revenue: sent_to_revenue || null
    }

    console.log('Insert data:', insertData)

    const { data: revenue, error } = await supabaseServer
      .from('corporate_revenue')
      .insert(insertData)
      .select()
      .single()

    if (error) {
      console.error('Insert revenue error:', error)
      return NextResponse.json({ 
        error: 'Failed to create revenue record',
        details: error.message
      }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      data: revenue
    }, { status: 201 })

  } catch (error) {
    console.error('Revenue POST API error:', error)
    return NextResponse.json({
      error: 'Internal server error',
      details: error.message
    }, { status: 500 })
  }
}

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
    const { id, ...updateData } = body

    if (!id) {
      return NextResponse.json({ error: 'Revenue ID is required' }, { status: 400 })
    }

    // Parse numeric fields
    const parsedData = {}
    if (updateData.offer_salary) {
      parsedData.offer_salary = parseFloat(updateData.offer_salary.toString().replace(/,/g, ''))
    }
    if (updateData.payment_days) {
      parsedData.payment_days = parseInt(updateData.payment_days.toString())
    }
    if (updateData.base_invoice) {
      parsedData.base_invoice = parseFloat(updateData.base_invoice.toString().replace(/,/g, ''))
    }
    if (updateData.total_amount) {
      parsedData.total_amount = parseFloat(updateData.total_amount.toString().replace(/,/g, ''))
    }

    // Add other fields
    if (updateData.candidate_name) parsedData.candidate_name = updateData.candidate_name
    if (updateData.client_name) parsedData.client_name = updateData.client_name
    if (updateData.position !== undefined) parsedData.position = updateData.position
    if (updateData.recruiter_id !== undefined) parsedData.recruiter_id = updateData.recruiter_id
    if (updateData.account_email !== undefined) parsedData.account_email = updateData.account_email
    if (updateData.payment_terms !== undefined) parsedData.payment_terms = updateData.payment_terms
    if (updateData.joining_date !== undefined) parsedData.joining_date = updateData.joining_date
    if (updateData.payment_due_date !== undefined) parsedData.payment_due_date = updateData.payment_due_date
    if (updateData.payment_client_follow_date !== undefined) parsedData.payment_due_date = updateData.payment_client_follow_date
    if (updateData.candidate_status !== undefined) parsedData.candidate_status = updateData.candidate_status
    if (updateData.kyc_link !== undefined) parsedData.kyc_link = updateData.kyc_link


    // Update revenue record
    const { data: revenue, error } = await supabaseServer
      .from('corporate_revenue')
      .update(parsedData)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('Update revenue error:', error)
      return NextResponse.json({ 
        error: 'Failed to update revenue record',
        details: error.message
      }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      data: revenue
    })

  } catch (error) {
    console.error('Revenue PUT API error:', error)
    return NextResponse.json({
      error: 'Internal server error',
      details: error.message
    }, { status: 500 })
  }
}
