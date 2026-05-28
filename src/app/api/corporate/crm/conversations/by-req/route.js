import { supabaseServer } from '@/lib/supabase-server'
import { NextResponse } from 'next/server'

export async function GET(request) {
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

    const currentUserId = user.user_id || user.id
    const { searchParams } = new URL(request.url)
    const req_id = searchParams.get('req_id')

    if (!req_id) {
      return NextResponse.json({ error: 'req_id is required' }, { status: 400 })
    }

    let query2 = supabaseServer
      .from('corporate_crm_jobpost')
      .select('*')
      .eq('req_id', req_id)
      .order('created_at', { ascending: false })

    const { data: jobPost, error: jobPostError } = await query2
   const jobProfile = jobPost && jobPost[0]?.profile || null
    let query = supabaseServer
      .from('candidates_conversation')
      .select('*')
      .eq('req_id', jobPost[0]?.id)
      .order('created_at', { ascending: false })
      

    const { data: conversations, error: conversationsError } = await query

    if (conversationsError) {
      console.error('Fetch conversations error:', conversationsError)
      return NextResponse.json({
        error: 'Failed to fetch conversations',
        details: conversationsError.message
      }, { status: 500 })
    }

    if (!conversations || conversations.length === 0) {
      return NextResponse.json({
        success: true,
        data: []
      })
    }

    const latestConversationPerCandidate = new Map()
    
    conversations.forEach(conversation => {
      const candidateId = conversation.parsing_id
      if (!candidateId) return
      
      // If this candidate is not in map, or this conversation is newer
      if (!latestConversationPerCandidate.has(candidateId) || 
          new Date(conversation.created_at) > new Date(latestConversationPerCandidate.get(candidateId).created_at)) {
        latestConversationPerCandidate.set(candidateId, conversation)
      }
    })
    
    // Get unique latest conversations
    const latestConversations = Array.from(latestConversationPerCandidate.values())
  

    const parsingIds = [...new Set(conversations.map(c => c.parsing_id).filter(Boolean))]
    const userIds = [...new Set(conversations.map(c => c.user_id).filter(Boolean))]

    let cvParsingData = []
    if (parsingIds.length > 0) {
      const { data: parsingData } = await supabaseServer
        .from('cv_parsing')
        .select('*')
        .in('id', parsingIds)
      cvParsingData = parsingData || []
    }

    let usersData = []
    if (userIds.length > 0) {
      const { data: userData } = await supabaseServer
        .from('users')
        .select('user_id, name, email')
        .in('user_id', userIds)
      usersData = userData || []
    }

    const cvParsingMap = new Map(cvParsingData.map(cv => [cv.id, cv]))
    const usersMap = new Map(usersData.map(u => [u.user_id, u]))

    const transformedData = latestConversations.map(conversation => {
      const cvData = cvParsingMap.get(conversation.parsing_id)
      const user = usersMap.get(conversation.user_id)

      return {
        conversation_id: conversation.conversation_id,
        req_id: conversation.req_id,
        parsing_id: conversation.parsing_id,
        user_id: conversation.user_id,
        sent_to_tl: conversation.sent_to_tl,
        sent_to_crm: conversation.sent_to_crm,
        candidate_status: conversation.candidate_status,
        remarks: conversation.remarks,
        relevant_exp: conversation.relevant_exp,
        curr_ctc: conversation.curr_ctc,
        exp_ctc: conversation.exp_ctc,
        tl_remarks: conversation.tl_remarks,
        cv_status: conversation.cv_status,
        sent_date: conversation.sent_date,
        crm_sent_date: conversation.crm_sent_date,
        call_respond: conversation.call_respond,
        post_id: conversation.post_id,
        apply_date: conversation.apply_date,
        calling_date: conversation.calling_date,
        slot: conversation.slot,
        created_at: conversation.created_at,
        name: cvData?.name || null,
        email: cvData?.email || null,
        mobile: cvData?.mobile || null,
        location: cvData?.location || null,
        gender: cvData?.gender || null,
        qualification: cvData?.qualification || null,
        experience: cvData?.experience || null,
        company_names_all: cvData?.company_names_all || null,
        designation: jobProfile|| null,
        top_skills: cvData?.top_skills || null,
        college_name: cvData?.college_name || null,
        skills_all: cvData?.skills_all || null,
        recent_company: cvData?.recent_company || null,
        portal: cvData?.portal || null,
        portal_date: cvData?.portal_date || null,
        cv_url: cvData?.cv_url || null,
        redacted_cv_url: cvData?.redacted_cv_url || null,
        rc_name: user?.name || null,
        rc_email: user?.email || null
      }
    })

    return NextResponse.json({
      success: true,
      data: transformedData
    })

  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({
      error: 'Internal server error',
      details: error.message
    }, { status: 500 })
  }
}
