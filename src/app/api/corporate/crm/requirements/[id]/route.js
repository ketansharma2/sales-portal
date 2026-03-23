import { supabaseServer } from '@/lib/supabase-server'
import { NextResponse } from 'next/server'

export async function PUT(request, { params }) {
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

    // Unwrap params Promise
    const { id } = await params
    console.log('PUT request received for requirement ID:', id);
    
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
    if (!id || !job_title) {
      return NextResponse.json({ error: 'Requirement ID and job title are required' }, { status: 400 })
    }

    // Update the requirement
    const { data: updatedRequirement, error: updateError } = await supabaseServer
      .from('corporate_crm_reqs')
      .update({
        branch_id,
        job_title,
        jd_link,
        experience,
        package: pkg,
        openings: parseInt(openings) || 0,
        priority,
        status,
        timeline,
        date,
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
      .eq('req_id', id)
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
      data: updatedRequirement
    })

  } catch (error) {
    console.error('Update requirement API error:', error)
    return NextResponse.json({
      error: 'Internal server error',
      details: error.message
    }, { status: 500 })
  }
}
