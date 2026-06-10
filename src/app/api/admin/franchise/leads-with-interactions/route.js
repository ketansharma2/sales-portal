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

    // =====================================================
    // 🔍 PARAMS
    // =====================================================
    const { searchParams } = new URL(request.url)

    const from_date = searchParams.get('from_date')
    const to_date = searchParams.get('to_date')
    const status = searchParams.get('status')
    const franchise_status = searchParams.get('franchise_status')

    const page = parseInt(searchParams.get('page') || '1')
    const pageSize = parseInt(searchParams.get('pageSize') || '20')
    const offset = (page - 1) * pageSize

    // =====================================================
    // STEP 1: FETCH INTERACTIONS
    // =====================================================
    let interactionsQuery = supabaseServer
      .from('corporate_leads_interaction')
      .select(`
        id,
        client_id,
        leadgen_id,
        date,
        status,
        sub_status,
        remarks,
        next_follow_up,
        contact_person,
        contact_no,
        email,
        franchise_status,
        created_at
      `)
      .order('created_at', { ascending: false })
      .limit(300) // 🔥 reduced from 1000

    // ✅ DATE FILTER
    if (from_date && to_date && from_date !== 'null' && to_date !== 'null') {
      interactionsQuery = interactionsQuery
        .gte('created_at', `${from_date}T00:00:00`)
        .lte('created_at', `${to_date}T23:59:59`)
    }

    // ✅ STATUS FILTER
    if (status && status !== 'All') {
      interactionsQuery = interactionsQuery.ilike('status', `%${status}%`)
    }

      // ✅ FRANCHISE STATUS FILTER - EXCLUDE "NO FRANCHISE DISCUSS"
       interactionsQuery = interactionsQuery.neq(
         'franchise_status',
         'No Franchise Discuss'
       )

    const { data: interactionsData, error: interactionsError } =
      await interactionsQuery

    if (interactionsError) {
      console.error("INTERACTIONS ERROR:", JSON.stringify(interactionsError, null, 2))
      return NextResponse.json(
        { error: 'Failed to fetch interactions', details: interactionsError.message },
        { status: 500 }
      )
    }

    if (!interactionsData?.length) {
      return NextResponse.json({
        success: true,
        data: [],
        summary: { total: 0, by_status: {}, by_franchise_status: {}, by_leadgen: {}, by_leadgen_name: {} },
        pagination: { page, pageSize, total: 0, totalPages: 0 }
      })
    }

    // =====================================================
    // STEP 2: SAFE CLIENT IDS
    // =====================================================
    const clientIds = [
      ...new Set(
        interactionsData
          .map(i => i.client_id)
          .filter(id =>
            id &&
            typeof id === "string" &&
            id !== "undefined" &&
            id !== "null" &&
            id.trim() !== ""
          )
      )
    ]

    if (!clientIds.length) {
      return NextResponse.json({
        success: true,
        data: [],
        summary: { total: 0, by_status: {}, by_franchise_status: {}, by_leadgen: {}, by_leadgen_name: {} },
        pagination: { page, pageSize, total: 0, totalPages: 0 }
      })
    }

    // =====================================================
    // STEP 3: FETCH LEADS (CHUNKING FIX)
    // =====================================================
    const chunkSize = 100
    let leadsData = []

    for (let i = 0; i < clientIds.length; i += chunkSize) {
      const chunk = clientIds.slice(i, i + chunkSize)

      const { data, error } = await supabaseServer
        .from('corporate_leadgen_leads')
        .select(`
          client_id,
          company,
          category,
          state,
          location,
          emp_count,
          reference,
          leadgen_id,
          sent_to_sm,
          lock_date,
          created_at,
          sourcing_date,
          district_city,
          startup
        `)
        .in('client_id', chunk)

      if (error) {
        console.error("LEADS CHUNK ERROR:", JSON.stringify(error, null, 2))
        return NextResponse.json(
          { error: 'Failed to fetch leads', details: error.message },
          { status: 500 }
        )
      }

      leadsData.push(...(data || []))
    }

    // =====================================================
    // STEP 4: FETCH LEADGEN USERS
    // =====================================================
    const leadgenIds = [
      ...new Set(leadsData.map(l => l.leadgen_id).filter(Boolean))
    ]

    const { data: leadgenUsers, error: usersError } = await supabaseServer
      .from('users')
      .select('user_id, name')
      .in('user_id', leadgenIds)

    if (usersError) {
      console.error("USERS ERROR:", usersError)
      return NextResponse.json(
        { error: 'Failed to fetch users', details: usersError.message },
        { status: 500 }
      )
    }

    const leadgenNameMap = new Map()
    leadgenUsers?.forEach(u => {
      if (u.user_id && u.name) {
        leadgenNameMap.set(u.user_id, u.name)
      }
    })

    // =====================================================
    // STEP 5: MAP INTERACTIONS
    // =====================================================
    const latestMap = new Map()
    const allMap = new Map()

    interactionsData.forEach(i => {
      const cid = i.client_id

      if (!allMap.has(cid)) allMap.set(cid, [])
      allMap.get(cid).push(i)

      if (
        !latestMap.has(cid) ||
        new Date(i.created_at) > new Date(latestMap.get(cid).created_at)
      ) {
        latestMap.set(cid, i)
      }
    })

    // =====================================================
    // STEP 6: SUMMARY
    // =====================================================
    const summary = {
      total: leadsData.length,
      by_status: {},
      by_franchise_status: {},
      by_leadgen: {},
      by_leadgen_name: {}
    }

    leadsData.forEach(lead => {
      const latest = latestMap.get(lead.client_id)

      if (latest) {
        const s = latest.status || 'No Status'
        const f = latest.franchise_status || 'No Franchise Status'

        summary.by_status[s] = (summary.by_status[s] || 0) + 1
        summary.by_franchise_status[f] =
          (summary.by_franchise_status[f] || 0) + 1
      }

      const leadgenId = lead.leadgen_id
      const leadgenName = leadgenNameMap.get(leadgenId) || ''

      if (leadgenId) {
        summary.by_leadgen[leadgenId] = (summary.by_leadgen[leadgenId] || 0) + 1
      }
      if (leadgenName) {
        summary.by_leadgen_name[leadgenName] = (summary.by_leadgen_name[leadgenName] || 0) + 1
      }
    })

    // =====================================================
    // FINAL RESPONSE
    // =====================================================
    const total = leadsData.length
    const paginated = leadsData.slice(offset, offset + pageSize)

    const finalData = paginated.map(lead => ({
      ...lead,
      leadgen_name: leadgenNameMap.get(lead.leadgen_id) || '',
      latest_interaction: latestMap.get(lead.client_id) || null,
      all_interactions_count: (allMap.get(lead.client_id) || []).length,
      all_interactions: allMap.get(lead.client_id) || []
    }))

    return NextResponse.json({
      success: true,
      data: finalData,
      summary,
      pagination: {
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize)
      }
    })

  } catch (error) {
    console.error('API ERROR:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    )
  }
}