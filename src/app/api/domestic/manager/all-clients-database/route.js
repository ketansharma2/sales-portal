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

    // Check if user has MANAGER role
    const { data: userProfile, error: profileError } = await supabaseServer
      .from('users')
      .select('role')
      .eq('user_id', user.id)
      .single()

    if (profileError || !userProfile) {
      return NextResponse.json({ error: 'User profile not found' }, { status: 404 })
    }

    if (!userProfile.role || !userProfile.role.includes('MANAGER')) {
      return NextResponse.json({ error: 'Access denied. Manager role required.' }, { status: 403 })
    }

    // Get query parameters for filtering
    const { searchParams } = new URL(request.url)
    const fseId = searchParams.get('fse_id') // Filter by specific FSE
    const company = searchParams.get('company')
    const category = searchParams.get('category')
    const location = searchParams.get('location')
    const status = searchParams.get('status')
    const sub_status = searchParams.get('sub_status')
    const projection = searchParams.get('projection')
    const client_type = searchParams.get('client_type')
    const fromDate = searchParams.get('fromDate')
    const toDate = searchParams.get('toDate')
    // Default limit is 100, set to null to fetch all
    const limitParam = searchParams.get('limit')
    const limit = limitParam === 'all' ? null : (limitParam ? parseInt(limitParam) : 100)

    // Step 1: Fetch all FSE user_ids under this manager
    let fseQuery = supabaseServer
      .from('users')
      .select('user_id, name')
      .contains('role', ['FSE'])
      .eq('manager_id', user.id)

    const { data: fseList, error: fseError } = await fseQuery

    if (fseError) {
      console.error('FSE list fetch error:', fseError)
      return NextResponse.json({
        error: 'Failed to fetch FSE team',
        details: fseError.message
      }, { status: 500 })
    }

    // If filtering by specific FSE, use only that FSE's user_id
    const fseUserIds = fseId 
      ? fseList.filter(fse => fse.user_id === fseId).map(fse => fse.user_id)
      : fseList.map(fse => fse.user_id)

    if (fseUserIds.length === 0) {
      return NextResponse.json({
        success: true,
        data: [],
        message: 'No FSEs found under this manager',
        total_count: 0
      })
    }

    // Create a map of FSE names for easy lookup
    const fseNameMap = {}
    fseList.forEach(fse => {
      fseNameMap[fse.user_id] = fse.name
    })

    // Step 2: Fetch ALL clients for these FSEs (without limit to get total count)
    let allClients = []
    let offset = 0
    const batchSize = 500

    while (true) {
      let batchQuery = supabaseServer
        .from('domestic_clients')
        .select('*')
        .in('user_id', fseUserIds)

      if (company) {
        batchQuery = batchQuery.ilike('company_name', `%${company}%`)
      }
      if (category) {
        batchQuery = batchQuery.eq('category', category)
      }
      if (location) {
        batchQuery = batchQuery.or(`location.ilike.%${location}%,state.ilike.%${location}%`)
      }
      if (client_type) {
        batchQuery = batchQuery.eq('client_type', client_type)
      }

      batchQuery = batchQuery.order('sourcing_date', { ascending: false }).order('client_id', { ascending: false })
      batchQuery = batchQuery.range(offset, offset + batchSize - 1)

      const { data: batch, error: batchError } = await batchQuery

      if (batchError || !batch || batch.length === 0) break

      allClients.push(...batch)
      offset += batchSize

      if (batch.length < batchSize) break
    }

    // Store total count BEFORE any filtering
    const totalCountBeforeFiltering = allClients.length

    // Apply limit for fetching interactions (only if not fetching all)
    const clientsToProcess = limit ? allClients.slice(0, limit) : allClients

    // Step 3: Fetch interactions for these clients (with proper batching)
    const clientIds = clientsToProcess?.map(c => c.client_id) || []
    let interactions = []

    if (clientIds.length > 0) {
      // Fetch interactions in batches of 100 client IDs
      const clientIdBatchSize = 100
      for (let i = 0; i < clientIds.length; i += clientIdBatchSize) {
        const batchClientIds = clientIds.slice(i, i + clientIdBatchSize)
        
        let intOffset = 0
        const intBatchSize = 250

        while (true) {
          const { data: ints, error: intError } = await supabaseServer
            .from('domestic_clients_interaction')
            .select('*')
            .in('client_id', batchClientIds)
            .order('client_id', { ascending: true })
            .order('contact_date', { ascending: false })
            .order('created_at', { ascending: false })
            .range(intOffset, intOffset + intBatchSize - 1)

          if (intError) {
            console.error('Interactions error:', intError)
            break
          }

          if (!ints || ints.length === 0) break

          // Filter to only interactions from FSEs under this manager
          const filteredInts = ints.filter(int => fseUserIds.includes(int.user_id))
          interactions.push(...filteredInts)
          intOffset += intBatchSize

          if (ints.length < intBatchSize) break
        }
      }
    }

    // Step 4: Process and join data
    const clientMap = new Map()
    clientsToProcess?.forEach(client => {
      clientMap.set(client.client_id, {
        ...client,
        fse_name: fseNameMap[client.user_id] || 'Unknown FSE',
        interactions: []
      })
    })

    interactions.forEach(int => {
      if (clientMap.has(int.client_id)) {
        clientMap.get(int.client_id).interactions.push(int)
      }
    })

    // Build final response with latest interaction fields
    let clientsWithLatest = Array.from(clientMap.values()).map(client => {
      const sortedInteractions = client.interactions.sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
      const latestInteraction = sortedInteractions[0] || null

      return {
        ...client,
        latest_contact_date: latestInteraction?.contact_date || null,
        latest_contact_mode: latestInteraction?.contact_mode || null,
        remarks: latestInteraction?.remarks || null,
        next_follow_up: latestInteraction?.next_follow_up || null,
        status: latestInteraction?.status || client.status || null,
        sub_status: latestInteraction?.sub_status || client.sub_status || null,
        projection: client.projection || null,
        contact_person: latestInteraction?.contact_person || client.contact_person || null,
        contact_no: latestInteraction?.contact_no || client.contact_no || null,
        email: latestInteraction?.email || client.email || null,
        interactions_count: client.interactions.length
      }
    })

    // Step 5: Apply remaining filters
    if (status) {
      clientsWithLatest = clientsWithLatest.filter(client => client.status === status)
    }
    if (sub_status) {
      clientsWithLatest = clientsWithLatest.filter(client => client.sub_status === sub_status)
    }
    if (projection) {
      clientsWithLatest = clientsWithLatest.filter(client => client.projection === projection)
    }
    if (fromDate && toDate) {
      clientsWithLatest = clientsWithLatest.filter(client => {
        if (!client.latest_contact_date) return false
        return client.latest_contact_date >= fromDate && client.latest_contact_date <= toDate
      })
    }

    return NextResponse.json({
      success: true,
      data: clientsWithLatest,
      fse_list: fseList,
      total_count: totalCountBeforeFiltering
    })

  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({
      error: 'Internal server error',
      details: error.message
    }, { status: 500 })
  }
}
