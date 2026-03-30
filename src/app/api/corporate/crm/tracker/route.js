import { supabaseServer } from '@/lib/supabase-server';
import { NextResponse } from 'next/server';

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

    // Get current user's ID (CRM user)
    const currentUserId = user.user_id || user.id

    // Fetch candidates_conversation where sent_to_crm = current user
    const { data: conversations, error: fetchError } = await supabaseServer
      .from('candidates_conversation')
      .select('*')
      .eq('sent_to_crm', currentUserId)
      .order('crm_sent_date', { ascending: false })

    if (fetchError) {
      console.error('Fetch CRM tracker conversations error:', fetchError)
      return NextResponse.json({
        error: 'Failed to fetch tracker data',
        details: fetchError.message
      }, { status: 500 })
    }

    if (!conversations || conversations.length === 0) {
      return NextResponse.json({
        success: true,
        data: []
      })
    }

    // Extract unique IDs for joins
    const tlUserIds = [...new Set(conversations.map(c => c.sent_to_tl).filter(Boolean))]
    const reqIds = [...new Set(conversations.map(c => c.req_id).filter(Boolean))]
    const parsingIds = [...new Set(conversations.map(c => c.parsing_id).filter(Boolean))]

    // Fetch TL names from users table
    let tlUsersMap = new Map()
    if (tlUserIds.length > 0) {
      const { data: tlUsersData } = await supabaseServer
        .from('users')
        .select('user_id, name')
        .in('user_id', tlUserIds)
      
      if (tlUsersData) {
        tlUsersMap = new Map(tlUsersData.map(u => [u.user_id, u.name]))
      }
    }

    // Fetch job titles from corporate_crm_reqs
    let reqsMap = new Map()
    if (reqIds.length > 0) {
      const { data: reqsData } = await supabaseServer
        .from('corporate_crm_reqs')
        .select('req_id, job_title')
        .in('req_id', reqIds)
      
      if (reqsData) {
        reqsMap = new Map(reqsData.map(r => [r.req_id, r.job_title]))
      }
    }

    // Fetch candidate details from cv_parsing table
    let cvParsingMap = new Map()
    if (parsingIds.length > 0) {
      const { data: cvParsingData } = await supabaseServer
        .from('cv_parsing')
        .select('id, name, location, qualification, experience, redacted_cv_url')
        .in('id', parsingIds)
      
      if (cvParsingData) {
        cvParsingData.forEach(c => {
          cvParsingMap.set(c.id, c)
        })
      }
    }

    // Transform the data with joined information
    const transformedData = conversations.map(conversation => {
      const cvData = cvParsingMap.get(conversation.parsing_id)
      return {
        conversation_id: conversation.conversation_id,
        // TL Info
        tl_name: tlUsersMap.get(conversation.sent_to_tl) || 'Unknown',
        crm_sent_date: conversation.crm_sent_date ? new Date(conversation.crm_sent_date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '-',
        // Req Info
        job_title: reqsMap.get(conversation.req_id) || '-',
        // TL Evaluation
        cv_status: conversation.cv_status || '',
        tl_remarks: conversation.tl_remarks || '',
        // CTC
        curr_ctc: conversation.curr_ctc || '-',
        exp_ctc: conversation.exp_ctc || '-',
        // Relevant Experience
        relevant_exp: conversation.relevant_exp || '-',
        // Candidate Info from cv_parsing
        candidate_name: cvData?.name || '-',
        candidate_location: cvData?.location || '-',
        candidate_qualification: cvData?.qualification || '-',
        candidate_experience: cvData?.experience !== undefined && cvData?.experience !== null ? cvData.experience : '-',
        redacted_cv_url: cvData?.redacted_cv_url || ''
      }
    })

    return NextResponse.json({
      success: true,
      data: transformedData
    })

  } catch (error) {
    console.error('CRM Tracker API error:', error)
    return NextResponse.json({
      error: 'Internal server error',
      details: error.message
    }, { status: 500 })
  }
}