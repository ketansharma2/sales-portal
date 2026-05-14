import { supabaseServer } from '@/lib/supabase-server'
import { NextResponse } from 'next/server'

export async function GET(request, context) {
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

    const params = await context.params
const clientId = params.client_id
    const { searchParams } = new URL(request.url)
    const sector = searchParams.get('sector') // 'Corporate' or 'Domestic'

    if (!sector || !['Corporate', 'Domestic'].includes(sector)) {
      return NextResponse.json({ error: 'Invalid sector' }, { status: 400 })
    }

    const clientTable = sector === 'Corporate' ? 'corporate_crm_clients' : 'domestic_crm_clients'
    const branchTable = sector === 'Corporate' ? 'corporate_crm_branch' : 'domestic_crm_branch'
    const contactTable = sector === 'Corporate' ? 'corporate_crm_contacts' : 'domestic_crm_contacts'
    const conversationTable = sector === 'Corporate' ? 'corporate_crm_conversation' : 'domestic_crm_conversation'
    const reqTable = sector === 'Corporate' ? 'corporate_crm_reqs' : 'domestic_crm_reqs'
    const trackerTable = sector === 'Corporate' ? 'corporate_crm_emails' : 'domestic_crm_emails'
    const workbenchTable = sector === 'Corporate' ? 'corporate_workbench' : 'domestic_workbench'
    const emailTable = sector === 'Corporate' ? 'corporate_crm_emails' : 'domestic_crm_emails'
    const faqTable = sector === 'Corporate' ? 'corporate_crm_faq' : 'domestic_crm_faq'
    const interviewTable = sector === 'Corporate' ? 'corporate_crm_interview' : 'domestic_crm_interview'
    const jobpostTable = sector === 'Corporate' ? 'corporate_crm_jobpost' : 'domestic_crm_jobpost'

    // Get client info
    const { data: clientData, error: clientError } = await supabaseServer
      .from(clientTable)
      .select('*')
      .eq('client_id', clientId)
      .single()

    if (clientError || !clientData) {
      return NextResponse.json({ error: 'Client not found' }, { status: 404 })
    }

    // Get branches
    const { data: branchesData } = await supabaseServer
      .from(branchTable)
      .select('*')
      .eq('client_id', clientId)

    const branchIds = branchesData?.map(b => b.branch_id) || []

    // Get contacts for branches
    const { data: contactsData } = branchIds.length > 0 ? await supabaseServer
      .from(contactTable)
      .select('*')
      .in('branch_id', branchIds) : { data: [] }

    // Get conversations for branches
    const { data: conversationsData } = branchIds.length > 0 ? await supabaseServer
      .from(conversationTable)
      .select('*')
      .in('branch_id', branchIds)
      .order('created_at', { ascending: false }) : { data: [] }

    // Get requirements for branches
    const { data: reqsData } = branchIds.length > 0 ? await supabaseServer
      .from(reqTable)
      .select('*')
      .in('branch_id', branchIds)
      .order('created_at', { ascending: false }) : { data: [] }

    const reqIds = reqsData?.map(r => r.req_id) || []

    // Get tracker for reqs
    const { data: trackerData } = await supabaseServer
      .from(emailTable)
      .select('*')
      .in('client_id', clientId)
      .order('created_at', { ascending: false }) 
      console.log('Fetched tracker data:', trackerData, 'for clientId:', clientId, 'for table:', trackerTable) ;
    // Get workbench for client
    const { data: workbenchData } = await supabaseServer
      .from(workbenchTable)
      .select('*')
      .eq('client_id', clientId)
      .order('created_at', { ascending: false })

    // Get emails for client


// Get interview status for these emails
// Get tracker/emails for client
const { data: emailsData } = await supabaseServer
  .from(emailTable)
  .select('*')
  .eq('client_id', clientId)
  .order('created_at', { ascending: false })

// Get interview status for these emails - ordered by latest first
const emailIds = emailsData?.map(e => e.id) || []
const { data: interviewsData } = emailIds.length > 0 ? await supabaseServer
  .from(interviewTable)
  .select('email_draft_id, interview_status, created_at')
  .in('email_draft_id', emailIds)
  .order('created_at', { ascending: false }) : { data: [] }

// Create map with only the latest interview status for each email
const latestInterviewStatusMap = {}
interviewsData?.forEach(interview => {
  // Only set if not already set (first one will be the latest due to descending order)
  if (!latestInterviewStatusMap[interview.email_draft_id]) {
    latestInterviewStatusMap[interview.email_draft_id] = interview.interview_status
  }
})

// Merge latest interview status into emails (only latest status, no history)
const emailsWithStatus = emailsData?.map(email => ({
  ...email,
  interview_status: latestInterviewStatusMap[email.id] || null
})) || []


// Then use emailsWithStatus instead of emailsData in your response

    // Get faq for client
    const { data: faqData } = await supabaseServer
      .from(faqTable)
      .select('*')
      .eq('client_id', clientId)
      .order('created_at', { ascending: false })

    // Get interview for client
    const { data: interviewData } = await supabaseServer
      .from(interviewTable)
      .select('*')
      .eq('client_id', clientId)
      .order('created_at', { ascending: false })

    // Get jobpost for reqs
    const { data: jobpostData } = reqIds.length > 0 ? await supabaseServer
      .from(jobpostTable)
      .select('*')
      .in('req_id', reqIds) : { data: [] }

    // Get user names
    const userIds = [
      clientData.user_id,
      ...branchesData?.map(b => b.user_id) || [],
      ...contactsData?.map(c => c.user_id) || [],
      ...conversationsData?.map(c => c.user_id) || [],
      ...reqsData?.map(r => r.user_id) || [],
      ...workbenchData?.map(w => w.user_id) || [],
      ...emailsData?.map(e => e.user_id) || [],
      ...faqData?.map(f => f.user_id) || [],
      ...interviewData?.map(i => i.user_id) || []
    ].filter(Boolean)

    const { data: usersData } = userIds.length > 0 ? await supabaseServer
      .from('users')
      .select('user_id, name')
      .in('user_id', [...new Set(userIds)]) : { data: [] }

    const usersMap = new Map(usersData.map(u => [u.user_id, u.name]))

    // Transform data for response
    const response = {
      clientInfo: [{
        onboardDate: clientData.onboarding_date,
        companyName: clientData.company_name,
        hqLocation: `${clientData.location}, ${clientData.state}`,
        clientType: clientData.client_type,
        industry: clientData.category, // assuming category as industry
        contractLink: clientData.contract_link,
        tnc: clientData.tnc,
        kycStatus: clientData.kyc_status,
        kycDoc: clientData.kyc_doc,
        gstDetails: clientData.gst_details,
        emailSs: clientData.email_ss,
        contactPerson: clientData.contact_person,
        email: clientData.email,
        phone: clientData.phone,
        remarks: clientData.remarks,
        status: clientData.status,
        createdAt: clientData.created_at
      }],
      branches: branchesData?.map(b => ({
        ...b,
        userName: usersMap.get(b.user_id) || ''
      })) || [],
      contacts: contactsData?.map(c => ({
        ...c,
        userName: usersMap.get(c.user_id) || ''
      })) || [],
      conversations: conversationsData?.map(c => ({
        ...c,
        userName: usersMap.get(c.user_id) || ''
      })) || [],
      requirements: reqsData?.map(r => ({
        ...r,
        userName: usersMap.get(r.user_id) || ''
      })) || [],
      tracker: emailsWithStatus || [],
      workbench: workbenchData?.map(w => ({
        ...w,
        userName: usersMap.get(w.user_id) || '',
        tlName: usersMap.get(w.sent_to_tl) || '',
        rcName: usersMap.get(w.sent_to_rc) || ''
      })) || [],
      emails: emailsData?.map(e => ({
        ...e,
        userName: usersMap.get(e.user_id) || ''
      })) || [],
      faq: faqData?.map(f => ({
        ...f,
        userName: usersMap.get(f.user_id) || ''
      })) || [],
      interview: interviewData?.map(i => ({
        ...i,
        userName: usersMap.get(i.user_id) || ''
      })) || [],
      jobpost: jobpostData || []
    }

    return NextResponse.json({
      success: true,
      data: response
    })

  } catch (error) {
    console.error('Fetch CRM client details API error:', error)
    return NextResponse.json({
      error: 'Internal server error',
      details: error.message
    }, { status: 500 })
  }
}