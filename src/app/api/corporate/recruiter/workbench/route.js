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

    // Fetch workbench data filtered by sent_to_rc=logged_in user_id (no date filter)
    const { data: workbenchData, error } = await supabaseServer
      .from('corporate_workbench')
      .select('*')
      .eq('sent_to_rc', user.id)

    if (error) {
      console.error('Fetch workbench error:', error)
      return NextResponse.json({
        error: 'Failed to fetch workbench data',
        details: error.message
      }, { status: 500 })
    }

    // Get unique req_ids and tl_ids
    const reqIds = [...new Set(workbenchData?.map(item => item.req_id).filter(Boolean))] || []
    const tlIds = [...new Set(workbenchData?.map(item => item.sent_to_tl).filter(Boolean))] || []

    // Fetch requirements
    let reqsData = []
    if (reqIds.length > 0) {
      const { data: requirements } = await supabaseServer
        .from('corporate_crm_reqs')
        .select('req_id, branch_id, job_title, experience, package, openings, location, employment_type, working_days, timings, tool_req, job_summary, rnr, req_skills, preferred_qual, company_offers, contact_details')
        .in('req_id', reqIds)
      
      reqsData = requirements || []
    }

    // Fetch branch to client mapping
    const branchIds = [...new Set(reqsData.map(r => r.branch_id).filter(Boolean))] || []
    let branchesData = []
    if (branchIds.length > 0) {
      const { data: branches } = await supabaseServer
        .from('corporate_crm_branch')
        .select('branch_id, client_id')
        .in('branch_id', branchIds)
      
      branchesData = branches || []
    }
    const branchesMap = new Map(branchesData.map(b => [b.branch_id, b.client_id]))

    // Fetch client names
    const clientIds = [...new Set(branchesData.map(b => b.client_id).filter(Boolean))] || []
    let clientsData = []
    if (clientIds.length > 0) {
      const { data: clients } = await supabaseServer
        .from('corporate_crm_clients')
        .select('client_id, company_name')
        .in('client_id', clientIds)
      
      clientsData = clients || []
    }
    const clientsMap = new Map(clientsData.map(c => [c.client_id, c.company_name]))

    // Fetch TL users
    let usersData = []
    if (tlIds.length > 0) {
      const { data: users } = await supabaseServer
        .from('users')
        .select('user_id, name, email')
        .in('user_id', tlIds)
      
      usersData = users || []
    }

    // Fetch STI data for all workbench ids
    const workbenchIds = workbenchData?.map(item => item.workbench_id).filter(Boolean) || []
    let stiData = []
    if (workbenchIds.length > 0) {
      const { data: stiRecords } = await supabaseServer
        .from('corporate_workbench_sti')
        .select('workbench_id, advance_sti')
        .in('workbench_id', workbenchIds)
      
      stiData = stiRecords || []
    }

    // Calculate STI sum per workbench_id
    const stiSumMap = new Map()
    stiData.forEach(item => {
      const current = stiSumMap.get(item.workbench_id) || 0
      stiSumMap.set(item.workbench_id, current + (parseFloat(item.advance_sti) || 0))
    })

    // Create lookup maps
    const reqsMap = new Map(reqsData.map(r => [r.req_id, r]))
    const usersMap = new Map(usersData.map(u => [u.user_id, u]))

    // Transform data to match the format expected by the UI
    const transformedData = workbenchData?.map(item => {
      const req = reqsMap.get(item.req_id)
      const branchClientId = req?.branch_id ? branchesMap.get(req.branch_id) : null
      const clientName = branchClientId ? clientsMap.get(branchClientId) || 'Unknown Client' : 'Unknown Client'
      const tl = usersMap.get(item.sent_to_tl)
      const totalSti = stiSumMap.get(item.workbench_id) || 0

      return {
        id: item.workbench_id,
        date: item.date,
        status: item.status || 'Pending',
        req_id: item.req_id,
        client_name: clientName,
        job_title: req?.job_title || '',
        experience: req?.experience || '',
        package: item.package || req?.package || '',
        openings: req?.openings || 0,
        requirement: item.req || '',
        sent_to_tl: item.sent_to_tl,
        tl_name: tl?.name || 'Unknown TL',
        tl_email: tl?.email || '',
        sent_to_rc: item.sent_to_rc,
        user_id: item.user_id,
        created_at: item.created_at,
        slot: item.slot || '',
        // Remark fields
        advance_sti: totalSti,
        rc_remarks: item.rc_remarks || '',
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
    }) || []

    return NextResponse.json({
      success: true,
      data: transformedData
    })

  } catch (error) {
    console.error('Get workbench API error:', error)
    return NextResponse.json({
      error: 'Internal server error',
      details: error.message
    }, { status: 500 })
  }
}
