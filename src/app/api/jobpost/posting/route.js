import { supabaseServer } from '@/lib/supabase-server'
import { NextResponse } from 'next/server'

export async function GET(request) {
  try {
    // ✅ Auth check
    const authHeader = request.headers.get('authorization')
    if (!authHeader) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authError } = await supabaseServer.auth.getUser(token)

    if (authError || !user) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }

    // ✅ Fetch BOTH jobpost tables
    const [domesticRes, corporateRes] = await Promise.all([
      supabaseServer
        .from('domestic_crm_jobpost')
        .select('*'),

      supabaseServer
        .from('corporate_crm_jobpost')
        .select('*')
    ])

    if (domesticRes.error || corporateRes.error) {
      return NextResponse.json({
        error: 'Failed to fetch jobposts',
        details: domesticRes.error?.message || corporateRes.error?.message
      }, { status: 500 })
    }

    const domesticData = domesticRes.data || []
    const corporateData = corporateRes.data || []

    // ✅ Add job_type
    const combinedJobposts = [
      ...domesticData.map(item => ({ ...item, job_type: 'domestic' })),
      ...corporateData.map(item => ({ ...item, job_type: 'corporate' }))
    ]

    if (combinedJobposts.length === 0) {
      return NextResponse.json({ success: true, data: [] })
    }

    // ✅ Collect req_ids
    const reqIds = [...new Set(combinedJobposts.map(i => i.req_id).filter(Boolean))]

    // ✅ Fetch BOTH req tables
    let reqDataMap = {}

    if (reqIds.length > 0) {
      const [domesticReqRes, corporateReqRes] = await Promise.all([
        supabaseServer
          .from('domestic_crm_reqs')
          .select('*')
          .in('req_id', reqIds),

        supabaseServer
          .from('corporate_crm_reqs')
          .select('*')
          .in('req_id', reqIds)
      ])

      const domesticReqs = domesticReqRes.data || []
      const corporateReqs = corporateReqRes.data || []

      // ✅ Merge reqs
      const combinedReqs = [
        ...domesticReqs.map(r => ({ ...r, job_type: 'domestic' })),
        ...corporateReqs.map(r => ({ ...r, job_type: 'corporate' }))
      ]

      combinedReqs.forEach(req => {
        // safer key (avoids collision)
        reqDataMap[`${req.req_id}_${req.job_type}`] = req
      })
    }

    // ✅ Transform final response
    const transformedData = combinedJobposts.map(item => ({
      id: item.id,
      date: item.assigned_date,
      client_name: item.client_name,
      job_title: item.profile,
      location: item.location,
      package: item.package,
      status: item.status || 'Assigned',
      jd_id: item.jd_id,
      job_type: item.job_type,
      req_data: reqDataMap[`${item.req_id}_${item.job_type}`] || null
    }))

    // ✅ Sort by latest date
    transformedData.sort(
      (a, b) => new Date(b.date || 0) - new Date(a.date || 0)
    )

    return NextResponse.json({
      success: true,
      data: transformedData
    })

  } catch (error) {
    console.error('Combined Jobpost API error:', error)
    return NextResponse.json({
      error: 'Internal server error',
      details: error.message
    }, { status: 500 })
  }
}

// Add this to your existing route.js file alongside the GET method

export async function PUT(request) {
  try {
    // Auth check
    const authHeader = request.headers.get('authorization')
    if (!authHeader) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authError } = await supabaseServer.auth.getUser(token)

    if (authError || !user) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }

    // Get request body
    const body = await request.json()
    const { jd_id, status, job_type } = body
    console.log("body",body);
    if (!jd_id || !status) {
      return NextResponse.json({ 
        error: 'Missing required fields: jd_id, status' 
      }, { status: 400 })
    }

    // Determine which table to update
    const tableName = job_type === 'corporate' 
      ? 'corporate_crm_jobpost' 
      : 'domestic_crm_jobpost'

    // Update the status
    const { data, error } = await supabaseServer
      .from(tableName)
      .update({ status: status })
      .eq('id', jd_id)
      .select()

    if (error) {
      return NextResponse.json({ 
        error: 'Failed to update status', 
        details: error.message 
      }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: 'Status updated successfully',
      data: data[0]
    })

  } catch (error) {
    console.error('Status update API error:', error)
    return NextResponse.json({
      error: 'Internal server error',
      details: error.message
    }, { status: 500 })
  }
}