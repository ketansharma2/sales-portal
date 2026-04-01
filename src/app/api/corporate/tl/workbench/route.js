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

    // Get current user's ID
    const currentUserId = user.user_id || user.id

    // Build query for workbench data filtered by sent_to_tl
    let query = supabaseServer
      .from('corporate_workbench')
      .select('*')
      .eq('sent_to_tl', currentUserId)
      .order('created_at', { ascending: false })

    const { data: workbenchData, error: fetchError } = await query

    if (fetchError) {
      console.error('Fetch TL workbench error:', fetchError)
      return NextResponse.json({
        error: 'Failed to fetch workbench data',
        details: fetchError.message
      }, { status: 500 })
    }

    // Fetch related data separately
    const clientIds = [...new Set(workbenchData.map(item => item.client_id).filter(Boolean))]
    const reqIds = [...new Set(workbenchData.map(item => item.req_id).filter(Boolean))]
    const recruiterIds = [...new Set(workbenchData.map(item => item.sent_to_rc).filter(Boolean))]

    // Fetch clients
    const { data: clientsData } = await supabaseServer
      .from('corporate_crm_clients')
      .select('client_id, company_name')
      .in('client_id', clientIds)

    // Fetch requirements
    const { data: reqsData } = await supabaseServer
      .from('corporate_crm_reqs')
      .select('req_id, job_title, experience, package, openings, location, employment_type, working_days, timings, tool_req, job_summary, rnr, req_skills, preferred_qual, company_offers, contact_details')
      .in('req_id', reqIds)

    // Fetch recruiters
    const { data: recruitersData } = await supabaseServer
      .from('users')
      .select('user_id, name, email')
      .in('user_id', recruiterIds)

    // Create lookup maps
    const clientsMap = new Map(clientsData?.map(c => [c.client_id, c]) || [])
    const reqsMap = new Map(reqsData?.map(r => [r.req_id, r]) || [])
    const recruitersMap = new Map(recruitersData?.map(r => [r.user_id, r]) || [])

    // Transform data for UI
    const transformedData = workbenchData.map(item => {
      const client = clientsMap.get(item.client_id)
      const req = reqsMap.get(item.req_id)
      const recruiter = recruitersMap.get(item.sent_to_rc)

      return {
        id: item.workbench_id,
        date: item.date,
        client_id: item.client_id,
        client_name: client?.company_name || 'Unknown Client',
        req_id: item.req_id,
        job_title: req?.job_title || 'Unknown Requirement',
        experience: req?.experience || '',
        package: item.package || req?.package || '',
        openings: req?.openings || 0,
        requirement: item.req,
        sent_to_tl: item.sent_to_tl,
        sent_to_rc: item.sent_to_rc,
        recruiter_name: recruiter?.name || '',
        slot: item.slot || '',
        user_id: item.user_id,
        created_at: item.created_at,
        // TL remarks
        tl_remarks: item.tl_remarks || '',
        // JD details from requirements
        location: req?.location || '',
        employment_type: req?.employment_type || '',
        working_days: req?.working_days || '',
        timings: req?.timings || '',
        tool_requirement: req?.tool_req || '',
        job_summary: req?.job_summary || '',
        rnr: req?.rnr || '',
        req_skills: req?.req_skills || '',
        preferred_qual: req?.preferred_qual || '',
        company_offers: req?.company_offers || '',
        contact_details: req?.contact_details || ''
      }
    })

    return NextResponse.json({
      success: true,
      data: transformedData
    })

  } catch (error) {
    console.error('Fetch TL workbench API error:', error)
    return NextResponse.json({
      error: 'Internal server error',
      details: error.message
    }, { status: 500 })
  }
}
