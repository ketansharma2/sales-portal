import { supabaseServer } from '@/lib/supabase-server'
import { NextResponse } from 'next/server'

// Separate API for candidate-history dropdown - only fetches required fields
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

    // Get today's date in YYYY-MM-DD format
    const today = new Date().toISOString().split('T')[0]

    // Fetch workbench data with req_id and slot only
    const { data: workbenchData, error } = await supabaseServer
      .from('corporate_workbench')
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

    // Get unique req_ids
    const reqIds = [...new Set(workbenchData?.map(item => item.req_id).filter(Boolean))] || []

    // Fetch only job_title for the requirements
    let reqsData = []
    if (reqIds.length > 0) {
      const { data: requirements } = await supabaseServer
        .from('corporate_crm_reqs')
        .select('req_id, job_title')
        .in('req_id', reqIds)
      
      reqsData = requirements || []
    }

    // Create lookup map
    const reqsMap = new Map(reqsData.map(r => [r.req_id, r]))

    // Transform data - only job_title and slot for dropdown
    const transformedData = workbenchData?.map(item => {
      const req = reqsMap.get(item.req_id)
      return {
        req_id: item.req_id,
        job_title: req?.job_title || '',
        slot: item.slot || ''
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