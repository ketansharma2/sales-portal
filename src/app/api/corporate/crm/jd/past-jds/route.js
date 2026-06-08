import { supabaseServer } from '@/lib/supabase-server'
import { NextResponse } from 'next/server'
import { getUser } from '@/lib/auth-helper'

export async function GET(request) {
  try {
    // Authentication - user injected by middleware (no auth calls needed!)
    const { user, error: authError } = getUser(request);
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = user.id || user.user_id

    let pastJDs = []

    // Fetch from corporate_crm_jd table - filter by created_by = userId
    const { data: jdData, error: jdError } = await supabaseServer
      .from('corporate_crm_jd')
      .select('jd_id, client_name, job_title, location, experience, employment_type, working_days, timings, package, tool_requirement, job_summary, rnr, req_skills, preferred_qual, company_offers, contact_details')
      .eq('created_by', userId)
      .order('created_date', { ascending: false })

    if (!jdError && jdData) {
      const formattedJDs = jdData.map(jd => ({
        id: jd.jd_id,
        source: 'jd',
        client_name: jd.client_name,
        job_title: jd.job_title,
        location: jd.location,
        experience: jd.experience,
        employment_type: jd.employment_type,
        working_days: jd.working_days,
        timings: jd.timings,
        package: jd.package,
        tool_requirement: jd.tool_requirement,
        job_summary: jd.job_summary,
        rnr: jd.rnr,
        req_skills: jd.req_skills,
        preferred_qual: jd.preferred_qual,
        company_offers: jd.company_offers,
        contact_details: jd.contact_details
      }))
      pastJDs = [...pastJDs, ...formattedJDs]
    }

    // Fetch from corporate_crm_reqs with client name via branch join - filter by user_id
    const { data: reqsData, error: reqsError } = await supabaseServer
      .from('corporate_crm_reqs')
      .select(`
        req_id,
        job_title,
        experience,
        package,
        location,
        employment_type,
        working_days,
        timings,
        tool_req,
        job_summary,
        rnr,
        req_skills,
        preferred_qual,
        company_offers,
        contact_details,
        branch_id
      `)
      .eq('user_id', userId)
      .order('date', { ascending: false })

    if (!reqsError && reqsData && reqsData.length > 0) {
      // Get branch IDs to join with clients
      const uniqueBranchIds = reqsData.map(r => r.branch_id).filter(Boolean)
      const branchIds = [...new Set(uniqueBranchIds)]
      
      if (branchIds.length === 0) {
        return NextResponse.json({ success: true, data: pastJDs })
      }
      
      let branchClientMap = {}
      if (branchIds.length > 0) {
        const { data: branchesData } = await supabaseServer
          .from('corporate_crm_branch')
          .select('branch_id, client_id')
          .in('branch_id', branchIds)
        
        if (branchesData) {
          branchesData.forEach(b => {
            branchClientMap[b.branch_id] = b.client_id
          })
        }
      }

      // Get client names
      const clientIds = [...new Set(Object.values(branchClientMap))]
      let clientNameMap = {}
      if (clientIds.length > 0) {
        const { data: clientsData } = await supabaseServer
          .from('corporate_crm_clients')
          .select('client_id, company_name')
          .in('client_id', clientIds)
        
        if (clientsData) {
          clientsData.forEach(c => {
            clientNameMap[c.client_id] = c.company_name
          })
        }
      }

      // Format reqs data
      const formattedReqs = reqsData.map(req => ({
        id: req.req_id,
        source: 'req',
        client_name: branchClientMap[req.branch_id] ? clientNameMap[branchClientMap[req.branch_id]] || 'Unknown' : 'Unknown',
        job_title: req.job_title,
        location: req.location,
        experience: req.experience,
        employment_type: req.employment_type,
        working_days: req.working_days,
        timings: req.timings,
        package: req.package,
        tool_requirement: req.tool_req,
        job_summary: req.job_summary,
        rnr: req.rnr,
        req_skills: req.req_skills,
        preferred_qual: req.preferred_qual,
        company_offers: req.company_offers,
        contact_details: req.contact_details
      }))
      pastJDs = [...pastJDs, ...formattedReqs]
    }

    // Sort by job_title
    pastJDs.sort((a, b) => (a.job_title || '').localeCompare(b.job_title || ''))

    return NextResponse.json({ success: true, data: pastJDs })

  } catch (error) {
    console.error('Error fetching past JDs:', error)
    return NextResponse.json({ error: 'Internal server error', details: error.message }, { status: 500 })
  }
}