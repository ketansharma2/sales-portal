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

    const today = new Date().toISOString().split('T')[0]

    const { data: workbenchData, error } = await supabaseServer
      .from('domestic_workbench')
      .select('req_id, slot')
      .eq('date', today)
      .eq('sent_to_rc', user.id)

    if (error) {
      console.error('Fetch workbench error:', error)
      return NextResponse.json({
        error: 'Failed to fetch workbench data',
        details: error.message
      }, { status: 500 })
    }

    const reqIds = [...new Set(workbenchData?.map(item => item.req_id).filter(Boolean))] || []

    let reqsData = []
    if (reqIds.length > 0) {
      const { data: requirements } = await supabaseServer
        .from('domestic_crm_reqs')
        .select('req_id, job_title, branch_id')
        .in('req_id', reqIds)
      
      reqsData = requirements || []
    }

    let reqToCompanyMap = new Map()
    if (reqsData.length > 0) {
      const branchIds = [...new Set(reqsData.map(r => r.branch_id).filter(Boolean))]
      if (branchIds.length > 0) {
        const { data: branches } = await supabaseServer
          .from('domestic_crm_branch')
          .select('branch_id, client_id')
          .in('branch_id', branchIds)
        
        if (branches) {
          const branchMap = new Map(branches.map(b => [b.branch_id, b.client_id]))
          const clientIds = [...new Set(branches.map(b => b.client_id).filter(Boolean))]
          
          if (clientIds.length > 0) {
            const { data: clients } = await supabaseServer
              .from('domestic_crm_clients')
              .select('client_id, company_name')
              .in('client_id', clientIds)
            
            if (clients) {
              const clientMap = new Map(clients.map(c => [c.client_id, c.company_name]))
              reqsData.forEach(r => {
                const clientId = branchMap.get(r.branch_id)
                if (clientId) {
                  reqToCompanyMap.set(r.req_id, clientMap.get(clientId) || null)
                }
              })
            }
          }
        }
      }
    }

    const reqsMap = new Map(reqsData.map(r => [r.req_id, r]))

    const transformedData = workbenchData?.map(item => {
      const req = reqsMap.get(item.req_id)
      return {
        req_id: item.req_id,
        job_title: req?.job_title || '',
        slot: item.slot || '',
        company_name: reqToCompanyMap.get(item.req_id) || null
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