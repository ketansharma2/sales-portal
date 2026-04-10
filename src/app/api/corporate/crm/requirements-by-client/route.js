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

    const currentUserId = user.user_id || user.id
    const { searchParams } = new URL(request.url)
    const clientId = searchParams.get('client_id')

    if (!clientId) {
      return NextResponse.json({ error: 'client_id is required' }, { status: 400 })
    }

    // Get branch_id from corporate_crm_branch for this client and user
    const { data: branchData, error: branchError } = await supabaseServer
      .from('corporate_crm_branch')
      .select('branch_id')
      .eq('client_id', clientId)
      .eq('user_id', currentUserId)
      .single()

    if (branchError || !branchData) {
      return NextResponse.json({ success: true, data: [] })
    }

    // Get requirements for this branch
    const { data: reqsData, error: reqsError } = await supabaseServer
      .from('corporate_crm_reqs')
      .select('req_id, job_title')
      .eq('branch_id', branchData.branch_id)
      .order('job_title', { ascending: true })

    if (reqsError) {
      console.error('Fetch requirements error:', reqsError)
      return NextResponse.json({ error: 'Failed to fetch requirements', details: reqsError.message }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      data: reqsData || []
    })

  } catch (error) {
    console.error('Requirements API error:', error)
    return NextResponse.json({ error: 'Internal server error', details: error.message }, { status: 500 })
  }
}