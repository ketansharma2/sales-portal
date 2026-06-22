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
    const parsingId = searchParams.get('parsing_id')

    if (!parsingId) {
      return NextResponse.json({ error: 'Parsing ID is required' }, { status: 400 })
    }

    // Fetch candidate data from cv_parsing table
    const { data, error } = await supabaseServer
      .from('cv_parsing')
      .select('*')
      .eq('id', parsingId)
      .single()

    if (error) {
      console.error('Fetch candidate error:', error)
      return NextResponse.json({
        error: 'Failed to fetch candidate details',
        details: error.message
      }, { status: 500 })
    }

    // Transform data to match frontend expectations
    const candidateData = {
      name: data.name || '-',
      email: data.email || '-',
      phone: data.mobile || '-',
      total_experience: data.experience || '-',
      current_company: data.recent_company || '-',
      skills: data.top_skills || data.skills_all || '-',
      education: data.education || '-',
      designation: data.designation || '-',
      location: data.location || '-',
      portal: data.portal || '-',
      portal_date: data.portal_date || '-',
      cv_url: data.cv_url || data.redacted_cv_url || null
    }

    return NextResponse.json({
      success: true,
      data: candidateData
    })

  } catch (error) {
    console.error('Get candidate details API error:', error)
    return NextResponse.json({
      error: 'Internal server error',
      details: error.message
    }, { status: 500 })
  }
}
