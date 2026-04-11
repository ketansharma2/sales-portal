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

    // Get query parameters
    const { searchParams } = new URL(request.url)
    const from_date = searchParams.get('from_date')
    const to_date = searchParams.get('to_date')

    if (!from_date || !to_date) {
      return NextResponse.json({ 
        error: 'from_date and to_date are required' 
      }, { status: 400 })
    }

    // Build query for workbench data with date range filter
    let query = supabaseServer
      .from('corporate_workbench')
      .select('*')
      .gte('date', from_date)
      .lte('date', to_date)
      .order('date', { ascending: false })
      .order('created_at', { ascending: false })

    const { data: workbenchData, error: fetchError } = await query

    if (fetchError) {
      console.error('Fetch workbench error:', fetchError)
      return NextResponse.json({
        error: 'Failed to fetch workbench data',
        details: fetchError.message
      }, { status: 500 })
    }

    if (!workbenchData || workbenchData.length === 0) {
      return NextResponse.json({
        success: true,
        data: []
      })
    }

    // Get unique IDs for joining
    const clientIds = [...new Set(workbenchData.map(item => item.client_id).filter(Boolean))]
    const reqIds = [...new Set(workbenchData.map(item => item.req_id).filter(Boolean))]
    const tlIds = [...new Set(workbenchData.map(item => item.sent_to_tl).filter(Boolean))]
    const rcIds = [...new Set(workbenchData.map(item => item.sent_to_rc).filter(Boolean))]
    const userIds = [...new Set(workbenchData.map(item => item.user_id).filter(Boolean))]
    const workbenchIds = workbenchData.map(item => item.workbench_id)

    // Fetch advance_sti counts from corporate_workbench_sti
    let stiQuery = supabaseServer
      .from('corporate_workbench_sti')
      .select('workbench_id, advance_sti')
    
    if (workbenchIds.length > 0) {
      stiQuery = stiQuery.in('workbench_id', workbenchIds)
    }
    
    const { data: stiData } = await stiQuery
    
    // Sum advance_sti by workbench_id
    const stiSumMap = new Map()
    ;(stiData || []).forEach(item => {
      const current = stiSumMap.get(item.workbench_id) || 0
      stiSumMap.set(item.workbench_id, current + (item.advance_sti || 0))
    })

    // Fetch conversion counts from candidates_conversation
    const conversionPromises = workbenchData.map(async (item) => {
      if (!item.req_id || !item.sent_to_rc || !item.date) {
        return { workbench_id: item.workbench_id, conversion: 0 }
      }
      
      const { count } = await supabaseServer
        .from('candidates_conversation')
        .select('*', { count: 'exact', head: true })
        .eq('req_id', item.req_id)
        .eq('user_id', item.sent_to_rc)
        .eq('calling_date', item.date)
        .eq('candidate_status', 'Conversion')
      
      return { workbench_id: item.workbench_id, conversion: count || 0 }
    })

    const conversionResults = await Promise.all(conversionPromises)
    const conversionMap = new Map(conversionResults.map(r => [r.workbench_id, r.conversion]))

    // Fetch asset counts from candidates_conversation
    const assetPromises = workbenchData.map(async (item) => {
      if (!item.req_id || !item.sent_to_rc || !item.date) {
        return { workbench_id: item.workbench_id, asset: 0 }
      }
      
      const { count } = await supabaseServer
        .from('candidates_conversation')
        .select('*', { count: 'exact', head: true })
        .eq('req_id', item.req_id)
        .eq('user_id', item.sent_to_rc)
        .eq('calling_date', item.date)
        .eq('candidate_status', 'Asset')
      
      return { workbench_id: item.workbench_id, asset: count || 0 }
    })

    const assetResults = await Promise.all(assetPromises)
    const assetMap = new Map(assetResults.map(r => [r.workbench_id, r.asset]))

    // Fetch CV sourced counts from candidates_conversation
    const cvPromises = workbenchData.map(async (item) => {
      if (!item.req_id || !item.date) {
        return { workbench_id: item.workbench_id, cv_sourced: 0 }
      }
      
      const { count } = await supabaseServer
        .from('candidates_conversation')
        .select('*', { count: 'exact', head: true })
        .eq('req_id', item.req_id)
        .eq('portal_date', item.date)
      
      return { workbench_id: item.workbench_id, cv_sourced: count || 0 }
    })

    const cvResults = await Promise.all(cvPromises)
    const cvMap = new Map(cvResults.map(r => [r.workbench_id, r.cv_sourced]))

    // Fetch tracker_sent_by_rc counts from candidates_conversation
    const trackerSentPromises = workbenchData.map(async (item) => {
      if (!item.req_id || !item.date) {
        return { workbench_id: item.workbench_id, tracker_sent_by_rc: 0 }
      }
      
      const { count } = await supabaseServer
        .from('candidates_conversation')
        .select('*', { count: 'exact', head: true })
        .eq('req_id', item.req_id)
        .gte('calling_date', item.date)
        .lte('calling_date', item.date)
        .not('sent_to_tl', 'is', null)
        .gte('sent_date', item.date)
        .lte('sent_date', item.date)
      
      return { workbench_id: item.workbench_id, tracker_sent_by_rc: count || 0 }
    })

    const trackerSentResults = await Promise.all(trackerSentPromises)
    const trackerSentMap = new Map(trackerSentResults.map(r => [r.workbench_id, r.tracker_sent_by_rc]))

    // Fetch tracker_sent_by_tl counts from candidates_conversation
    const trackerSentToTlPromises = workbenchData.map(async (item) => {
      if (!item.req_id || !item.date) {
        return { workbench_id: item.workbench_id, tracker_sent_by_tl: 0 }
      }
      
      const { count } = await supabaseServer
        .from('candidates_conversation')
        .select('*', { count: 'exact', head: true })
        .eq('req_id', item.req_id)
        .not('sent_to_crm', 'is', null)
        .gte('crm_sent_date', from_date)
        .lte('crm_sent_date', to_date)
      
      return { workbench_id: item.workbench_id, tracker_sent_by_tl: count || 0 }
    })

    const trackerSentToTlResults = await Promise.all(trackerSentToTlPromises)
    const trackerSentToTlMap = new Map(trackerSentToTlResults.map(r => [r.workbench_id, r.tracker_sent_by_tl]))

    // Fetch tracker_shared_to_client counts
    const trackerSharedPromises = workbenchData.map(async (item) => {
      if (!item.req_id || !item.date) {
        return { workbench_id: item.workbench_id, tracker_shared_to_client: 0 }
      }
      
      const { data: conversationData } = await supabaseServer
        .from('candidates_conversation')
        .select('conversation_id')
        .eq('req_id', item.req_id)
        .not('sent_to_crm', 'is', null)
        .gte('crm_sent_date', from_date)
        .lte('crm_sent_date', to_date)
      
      if (!conversationData || conversationData.length === 0) {
        return { workbench_id: item.workbench_id, tracker_shared_to_client: 0 }
      }
      
      const conversationIds = conversationData.map(c => c.conversation_id)
      
      const { count } = await supabaseServer
        .from('corporate_crm_emails')
        .select('*', { count: 'exact', head: true })
        .in('conversation_id', conversationIds)
        .gte('shared_date', from_date)
        .lte('shared_date', to_date)
      
      return { workbench_id: item.workbench_id, tracker_shared_to_client: count || 0 }
    })

    const trackerSharedResults = await Promise.all(trackerSharedPromises)
    const trackerSharedMap = new Map(trackerSharedResults.map(r => [r.workbench_id, r.tracker_shared_to_client]))

    // Fetch clients
    const { data: clientsData } = await supabaseServer
      .from('corporate_crm_clients')
      .select('client_id, company_name')
      .in('client_id', clientIds)

    // Fetch requirements (profiles)
    const { data: reqsData } = await supabaseServer
      .from('corporate_crm_reqs')
      .select('req_id, job_title, package')
      .in('req_id', reqIds)

    // Fetch TL users
    const { data: tlUsersData } = await supabaseServer
      .from('users')
      .select('user_id, name')
      .in('user_id', tlIds)

    // Fetch RC users
    const { data: rcUsersData } = await supabaseServer
      .from('users')
      .select('user_id, name')
      .in('user_id', rcIds)

    // Fetch CRM users
    const { data: crmUsersData } = await supabaseServer
      .from('users')
      .select('user_id, name')
      .in('user_id', userIds)

    // Create lookup maps
    const clientMap = new Map((clientsData || []).map(c => [c.client_id, c.company_name]))
    const reqMap = new Map((reqsData || []).map(r => [r.req_id, { job_title: r.job_title, package: r.package }]))
    const tlMap = new Map((tlUsersData || []).map(u => [u.user_id, u.name]))
    const rcMap = new Map((rcUsersData || []).map(u => [u.user_id, u.name]))
    const crmMap = new Map((crmUsersData || []).map(u => [u.user_id, u.name]))

    // Build the final response with joined data
    const formattedData = workbenchData.map(item => {
      const reqInfo = reqMap.get(item.req_id) || {}
      return {
        workbench_id: item.workbench_id,
        date: item.date,
        slot: item.slot || '',
        user_id: item.user_id,
        Crm_name: crmMap.get(item.user_id) || '',
        sent_to_tl: item.sent_to_tl,
        TL_name: tlMap.get(item.sent_to_tl) || '',
        sent_to_rc: item.sent_to_rc,
        RC_name: rcMap.get(item.sent_to_rc) || '',
        client_id: item.client_id,
        company_name: clientMap.get(item.client_id) || '',
        req_id: item.req_id,
        job_title: reqInfo.job_title || '',
        package: item.package || reqInfo.package || '',
        requirement: item.req || '',
        advance_sti: stiSumMap.get(item.workbench_id) || 0,
        cv_sourced: cvMap.get(item.workbench_id) || 0,
        tracker_sent_by_rc: trackerSentMap.get(item.workbench_id) || 0,
        tracker_sent_by_tl: trackerSentToTlMap.get(item.workbench_id) || 0,
        tracker_shared_to_client: trackerSharedMap.get(item.workbench_id) || 0,
        conversion: conversionMap.get(item.workbench_id) || 0,
        asset: assetMap.get(item.workbench_id) || 0,
        rc_remarks: item.rc_remarks || '',
        tl_remarks: item.tl_remarks || ''
      }
    })

    return NextResponse.json({
      success: true,
      data: formattedData
    })

  } catch (error) {
    console.error('Workbench API error:', error)
    return NextResponse.json({
      error: 'Internal server error',
      details: error.message
    }, { status: 500 })
  }
}
