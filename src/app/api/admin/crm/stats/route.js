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

    const { searchParams } = new URL(request.url)
    const sector = searchParams.get('sector') || 'All' // 'Corporate', 'Domestic', or 'All'
    const fromDate = searchParams.get('fromDate')
    const toDate = searchParams.get('toDate')

    let corporateMultiplier = sector === 'Corporate' || sector === 'All' ? 1 : 0
    let domesticMultiplier = sector === 'Domestic' || sector === 'All' ? 1 : 0

    // Get counts for stats
    const [corporateClients, domesticClients] = await Promise.all([
      corporateMultiplier ? supabaseServer.from('corporate_crm_clients')
        .select('client_id', { count: 'exact', head: true })
        .gte(fromDate ? 'onboarding_date' : 'created_at', fromDate || '1900-01-01')
        .lte(fromDate ? 'onboarding_date' : 'created_at', toDate || '2100-12-31') : Promise.resolve({ count: 0 }),
      domesticMultiplier ? supabaseServer.from('domestic_crm_clients')
        .select('client_id', { count: 'exact', head: true })
        .gte(fromDate ? 'onboarding_date' : 'created_at', fromDate || '1900-01-01')
        .lte(fromDate ? 'onboarding_date' : 'created_at', toDate || '2100-12-31') : Promise.resolve({ count: 0 })
    ])

    const [corporateBranches, domesticBranches] = await Promise.all([
      corporateMultiplier ? supabaseServer.from('corporate_crm_branch')
        .select('branch_id', { count: 'exact', head: true })
        .gte('created_at', fromDate || '1900-01-01')
        .lte('created_at', toDate || '2100-12-31') : Promise.resolve({ count: 0 }),
      domesticMultiplier ? supabaseServer.from('domestic_crm_branch')
        .select('branch_id', { count: 'exact', head: true })
        .gte('created_at', fromDate || '1900-01-01')
        .lte('created_at', toDate || '2100-12-31') : Promise.resolve({ count: 0 })
    ])

    const [corporateContacts, domesticContacts] = await Promise.all([
      corporateMultiplier ? supabaseServer.from('corporate_crm_contacts')
        .select('contact_id', { count: 'exact', head: true })
        .gte('created_at', fromDate || '1900-01-01')
        .lte('created_at', toDate || '2100-12-31') : Promise.resolve({ count: 0 }),
      domesticMultiplier ? supabaseServer.from('domestic_crm_contacts')
        .select('contact_id', { count: 'exact', head: true })
        .gte('created_at', fromDate || '1900-01-01')
        .lte('created_at', toDate || '2100-12-31') : Promise.resolve({ count: 0 })
    ])

    const [corporateConversations, domesticConversations] = await Promise.all([
      corporateMultiplier ? supabaseServer.from('corporate_crm_conversation')
        .select('conversation_id', { count: 'exact', head: true })
        .gte('date', fromDate || '1900-01-01')
        .lte('date', toDate || '2100-12-31') : Promise.resolve({ count: 0 }),
      domesticMultiplier ? supabaseServer.from('domestic_crm_conversation')
        .select('conversation_id', { count: 'exact', head: true })
        .gte('date', fromDate || '1900-01-01')
        .lte('date', toDate || '2100-12-31') : Promise.resolve({ count: 0 })
    ])

    const [corporateReqs, domesticReqs] = await Promise.all([
  corporateMultiplier
    ? supabaseServer
        .from('corporate_crm_reqs')
        .select('openings')
        .gte('date', fromDate || '1900-01-01')
        .lte('date', toDate || '2100-12-31')
    : Promise.resolve({ data: [] }),

  domesticMultiplier
    ? supabaseServer
        .from('domestic_crm_reqs')
        .select('openings')
        .gte('date', fromDate || '1900-01-01')
        .lte('date', toDate || '2100-12-31')
    : Promise.resolve({ data: [] })
])

const corporateOpening =
  corporateReqs.data?.reduce(
    (sum, item) => sum + (Number(item.openings) || 0),
    0
  ) || 0

