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

    // Get query parameters
    const { searchParams } = new URL(request.url)
    const client_id = searchParams.get('client_id')
    const sent_to_tl = searchParams.get('sent_to_tl')

    // Build query for workbench data
    let query = supabaseServer
      .from('corporate_workbench')
      .select('*')
      .order('created_at', { ascending: false })

    // Apply filters
    if (client_id) {
      query = query.eq('client_id', client_id)
    }
    if (sent_to_tl) {
      query = query.eq('sent_to_tl', sent_to_tl)
    }

    const { data: workbenchData, error: fetchError } = await query

    if (fetchError) {
      console.error('Fetch workbench error:', fetchError)
      return NextResponse.json({
        error: 'Failed to fetch workbench data',
        details: fetchError.message
      }, { status: 500 })
    }

    // Fetch related data separately
    const clientIds = [...new Set(workbenchData.map(item => item.client_id).filter(Boolean))]
    const reqIds = [...new Set(workbenchData.map(item => item.req_id).filter(Boolean))]
    const tlIds = [...new Set(workbenchData.map(item => item.sent_to_tl).filter(Boolean))]

    // Fetch clients
    const { data: clientsData } = await supabaseServer
      .from('corporate_crm_clients')
      .select('client_id, company_name')
      .in('client_id', clientIds)

    // Fetch requirements
    const { data: reqsData } = await supabaseServer
      .from('corporate_crm_reqs')
      .select('req_id, job_title, experience, package, openings, location, employment_type, working_days, timings, tool_req, job_summary, rnr, req_skills, preferred_qual, company_offers, contact_details')
      .in('req_id', reqIds)

    // Fetch TL users
    const { data: usersData } = await supabaseServer
      .from('users')
      .select('user_id, name, email')
      .in('user_id', tlIds)

    // Create lookup maps
    const clientsMap = new Map(clientsData?.map(c => [c.client_id, c]) || [])
    const reqsMap = new Map(reqsData?.map(r => [r.req_id, r]) || [])
    const usersMap = new Map(usersData?.map(u => [u.user_id, u]) || [])

    // Transform data for UI
    const transformedData = workbenchData.map(item => {
      const client = clientsMap.get(item.client_id)
      const req = reqsMap.get(item.req_id)
      const tl = usersMap.get(item.sent_to_tl)

      return {
        id: item.workbench_id,
        date: item.date,
        client_id: item.client_id,
        client_name: client?.company_name || 'Unknown Client',
        req_id: item.req_id,
        job_title: req?.job_title || 'Unknown Requirement',
        experience: req?.experience || '',
        package: item.package || req?.package || '',
        openings: req?.openings || 0,
        requirement: item.req,
        sent_to_tl: item.sent_to_tl,
        tl_name: tl?.name || 'Unknown TL',
        tl_email: tl?.email || '',
        sent_to_rc: item.sent_to_rc,
        user_id: item.user_id,
        created_at: item.created_at,
        // JD details from requirements
        location: req?.location || '',
        employment_type: req?.employment_type || '',
        working_days: req?.working_days || '',
        timings: req?.timings || '',
        tool_requirement: req?.tool_req || '',
        job_summary: req?.job_summary || '',
        rnr: req?.rnr || '',
        req_skills: req?.req_skills || '',
        preferred_qual: req?.preferred_qual || '',
        company_offers: req?.company_offers || '',
        contact_details: req?.contact_details || ''
      }
    })

    return NextResponse.json({
      success: true,
      data: transformedData
    })

  } catch (error) {
    console.error('Fetch workbench API error:', error)
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
      date,
      client_id,
      req_id,
      package_salary,
      req,
      sent_to_tl,
      sent_to_rc
    } = body

    // Validate required fields
    if (!date || !client_id || !req_id || !sent_to_tl) {
      return NextResponse.json({
        error: 'Date, client_id, req_id, and sent_to_tl are required'
      }, { status: 400 })
    }

    // Insert into corporate_workbench table
    const { data: newWorkbench, error: insertError } = await supabaseServer
      .from('corporate_workbench')
      .insert({
        date,
        client_id,
        req_id,
        package: package_salary,
        req: req ? parseInt(req) : null,
        sent_to_tl,
        sent_to_rc: sent_to_rc || null,
        user_id: user.user_id || user.id
      })
      .select()
      .single()

    if (insertError) {
      console.error('Insert workbench error:', insertError)
      return NextResponse.json({
        error: 'Failed to assign workbench',
        details: insertError.message
      }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      data: newWorkbench
    })

  } catch (error) {
    console.error('Assign workbench API error:', error)
    return NextResponse.json({
      error: 'Internal server error',
      details: error.message
    }, { status: 500 })
  }
}

export async function PUT(request) {
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
      workbench_id,
      date,
      client_id,
      req_id,
      package_salary,
      req,
      sent_to_tl,
      sent_to_rc
    } = body

    // Validate required fields
    if (!workbench_id) {
      return NextResponse.json({
        error: 'workbench_id is required'
      }, { status: 400 })
    }

    // Update corporate_workbench table
    const { data: updatedWorkbench, error: updateError } = await supabaseServer
      .from('corporate_workbench')
      .update({
        date,
        client_id,
        req_id,
        package: package_salary,
        req: req ? parseInt(req) : null,
        sent_to_tl,
        sent_to_rc: sent_to_rc || null
      })
      .eq('workbench_id', workbench_id)
      .select()
      .single()

    if (updateError) {
      console.error('Update workbench error:', updateError)
      return NextResponse.json({
        error: 'Failed to update workbench',
        details: updateError.message
      }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      data: updatedWorkbench
    })

  } catch (error) {
    console.error('Update workbench API error:', error)
    return NextResponse.json({
      error: 'Internal server error',
      details: error.message
    }, { status: 500 })
  }
}

export async function DELETE(request) {
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
    const workbench_id = searchParams.get('workbench_id')

    // Validate required fields
    if (!workbench_id) {
      return NextResponse.json({
        error: 'workbench_id is required'
      }, { status: 400 })
    }

    // Delete from corporate_workbench table
    const { error: deleteError } = await supabaseServer
      .from('corporate_workbench')
      .delete()
      .eq('workbench_id', workbench_id)

    if (deleteError) {
      console.error('Delete workbench error:', deleteError)
      return NextResponse.json({
        error: 'Failed to delete workbench',
        details: deleteError.message
      }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: 'Workbench deleted successfully'
    })

  } catch (error) {
    console.error('Delete workbench API error:', error)
    return NextResponse.json({
      error: 'Internal server error',
      details: error.message
    }, { status: 500 })
  }
}
