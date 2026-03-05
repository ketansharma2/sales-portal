import { supabaseServer } from '@/lib/supabase-server'
import { NextResponse } from 'next/server'

// GET - Fetch all job descriptions
export async function GET(request) {
  try {
    const authHeader = request.headers.get('authorization')
    if (!authHeader) {
      return NextResponse.json({ error: 'No authorization header' }, { status: 401 })
    }

    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authError } = await supabaseServer.auth.getUser(token)
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = user.user_id || user.id

    // For now, get all JDs - can be filtered later if needed
    // This handles legacy data where created_by might be "undefined" string
    const { data: jds, error } = await supabaseServer
      .from('domestic_crm_jd')
      .select('*')
      .order('created_date', { ascending: false })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Fetch posting_data (CV counts) for all JDs
    const jdIds = jds?.map((j) => j.jd_id) || []
    let cvData = []
    
    if (jdIds.length > 0) {
      const { data: postingData, error: cvError } = await supabaseServer
        .from('posting_data')
        .select('jd_id, cv_received')
        .in('jd_id', jdIds)

      if (!cvError && postingData) {
        cvData = postingData
      }
    }

    // Calculate total CVs for each JD
    const cvTotals = {}
    cvData.forEach(item => {
      if (item.jd_id) {
        cvTotals[item.jd_id] = (cvTotals[item.jd_id] || 0) + (item.cv_received || 0)
      }
    })

    // Fetch sent_to user names and add CV totals
    const jdsWithNames = await Promise.all(jds.map(async (jd) => {
      let result = { ...jd, totalCVs: cvTotals[jd.jd_id] || 0 }
      
      if (jd.sent_to) {
        const { data: userData } = await supabaseServer
          .from('users')
          .select('name')
          .eq('user_id', jd.sent_to)
          .single()
        result = { ...result, sent_to_name: userData?.name || null }
      }
      return result
    }))

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(jdsWithNames)
  } catch (error) {
    console.error('Error fetching job descriptions:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST - Create new job description
export async function POST(request) {
  try {
    const authHeader = request.headers.get('authorization')
    if (!authHeader) {
      return NextResponse.json({ error: 'No authorization header' }, { status: 401 })
    }

    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authError } = await supabaseServer.auth.getUser(token)
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    
    const userId = user.user_id || user.id
    
    const { data, error } = await supabaseServer
      .from('domestic_crm_jd')
      .insert([
        {
          created_by: userId,
          client_name: body.client_name,
          job_title: body.job_title,
          location: body.location,
          experience: body.experience,
          employment_type: body.employment_type,
          working_days: body.working_days,
          timings: body.timings,
          package: body.package,
          tool_requirement: body.tool_requirement,
          job_summary: body.job_summary,
          rnr: body.rnr,
          req_skills: body.req_skills,
          preferred_qual: body.preferred_qual,
          company_offers: body.company_offers,
          contact_details: body.contact_details,
          status: body.status || 'Draft'
        }
      ])
      .select()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(data[0], { status: 201 })
  } catch (error) {
    console.error('Error creating job description:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// PUT - Update job description
export async function PUT(request) {
  try {
    const authHeader = request.headers.get('authorization')
    if (!authHeader) {
      return NextResponse.json({ error: 'No authorization header' }, { status: 401 })
    }

    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authError } = await supabaseServer.auth.getUser(token)
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = user.user_id || user.id
    const body = await request.json()
    
    // Get jd_id from URL params, not from body
    const { searchParams } = new URL(request.url)
    const jd_id = searchParams.get('jd_id')
    
    console.log('PUT request - jd_id from URL:', jd_id, 'updateData:', body)

    if (!jd_id) {
      return NextResponse.json({ error: 'JD ID is required' }, { status: 400 })
    }

    // Try update without select first to isolate the issue
    const { error } = await supabaseServer
      .from('domestic_crm_jd')
      .update(body)
      .eq('jd_id', jd_id)

    if (error) {
      console.log('Update error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Fetch the updated record
    const { data: updatedJd, error: fetchError } = await supabaseServer
      .from('domestic_crm_jd')
      .select('*')
      .eq('jd_id', jd_id)
      .single()

    if (fetchError) {
      return NextResponse.json({ error: fetchError.message }, { status: 500 })
    }

    return NextResponse.json(updatedJd)
  } catch (error) {
    console.error('Error updating job description:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// DELETE - Delete job description
export async function DELETE(request) {
  try {
    const authHeader = request.headers.get('authorization')
    if (!authHeader) {
      return NextResponse.json({ error: 'No authorization header' }, { status: 401 })
    }

    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authError } = await supabaseServer.auth.getUser(token)
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const jd_id = searchParams.get('jd_id')

    if (!jd_id) {
      return NextResponse.json({ error: 'JD ID required' }, { status: 400 })
    }

    const { error } = await supabaseServer
      .from('domestic_crm_jd')
      .delete()
      .eq('jd_id', jd_id)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ message: 'Job description deleted successfully' })
  } catch (error) {
    console.error('Error deleting job description:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
