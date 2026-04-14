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
    const branchIds = searchParams.get('branch_ids')

    if (!branchId && !branchIds) {
      return NextResponse.json({ error: 'Branch ID or Branch IDs are required' }, { status: 400 })
    }

    let query = supabaseServer
      .from('domestic_crm_reqs')
      .select('*')
      .order('date', { ascending: false })

    if (branchIds) {
      const branchIdArray = branchIds.split(',').map(id => id.trim())
      query = query.in('branch_id', branchIdArray)
    } else if (branchId) {
      query = query.eq('branch_id', branchId)
    }

    const { data: requirements, error } = await query

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
    const { 
      branch_id, 
      job_title, 
      jd_link, 
      experience, 
      package: pkg, 
      openings, 
      priority, 
      status, 
      timeline, 
      date,
      // JD fields
      location,
      employment_type,
      working_days,
      timings,
      tool_requirement,
      job_summary,
      rnr,
      req_skills,
      preferred_qual,
      company_offers,
      contact_details
    } = body

    // Validate required fields
    if (!branch_id || !job_title) {
      return NextResponse.json({ error: 'Branch ID and job title are required' }, { status: 400 })
    }

    // Insert into domestic_crm_reqs table with all JD fields
    const { data: newRequirement, error: insertError } = await supabaseServer
      .from('domestic_crm_reqs')
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
        date: date || new Date().toISOString().split('T')[0],
        // JD fields
        location: location || null,
        employment_type: employment_type || null,
        working_days: working_days || null,
        timings: timings || null,
        tool_req: tool_requirement || null,
        job_summary: job_summary || null,
        rnr: rnr || null,
        req_skills: req_skills || null,
        preferred_qual: preferred_qual || null,
        company_offers: company_offers || null,
        contact_details: contact_details || null
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

export async function PUT(request) {
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

    const body = await request.json()
    const { 
      req_id,
      branch_id, 
      job_title, 
      jd_link, 
      experience, 
      package: pkg, 
      openings, 
      priority, 
      status, 
      timeline, 
      date,
      location,
      employment_type,
      working_days,
      timings,
      tool_requirement,
      job_summary,
      rnr,
      req_skills,
      preferred_qual,
      company_offers,
      contact_details
    } = body

    if (!req_id || !branch_id) {
      return NextResponse.json({ error: 'req_id and branch_id are required' }, { status: 400 })
    }

    const { data: updatedReq, error: updateError } = await supabaseServer
      .from('domestic_crm_reqs')
      .update({
        job_title,
        jd_link,
        experience,
        package: pkg,
        openings: parseInt(openings) || 0,
        priority,
        status,
        timeline,
        date,
        location: location || null,
        employment_type: employment_type || null,
        working_days: working_days || null,
        timings: timings || null,
        tool_req: tool_requirement || null,
        job_summary: job_summary || null,
        rnr: rnr || null,
        req_skills: req_skills || null,
        preferred_qual: preferred_qual || null,
        company_offers: company_offers || null,
        contact_details: contact_details || null
      })
      .eq('req_id', req_id)
      .eq('branch_id', branch_id)
      .select()
      .single()

    if (updateError) {
      console.error('Update requirement error:', updateError)
      return NextResponse.json({
        error: 'Failed to update requirement',
        details: updateError.message
      }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      data: updatedReq
    })

  } catch (error) {
    console.error('Update requirement API error:', error)
    return NextResponse.json({
      error: 'Internal server error',
      details: error.message
    }, { status: 500 })
  }
}