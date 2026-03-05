import { supabaseServer } from '@/lib/supabase-server'
import { NextResponse } from 'next/server'

// GET - Fetch JDs sent to the logged-in jobpost user (both domestic and corporate)
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

    // Fetch JDs from both domestic_crm_jd and corporate_crm_jd tables
    const [domesticJDs, corporateJDs] = await Promise.all([
      supabaseServer
        .from('domestic_crm_jd')
        .select('*')
        .eq('sent_to', userId),
      supabaseServer
        .from('corporate_crm_jd')
        .select('*')
        .eq('sent_to', userId)
    ])

    if (domesticJDs.error) {
      console.error('Error fetching domestic JDs:', domesticJDs.error)
    }
    if (corporateJDs.error) {
      console.error('Error fetching corporate JDs:', corporateJDs.error)
    }

    // Add sector identifier and combine both lists
    const domesticList = (domesticJDs.data || []).map(jd => ({ ...jd, sector: 'Domestic' }))
    const corporateList = (corporateJDs.data || []).map(jd => ({ ...jd, sector: 'Corporate' }))
    
    // Combine and sort by sent_date
    const allJDs = [...domesticList, ...corporateList].sort((a, b) => {
      const dateA = a.sent_date || '1970-01-01'
      const dateB = b.sent_date || '1970-01-01'
      return new Date(dateB) - new Date(dateA)
    })

    // Fetch job_postings for all JDs
    const jdIds = allJDs?.map((j) => j.jd_id) || []
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

    // Fetch posting_data (CV logs) for all JDs
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
    const jdsWithAll = allJDs?.map((jd) => ({
      ...jd,
      sector: jd.sector,
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
      // Include the status from the JD table
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
