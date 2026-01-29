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

    const { searchParams } = new URL(request.url)
    const branchId = searchParams.get('branch_id')

    if (!branchId) {
      return NextResponse.json({ error: 'Branch ID is required' }, { status: 400 })
    }

    // Fetch requirements for the branch
    const { data: requirements, error } = await supabaseServer
      .from('corporate_crm_reqs')
      .select('*')
      .eq('branch_id', branchId)
      .order('date', { ascending: false })

    if (error) {
      console.error('Fetch requirements error:', error)
      return NextResponse.json({
        error: 'Failed to fetch requirements',
        details: error.message
      }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      data: requirements
    })

  } catch (error) {
    console.error('Get requirements API error:', error)
    return NextResponse.json({
      error: 'Internal server error',
      details: error.message
    }, { status: 500 })
  }
}

export async function POST(request) {
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

    const body = await request.json()
    const { branch_id, job_title, jd_link, experience, package: pkg, openings, priority, status, timeline, date } = body

    // Validate required fields
    if (!branch_id || !job_title) {
      return NextResponse.json({ error: 'Branch ID and job title are required' }, { status: 400 })
    }

    // Insert into corporate_crm_reqs table
    const { data: newRequirement, error: insertError } = await supabaseServer
      .from('corporate_crm_reqs')
      .insert({
        branch_id,
        user_id: user.id,
        job_title,
        jd_link,
        experience,
        package: pkg,
        openings: parseInt(openings) || 0,
        priority,
        status,
        timeline,
        date: date || new Date().toISOString().split('T')[0]
      })
      .select()
      .single()

    if (insertError) {
      console.error('Insert requirement error:', insertError)
      return NextResponse.json({
        error: 'Failed to create requirement',
        details: insertError.message
      }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      data: newRequirement
    })

  } catch (error) {
    console.error('Create requirement API error:', error)
    return NextResponse.json({
      error: 'Internal server error',
      details: error.message
    }, { status: 500 })
  }
}