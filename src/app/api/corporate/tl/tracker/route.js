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

    // Get current user's ID
    const currentUserId = user.user_id || user.id

    // Fetch candidates_conversation where sent_to_tl = current user
    const { data: conversations, error: fetchError } = await supabaseServer
      .from('candidates_conversation')
      .select('*')
      .eq('sent_to_tl', currentUserId)
      .order('sent_date', { ascending: false })

    if (fetchError) {
      console.error('Fetch tracker conversations error:', fetchError)
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

    // Extract unique user_ids and parsing_ids for joining
    const userIds = [...new Set(conversations.map(c => c.user_id).filter(Boolean))]
    const crmUserIds = [...new Set(conversations.map(c => c.sent_to_crm).filter(Boolean))]
    const parsingIds = [...new Set(conversations.map(c => c.parsing_id).filter(Boolean))]
    const reqIds = [...new Set(conversations.map(c => c.req_id).filter(Boolean))]

    // Fetch recruiter names from users table
    let usersMap = new Map()
    if (userIds.length > 0) {
      const { data: usersData } = await supabaseServer
        .from('users')
        .select('user_id, name')
        .in('user_id', userIds)
      
      if (usersData) {
        usersMap = new Map(usersData.map(u => [u.user_id, u.name]))
      }
    }

    // Fetch CRM user names
    let crmUsersMap = new Map()
    if (crmUserIds.length > 0) {
      const { data: crmUsersData } = await supabaseServer
        .from('users')
        .select('user_id, name')
        .in('user_id', crmUserIds)
      
      if (crmUsersData) {
        crmUsersMap = new Map(crmUsersData.map(u => [u.user_id, u.name]))
      }
    }

    // Fetch candidate details from cv_parsing table
    let cvParsingMap = new Map()
    if (parsingIds.length > 0) {
      const { data: cvParsingData, error: cvError } = await supabaseServer
        .from('cv_parsing')
        .select('id, name, email, mobile, location, qualification, experience, cv_url, redacted_cv_url')
        .in('id', parsingIds)
      
      console.log('CV Parsing query error:', cvError)
      
      if (cvParsingData) {
        cvParsingData.forEach(c => {
          cvParsingMap.set(c.id, c)
        })
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

    // Transform the data with joined information
    const transformedData = conversations.map(conversation => {
      const cvData = cvParsingMap.get(conversation.parsing_id)
      return {
        conversation_id: conversation.conversation_id,
        recruiter_name: usersMap.get(conversation.user_id) || 'Unknown',
        sent_date: conversation.sent_date,
        slot: conversation.slot || '',
        relevant_exp: conversation.relevant_exp,
        curr_ctc: conversation.curr_ctc,
        exp_ctc: conversation.exp_ctc,
        remarks: conversation.remarks || '',
        // Candidate details from cv_parsing
        candidate_name: cvData?.name || '',
        candidate_email: cvData?.email || '',
        candidate_phone: cvData?.mobile || '',
        candidate_location: cvData?.location || '',
        candidate_qualification: cvData?.qualification || '',
        candidate_experience: cvData?.experience !== undefined && cvData?.experience !== null ? cvData.experience : '-',
        cv_url: cvData?.cv_url || '',
        cv_parsing_id: cvData?.id || '',
        redacted_cv_url: cvData?.redacted_cv_url || '',  // Added for redacted CV display
        // Job details from corporate_crm_reqs
        job_title: reqsMap.get(conversation.req_id) || '',
        // TL evaluation fields
        cv_status: conversation.cv_status || '',
        tl_remarks: conversation.tl_remarks || '',
        sent_to_crm: conversation.sent_to_crm || null,
        sent_to_crm_name: conversation.sent_to_crm ? (crmUsersMap.get(conversation.sent_to_crm) || 'Unknown') : null
      }
    })

    return NextResponse.json({
      success: true,
      data: transformedData
    })

  } catch (error) {
    console.error('TL Tracker API error:', error)
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
    const { conversation_id, cv_status, tl_remarks, sent_to_crm } = body

    if (!conversation_id) {
      return NextResponse.json({ error: 'Conversation ID is required' }, { status: 400 })
    }

    const updateData = {}
    if (cv_status !== undefined) updateData.cv_status = cv_status
    if (tl_remarks !== undefined) updateData.tl_remarks = tl_remarks
    if (sent_to_crm !== undefined) {
      updateData.sent_to_crm = sent_to_crm
      updateData.crm_sent_date = new Date().toISOString()
    }

    const { data, error } = await supabaseServer
      .from('candidates_conversation')
      .update(updateData)
      .eq('conversation_id', conversation_id)
      .select()

    if (error) {
      console.error('Update conversation error:', error)
      return NextResponse.json({
        error: 'Failed to update candidate conversation',
        details: error.message
      }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      data: data[0]
    })

  } catch (error) {
    console.error('TL Tracker PUT API error:', error)
    return NextResponse.json({
      error: 'Internal server error',
      details: error.message
    }, { status: 500 })
  }
}