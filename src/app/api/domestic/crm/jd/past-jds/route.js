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

    const userId = user.id || user.user_id

    let pastJDs = []

    // Fetch from domestic_crm_jd table - filter by created_by = userId
    const { data: jdData, error: jdError } = await supabaseServer
      .from('domestic_crm_jd')
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

    // Fetch from domestic_crm_reqs with client name via branch join - filter by user_id
    console.log('Fetching from domestic_crm_reqs for userId:', userId)
    const { data: reqsData, error: reqsError } = await supabaseServer
      .from('domestic_crm_reqs')
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

    console.log('reqsData:', reqsData, 'reqsError:', reqsError)

if (!reqsError && reqsData && reqsData.length > 0) {
      const uniqueBranchIds = reqsData.map(r => r.branch_id).filter(Boolean)
      const branchIds = [...new Set(uniqueBranchIds)]
      
      let branchToClientMap = {}
      
      if (branchIds.length > 0) {
        // First get branch -> client_id from domestic_crm_branch
        for (const bid of branchIds) {
          const { data: branchData } = await supabaseServer
            .from('domestic_crm_branch')
            .select('branch_id, client_id')
            .eq('branch_id', bid)
            .single()
          
          if (branchData && branchData.client_id) {
            // Then get company_name from domestic_crm_clients
            const { data: clientData } = await supabaseServer
              .from('domestic_crm_clients')
              .select('client_id, company_name')
              .eq('client_id', branchData.client_id)
              .single()
            
            branchToClientMap[bid] = clientData?.company_name || bid.substring(0, 8)
          }
        }
      }
      
      console.log('Branch to client map:', branchToClientMap)
      
      const formattedReqs = reqsData.map(req => ({
        id: req.req_id,
        source: 'req',
        client_name: req.branch_id ? (branchToClientMap[req.branch_id] || 'Branch-' + req.branch_id.substring(0, 8)) : 'Unknown',
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
    } else {
      console.log('No requirements found or error:', reqsError)
    }

    pastJDs.sort((a, b) => (a.job_title || '').localeCompare(b.job_title || ''))

    return NextResponse.json({ success: true, data: pastJDs })

  } catch (error) {
    console.error('Error fetching past JDs:', error)
    return NextResponse.json({ error: 'Internal server error', details: error.message }, { status: 500 })
  }
}