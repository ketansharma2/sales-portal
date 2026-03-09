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

    // Get the most recent date from corporate_leadgen_leads table (sourcing_date)
    const { data: latestDateData, error: latestDateError } = await supabaseServer
      .from('corporate_leadgen_leads')
      .select('sourcing_date')
      .not('sourcing_date', 'is', null)
      .order('sourcing_date', { ascending: false })
      .limit(1)
      .single()

    console.log('Latest date query result:', latestDateData, 'error:', latestDateError)

    let lastWorkingDayStr = ''
    if (latestDateData && latestDateData.sourcing_date) {
      lastWorkingDayStr = latestDateData.sourcing_date
    } else if (latestDateError) {
      console.error('Latest date error:', latestDateError)
    }

    console.log('Last working day:', lastWorkingDayStr)

    // Initialize metrics
    let clientSearchTotal = 0
    let clientSearchYesterday = 0
    let startupSearchTotal = 0
    let startupSearchYesterday = 0
    let startupCallingTotal = 0
    let startupCallingYesterday = 0
    let masterUnionClientsTotal = 0
    let masterUnionCallingTotal = 0
    let franchiseDiscussedTotal = 0
    let franchiseDiscussedYesterday = 0
    let formSharedTotal = 0
    let formSharedYesterday = 0

    // Get Total: Count from corporate_leadgen_leads where startup = 'NO'
    const { count: totalClientSearch, error: totalCSError } = await supabaseServer
      .from('corporate_leadgen_leads')
      .select('*', { count: 'exact', head: true })
      .ilike('startup', 'no')

    if (totalCSError) {
      console.error('Total client search error:', totalCSError)
    }

    clientSearchTotal = totalClientSearch || 0

    // Get Yesterday: Count from corporate_leadgen_leads where sourcing_date = lastWorkingDay AND startup = 'NO'
    if (lastWorkingDayStr) {
      const { count: yesterdayClientSearch, error: yesterdayCSError } = await supabaseServer
        .from('corporate_leadgen_leads')
        .select('*', { count: 'exact', head: true })
        .eq('sourcing_date', lastWorkingDayStr)
        .ilike('startup', 'no')

      if (yesterdayCSError) {
        console.error('Yesterday client search error:', yesterdayCSError)
      }

      clientSearchYesterday = yesterdayClientSearch || 0
    }

    // Get Startup Search Total: Count from corporate_leadgen_leads where startup = 'YES'
    const { count: totalStartupSearch, error: totalStartupSearchError } = await supabaseServer
      .from('corporate_leadgen_leads')
      .select('*', { count: 'exact', head: true })
      .ilike('startup', 'yes')

    if (totalStartupSearchError) {
      console.error('Total startup search error:', totalStartupSearchError)
    }

    startupSearchTotal = totalStartupSearch || 0

    // Get Startup Search Yesterday: Count where sourcing_date = lastWorkingDay AND startup = 'YES'
    if (lastWorkingDayStr) {
      const { count: yesterdayStartupSearch, error: yesterdayStartupSearchError } = await supabaseServer
        .from('corporate_leadgen_leads')
        .select('*', { count: 'exact', head: true })
        .eq('sourcing_date', lastWorkingDayStr)
        .ilike('startup', 'yes')

      if (yesterdayStartupSearchError) {
        console.error('Yesterday startup search error:', yesterdayStartupSearchError)
      }

      startupSearchYesterday = yesterdayStartupSearch || 0
    }

    // Get Startup Calling Total: distinct client_id per unique date from corporate_leads_interaction
    // where corporate_leadgen_leads startup = 'YES' (case insensitive)
    const { data: startupCallingData, error: startupCallingError } = await supabaseServer
      .from('corporate_leads_interaction')
      .select('client_id, date, corporate_leadgen_leads!inner(startup)')

    if (startupCallingError) {
      console.error('Startup calling data error:', startupCallingError)
    }

    // Filter where startup = 'YES' (case insensitive) and count distinct client_id + date
    const startupCallingSet = new Set()
    startupCallingData?.forEach(record => {
      const startupValue = record.corporate_leadgen_leads?.startup
      if (startupValue && startupValue.toLowerCase() === 'yes' && record.client_id) {
        // Use 'NULL' string for null dates to include them in count
        const dateKey = record.date || 'NULL'
        startupCallingSet.add(`${record.client_id}_${dateKey}`)
      }
    })

    startupCallingTotal = startupCallingSet.size

    // Get Startup Calling Yesterday: same logic but date = lastWorkingDay
    const { data: startupCallingYesterdayData, error: startupCallingYesterdayError } = await supabaseServer
      .from('corporate_leads_interaction')
      .select('client_id, date, corporate_leadgen_leads!inner(startup)')
      .eq('date', lastWorkingDayStr)

    if (startupCallingYesterdayError) {
      console.error('Startup calling yesterday error:', startupCallingYesterdayError)
    }

    const startupCallingYesterdaySet = new Set()
    startupCallingYesterdayData?.forEach(record => {
      const startupValue = record.corporate_leadgen_leads?.startup
      if (startupValue && startupValue.toLowerCase() === 'yes' && record.client_id && record.date) {
        startupCallingYesterdaySet.add(`${record.client_id}_${record.date}`)
      }
    })

    startupCallingYesterday = startupCallingYesterdaySet.size

    // Get Master Union Clients Total: Count rows from corporate_leadgen_leads where startup = 'Master Union' (case insensitive)
    const { count: masterUnionClientsCount, error: masterUnionClientsError } = await supabaseServer
      .from('corporate_leadgen_leads')
      .select('*', { count: 'exact', head: true })
      .ilike('startup', 'master union')

    if (masterUnionClientsError) {
      console.error('Master union clients error:', masterUnionClientsError)
    }

    masterUnionClientsTotal = masterUnionClientsCount || 0

    // Get Master Union Calling Total: distinct client_id per unique date from corporate_leads_interaction
    // where corporate_leadgen_leads startup = 'Master Union' (case insensitive)
    const { data: masterUnionCallingData, error: masterUnionCallingError } = await supabaseServer
      .from('corporate_leads_interaction')
      .select('client_id, date, corporate_leadgen_leads!inner(startup)')

    if (masterUnionCallingError) {
      console.error('Master union calling data error:', masterUnionCallingError)
    }

    // Filter where startup = 'Master Union' (case insensitive) and count distinct client_id + date
    const masterUnionCallingSet = new Set()
    masterUnionCallingData?.forEach(record => {
      const startupValue = record.corporate_leadgen_leads?.startup
      if (startupValue && startupValue.toLowerCase() === 'master union' && record.client_id) {
        // Use 'NULL' string for null dates to include them in count
        const dateKey = record.date || 'NULL'
        masterUnionCallingSet.add(`${record.client_id}_${dateKey}`)
      }
    })

    masterUnionCallingTotal = masterUnionCallingSet.size

    // Get Franchise Discussed Total: distinct client_ids from corporate_leads_interaction 
    // where franchise_status is NOT 'No Franchise Discuss'
    const { data: franchiseDiscussedData, error: franchiseDiscussedError } = await supabaseServer
      .from('corporate_leads_interaction')
      .select('client_id, franchise_status')
      .not('franchise_status', 'ilike', 'No Franchise Discuss')

    if (franchiseDiscussedError) {
      console.error('Franchise discussed error:', franchiseDiscussedError)
    }

    // Get unique client_ids
    const franchiseDiscussedSet = new Set()
    franchiseDiscussedData?.forEach(record => {
      if (record.client_id) {
        franchiseDiscussedSet.add(record.client_id)
      }
    })

    franchiseDiscussedTotal = franchiseDiscussedSet.size

    // Get Franchise Discussed Yesterday: same logic but date = lastWorkingDay
    const { data: franchiseDiscussedYesterdayData, error: franchiseDiscussedYesterdayError } = await supabaseServer
      .from('corporate_leads_interaction')
      .select('client_id, franchise_status, date')
      .not('franchise_status', 'ilike', 'No Franchise Discuss')
      .eq('date', lastWorkingDayStr)

    if (franchiseDiscussedYesterdayError) {
      console.error('Franchise discussed yesterday error:', franchiseDiscussedYesterdayError)
    }

    // Get unique client_ids for yesterday
    const franchiseDiscussedYesterdaySet = new Set()
    franchiseDiscussedYesterdayData?.forEach(record => {
      if (record.client_id) {
        franchiseDiscussedYesterdaySet.add(record.client_id)
      }
    })

    franchiseDiscussedYesterday = franchiseDiscussedYesterdaySet.size

    // Get Form Shared Total: Count unique client_ids from corporate_leads_interaction 
    // where franchise_status = 'Application form share' (case insensitive)
    const { data: formSharedData, error: formSharedError } = await supabaseServer
      .from('corporate_leads_interaction')
      .select('client_id, franchise_status')
      .ilike('franchise_status', 'Application form share')

    if (formSharedError) {
      console.error('Form shared error:', formSharedError)
    }

    // Get unique client_ids
    const formSharedSet = new Set()
    formSharedData?.forEach(record => {
      if (record.client_id) {
        formSharedSet.add(record.client_id)
      }
    })

    formSharedTotal = formSharedSet.size

    // Get Form Shared Yesterday: same logic but date = lastWorkingDay
    const { data: formSharedYesterdayData, error: formSharedYesterdayError } = await supabaseServer
      .from('corporate_leads_interaction')
      .select('client_id, franchise_status, date')
      .ilike('franchise_status', 'Application form share')
      .eq('date', lastWorkingDayStr)

    if (formSharedYesterdayError) {
      console.error('Form shared yesterday error:', formSharedYesterdayError)
    }

    // Get unique client_ids for yesterday
    const formSharedYesterdaySet = new Set()
    formSharedYesterdayData?.forEach(record => {
      if (record.client_id) {
        formSharedYesterdaySet.add(record.client_id)
      }
    })

    formSharedYesterday = formSharedYesterdaySet.size

    // Get Client Calling Total: distinct client_id + date from corporate_leads_interaction
    // where startup = 'NO' in corporate_leadgen_leads (include NULL dates as well)
    const { data: callingData, error: callingError } = await supabaseServer
      .from('corporate_leads_interaction')
      .select('client_id, date, corporate_leadgen_leads!inner(startup)')

    if (callingError) {
      console.error('Client calling data error:', callingError)
    }

    // Filter where startup = 'NO' and count distinct client_id + date (treating NULL date as a valid value)
    const callingSet = new Set()
    callingData?.forEach(record => {
      if (record.corporate_leadgen_leads?.startup === 'NO' && record.client_id) {
        // Use 'NULL' string for null dates to include them in count
        const dateKey = record.date || 'NULL'
        callingSet.add(`${record.client_id}_${dateKey}`)
      }
    })

    const clientCallingTotal = callingSet.size

    // Get Client Calling Yesterday: same logic but date = lastWorkingDay
    const { data: callingYesterdayData, error: callingYesterdayError } = await supabaseServer
      .from('corporate_leads_interaction')
      .select('client_id, date, corporate_leadgen_leads!inner(startup)')
      .eq('date', lastWorkingDayStr)

    if (callingYesterdayError) {
      console.error('Client calling yesterday error:', callingYesterdayError)
    }

    const callingYesterdaySet = new Set()
    callingYesterdayData?.forEach(record => {
      if (record.corporate_leadgen_leads?.startup === 'NO' && record.client_id && record.date) {
        callingYesterdaySet.add(`${record.client_id}_${record.date}`)
      }
    })

    const clientCallingYesterday = callingYesterdaySet.size

    // Get Contract Share Total: Count distinct client_ids who have at least one interaction with sub_status = 'Contract Share'
    const { data: contractShareData, error: contractShareError } = await supabaseServer
      .from('corporate_leads_interaction')
      .select('client_id, sub_status')
      .eq('sub_status', 'Contract Share')

    if (contractShareError) {
      console.error('Contract share total error:', contractShareError)
    }

    // Get unique client_ids
    const contractShareSet = new Set()
    contractShareData?.forEach(record => {
      if (record.client_id) {
        contractShareSet.add(record.client_id)
      }
    })

    const contractShareTotal = contractShareSet.size

    // Get Contract Share Yesterday: Count distinct client_ids who have at least one interaction with sub_status = 'Contract Share' on yesterday's date
    const yesterdayDateObj = new Date(lastWorkingDayStr)
    const nextDayObj = new Date(lastWorkingDayStr)
    nextDayObj.setDate(nextDayObj.getDate() + 1)
    
    const yesterdayDateStart = yesterdayDateObj.toISOString()
    const nextDayStart = nextDayObj.toISOString()
    
    const { data: contractShareYesterdayData, error: contractShareYesterdayError } = await supabaseServer
      .from('corporate_leads_interaction')
      .select('client_id, sub_status, created_at')
      .eq('sub_status', 'Contract Share')
      .gte('created_at', yesterdayDateStart)
      .lt('created_at', nextDayStart)

    if (contractShareYesterdayError) {
      console.error('Contract share yesterday error:', contractShareYesterdayError)
    }

    // Get unique client_ids for yesterday
    const contractShareYesterdaySet = new Set()
    contractShareYesterdayData?.forEach(record => {
      if (record.client_id) {
        contractShareYesterdaySet.add(record.client_id)
      }
    })

    const contractShareYesterday = contractShareYesterdaySet.size

    return NextResponse.json({
      success: true,
      data: {
        lastWorkingDay: lastWorkingDayStr,
        clientSearchTotal,
        clientSearchYesterday,
        clientCallingTotal,
        clientCallingYesterday,
        contractShareTotal,
        contractShareYesterday,
        startupSearchTotal,
        startupSearchYesterday,
        startupCallingTotal,
        startupCallingYesterday,
        masterUnionClientsTotal,
        masterUnionCallingTotal,
        franchiseDiscussedTotal,
        franchiseDiscussedYesterday,
        formSharedTotal,
        formSharedYesterday
      }
    })

  } catch (error) {
    console.error('Corporate morning report API error:', error)
    return NextResponse.json({
      error: 'Internal server error',
      details: error.message
    }, { status: 500 })
  }
}
