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
    const sectorFilter = searchParams.get('sector') // 'Corporate', 'Domestic', or null for all
    const crmFilter = searchParams.get('crm') // user_id of CRM
    const searchQuery = searchParams.get('search') // search in company name
    const fromDate = searchParams.get('fromDate')
    const toDate = searchParams.get('toDate')

    let corporateClients = []
    let domesticClients = []

    // Query corporate clients
    if (!sectorFilter || sectorFilter === 'All' || sectorFilter === 'Corporate') {
      let corporateQuery = supabaseServer
        .from('corporate_crm_clients')
        .select(`
          client_id,
          company_name,
          onboarding_date,
          category,
          location,
          state,
          contact_person,
          email,
          phone,
          status,
          created_at,
          user_id
        `)
        .order('created_at', { ascending: false })

      if (crmFilter && crmFilter !== 'All') {
        corporateQuery = corporateQuery.eq('user_id', crmFilter)
      }

      if (fromDate && toDate) {
        corporateQuery = corporateQuery.gte('onboarding_date', fromDate).lte('onboarding_date', toDate)
      } else if (fromDate) {
        corporateQuery = corporateQuery.eq('onboarding_date', fromDate)
      }

      if (fromDate && toDate) {
        corporateQuery = corporateQuery.gte('onboarding_date', fromDate).lte('onboarding_date', toDate)
      } else if (fromDate) {
        corporateQuery = corporateQuery.eq('onboarding_date', fromDate)
      }

      const { data: corpData, error: corpError } = await corporateQuery
      if (corpError) throw corpError
      corporateClients = corpData || []
    }

    // Query domestic clients
    if (!sectorFilter || sectorFilter === 'All' || sectorFilter === 'Domestic') {
      let domesticQuery = supabaseServer
        .from('domestic_crm_clients')
        .select(`
          client_id,
          company_name,
          onboarding_date,
          category,
          location,
          state,
          contact_person,
          email,
          phone,
          status,
          created_at,
          user_id
        `)
        .order('created_at', { ascending: false })

      if (crmFilter && crmFilter !== 'All') {
        domesticQuery = domesticQuery.eq('user_id', crmFilter)
      }

      if (fromDate && toDate) {
        domesticQuery = domesticQuery.gte('onboarding_date', fromDate).lte('onboarding_date', toDate)
      } else if (fromDate) {
        domesticQuery = domesticQuery.eq('onboarding_date', fromDate)
      }

      if (fromDate && toDate) {
        domesticQuery = domesticQuery.gte('onboarding_date', fromDate).lte('onboarding_date', toDate)
      } else if (fromDate) {
        domesticQuery = domesticQuery.eq('onboarding_date', fromDate)
      }

      const { data: domData, error: domError } = await domesticQuery
      if (domError) throw domError
      domesticClients = domData || []
    }

    // Add sector and combine
    const allClients = [
      ...corporateClients.map(c => ({ ...c, sector: 'Corporate' })),
      ...domesticClients.map(c => ({ ...c, sector: 'Domestic' }))
    ]

    // Filter by search query
    let filteredClients = allClients
    if (searchQuery) {
      filteredClients = allClients.filter(c =>
        c.company_name.toLowerCase().includes(searchQuery.toLowerCase())
      )
    }

    // Get additional data for each client: branches, contacts, requirements
    const clientIds = filteredClients.map(c => c.client_id)
    const corporateIds = corporateClients.map(c => c.client_id)
    const domesticIds = domesticClients.map(c => c.client_id)

    const [corporateBranches, domesticBranches] = await Promise.all([
      corporateIds.length > 0 ? supabaseServer.from('corporate_crm_branch').select('client_id , branch_id').in('client_id', corporateIds) : Promise.resolve({ data: [] }),
      domesticIds.length > 0 ? supabaseServer.from('domestic_crm_branch').select('client_id , branch_id').in('client_id', domesticIds) : Promise.resolve({ data: [] })
    ])
      console.log('Fetched branches:', { corporateBranches: corporateBranches.data, domesticBranches: domesticBranches.data }) ;
    const [corporateContacts, domesticContacts] = await Promise.all([
      corporateIds.length > 0 ? supabaseServer.from('corporate_crm_contacts').select('branch_id').in('branch_id', (corporateBranches.data || []).map(b => b.branch_id)) : Promise.resolve({ data: [] }),
      domesticIds.length > 0 ? supabaseServer.from('domestic_crm_contacts').select('branch_id').in('branch_id', (domesticBranches.data || []).map(b => b.branch_id)) : Promise.resolve({ data: [] })
    ])

    const [corporateReqs, domesticReqs] = await Promise.all([
      corporateIds.length > 0 ? supabaseServer.from('corporate_crm_reqs').select('req_id, branch_id').in('branch_id', (corporateBranches.data || []).map(b => b.branch_id)) : Promise.resolve({ data: [] }),
      domesticIds.length > 0 ? supabaseServer.from('domestic_crm_reqs').select('req_id, branch_id').in('branch_id', (domesticBranches.data || []).map(b => b.branch_id)) : Promise.resolve({ data: [] })
    ])

    // Count per client
    const branchesCount = new Map()
    const contactsCount = new Map()
    const reqsCount = new Map()

    ;[...corporateBranches.data, ...domesticBranches.data].forEach(b => {
      branchesCount.set(b.client_id, (branchesCount.get(b.client_id) || 0) + 1)
    })

    ;[...(corporateContacts.data || []), ...(domesticContacts.data || [])].forEach(c => {
      // Need to map branch_id to client_id
      const branch = [...(corporateBranches.data || []), ...(domesticBranches.data || [])].find(b => b.branch_id === c.branch_id)
      if (branch) {
        contactsCount.set(branch.client_id, (contactsCount.get(branch.client_id) || 0) + 1)
      }
    })

    ;[...(corporateReqs.data || []), ...(domesticReqs.data || [])].forEach(r => {
      const branch = [...(corporateBranches.data || []), ...(domesticBranches.data || [])].find(b => b.branch_id === r.branch_id)
      if (branch) {
        reqsCount.set(branch.client_id, (reqsCount.get(branch.client_id) || 0) + 1)
      }
    })

    // Get CRM names
    const crmIds = [...new Set(filteredClients.map(c => c.user_id).filter(Boolean))]
    const { data: crmUsers } = await supabaseServer
      .from('users')
      .select('user_id, name')
      .in('user_id', crmIds)

    const crmMap = new Map(crmUsers.map(u => [u.user_id, u.name]))

    // Transform data
    const transformedClients = filteredClients.map(client => ({
      id: client.client_id,
      date: client.onboarding_date,
      company: client.company_name,
      sector: client.sector,
      crmName: crmMap.get(client.user_id) || '',
      contactPerson: client.contact_person,
      phone: client.phone,
      email: client.email,
      branches: branchesCount.get(client.client_id) || 0,
      contacts: contactsCount.get(client.client_id) || 0,
      requirements: reqsCount.get(client.client_id) || 0,
      // Add more fields as needed
    }))

    return NextResponse.json({
      success: true,
      data: transformedClients
    })

  } catch (error) {
    console.error('Fetch CRM clients API error:', error)
    return NextResponse.json({
      error: 'Internal server error',
      details: error.message
    }, { status: 500 })
  }
}