const domesticOpening =
  domesticReqs.data?.reduce(
    (sum, item) => sum + (Number(item.openings) || 0),
    0
  ) || 0

    const [corporateWorkbench, domesticWorkbench] = await Promise.all([
      corporateMultiplier ? supabaseServer.from('corporate_workbench')
        .select('workbench_id', { count: 'exact', head: true })
        .gte('date', fromDate || '1900-01-01')
        .lte('date', toDate || '2100-12-31') : Promise.resolve({ count: 0 }),
      domesticMultiplier ? supabaseServer.from('domestic_workbench')
        .select('workbench_id', { count: 'exact', head: true })
        .gte('date', fromDate || '1900-01-01')
        .lte('date', toDate || '2100-12-31') : Promise.resolve({ count: 0 })
    ])

    // For tracker shared, count emails shared
    const [corporateEmails, domesticEmails] = await Promise.all([
      corporateMultiplier ? supabaseServer.from('corporate_crm_emails')
        .select('id', { count: 'exact', head: true })
        .gte('shared_date', fromDate || '1900-01-01')
        .lte('shared_date', toDate || '2100-12-31')
        .not('shared_date', 'is', null) : Promise.resolve({ count: 0 }),
      domesticMultiplier ? supabaseServer.from('domestic_crm_emails')
        .select('id', { count: 'exact', head: true })
        .gte('shared_date', fromDate || '1900-01-01')
        .lte('shared_date', toDate || '2100-12-31')
        .not('shared_date', 'is', null) : Promise.resolve({ count: 0 })
    ])

    // For unique profiles, count distinct names from emails
    let uniqueProfiles = 0
    if (corporateMultiplier || domesticMultiplier) {
      const queries = []
      if (corporateMultiplier) {
        queries.push(supabaseServer.from('corporate_crm_reqs')
          .select('req_id')
          .not('req_id', 'is', null)
          .gte('created_at', fromDate || '1900-01-01')
          .lte('created_at', toDate || '2100-12-31'))
      }
      if (domesticMultiplier) {
        queries.push(supabaseServer.from('domestic_crm_reqs')
          .select('req_id')
          .not('req_id', 'is', null)
          .gte('created_at', fromDate || '1900-01-01')
          .lte('created_at', toDate || '2100-12-31'))
      }

      const results = await Promise.all(queries)
      const allNames = results.flatMap(result => result.data?.map(e => e.req_id) || [])
      uniqueProfiles =  new Set(allNames).size
    }

    const [corporateCountClients, domesticCountClients] = await Promise.all([
  corporateMultiplier ? supabaseServer.from('corporate_crm_clients')
    .select('client_id', { count: 'exact', head: true })
    .eq('client_status', 'Active')  // ← Only this line added
    .gte(fromDate ? 'onboarding_date' : 'created_at', fromDate || '1900-01-01')
    .lte(fromDate ? 'onboarding_date' : 'created_at', toDate || '2100-12-31') : Promise.resolve({ count: 0 }),
    
  domesticMultiplier ? supabaseServer.from('domestic_crm_clients')
    .select('client_id', { count: 'exact', head: true })
    .eq('client_status', 'Active')  // ← Only this line added
    .gte(fromDate ? 'onboarding_date' : 'created_at', fromDate || '1900-01-01')
    .lte(fromDate ? 'onboarding_date' : 'created_at', toDate || '2100-12-31') : Promise.resolve({ count: 0 })
])

    const stats = {
      onboards: (corporateClients.count || 0) + (domesticClients.count || 0),
      branches: (corporateBranches.count || 0) + (domesticBranches.count || 0),
      contacts: (corporateContacts.count || 0) + (domesticContacts.count || 0),
      conversations: (corporateConversations.count || 0) + (domesticConversations.count || 0),
      totalActiveClients: (corporateCountClients.count || 0) + (domesticCountClients.count || 0), 
      uniqueProfiles: uniqueProfiles,
      requirements: corporateOpening + domesticOpening,
      workbenchAllot: (corporateWorkbench.count || 0) + (domesticWorkbench.count || 0),
      trackerShared: (corporateEmails.count || 0) + (domesticEmails.count || 0)
    }

    return NextResponse.json({
      success: true,
      data: stats
    })

  } catch (error) {
    console.error('Fetch CRM stats API error:', error)
    return NextResponse.json({
      error: 'Internal server error',
      details: error.message
    }, { status: 500 })
  }
}