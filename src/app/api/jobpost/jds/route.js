import { supabaseServer } from '@/lib/supabase-server'
import { NextResponse } from 'next/server'

// GET - Fetch JDs sent to the logged-in jobpost user
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

    // Fetch JDs where sent_to matches the logged-in user
    const { data: jds, error } = await supabaseServer
      .from('domestic_crm_jd')
      .select('*')
      .eq('sent_to', userId)
      .order('sent_date', { ascending: false })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Fetch job_postings for these JDs
    const jdIds = jds?.map((j) => j.jd_id) || []
    let postings = []
    
    if (jdIds.length > 0) {
      const { data: jobPostings, error: postingsError } = await supabaseServer
        .from('job_postings')
        .select('*')
        .in('jd_id', jdIds)
        .order('created_at', { ascending: false })

      if (postingsError) {
        console.error('Error fetching postings:', postingsError)
      } else {
        postings = jobPostings || []
      }
    }

    // Fetch posting_data (CV logs) for these JDs
    let cvData = [];
    if (jdIds.length > 0) {
      const { data: cvLogs, error: cvError } = await supabaseServer
        .from('posting_data')
        .select('*')
        .in('jd_id', jdIds)
        .order('date', { ascending: false });

      if (!cvError && cvLogs) {
        cvData = cvLogs;
      }
    }

    // Merge data into JDs
    const jdsWithAll = jds?.map((jd) => ({
      ...jd,
      sector: 'Domestic', // Default sector for domestic_crm_jd table
      publishingDetails: postings
        .filter((p) => p.jd_id === jd.jd_id)
        .map((p) => ({
          id: p.id,
          platform: p.platform,
          live_url: p.live_url,
          stage: p.current_stage,
          postedOn: p.posted_on,
          createdAt: p.created_at
        })),
      cvLogs: cvData
        .filter((c) => c.jd_id === jd.jd_id)
        .map((c) => ({
          id: c.id,
          date: c.date,
          platform: c.platform,
          count: c.cv_received,
          callingCount: c.calls_done
        })),
      // Include the status from domestic_crm_jd table
      jdStatus: jd.status
    })) || []

    // Fetch created_by user names
    const jdsWithNames = await Promise.all(jdsWithAll.map(async (jd) => {
      if (jd.created_by) {
        const { data: userData } = await supabaseServer
          .from('users')
          .select('name')
          .eq('user_id', jd.created_by)
          .single()
        return { ...jd, created_by_name: userData?.name || null }
      }
      return jd
    }))

    return NextResponse.json(jdsWithNames || [])
  } catch (error) {
    console.error('Error fetching jobpost JDs:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
