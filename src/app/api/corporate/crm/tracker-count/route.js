import { supabaseServer } from '@/lib/supabase-server';
import { NextResponse } from 'next/server';

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
const { searchParams } = new URL(request.url);
const branchId = searchParams.get('branch_id');
// Get the specific client
const { data: client, error: clientError } = await supabaseServer
.from('corporate_crm_clients')
.select('*')
.eq('client_id', branchId)
.eq('user_id', currentUserId)
.single()

if (clientError || !client) {
console.error('Fetch corporate CRM client error:', clientError)
return NextResponse.json({
error: 'Failed to fetch client',
details: clientError?.message || 'Client not found'
}, { status: 404 })
}

// Get emails for this client
const { data: emails, error: emailError } = await supabaseServer
.from('corporate_crm_emails')
.select('*')
.eq('client_id', branchId)
.order('created_at', { ascending: false })

if (emailError) {
console.error('Fetch corporate CRM emails error:', emailError)
return NextResponse.json({
error: 'Failed to fetch emails',
details: emailError.message
}, { status: 500 })
}

// Get email IDs
const emailIds = emails ? emails.map(e => e.id) : []

// Get interviews for these emails
const { data: interviews, error: interviewError } = await supabaseServer
.from('corporate_crm_interview')
.select('*')
.in('email_draft_id', emailIds)
.order('created_at', { ascending: false })

if (interviewError) {
console.error('Fetch corporate CRM interviews error:', interviewError)
return NextResponse.json({
error: 'Failed to fetch interviews',
details: interviewError.message
}, { status: 500 })
}

// Create a map of interviews by email_draft_id
const interviewMap = new Map()
if (interviews) {
interviews.forEach(interview => {
if (!interviewMap.has(interview.email_draft_id)) {
interviewMap.set(interview.email_draft_id, [])
}
interviewMap.get(interview.email_draft_id).push(interview)
})
}

// Aggregate counts
const clientEmails = emails || []
let sharedCount = clientEmails.length
let shortlistCount = 0
let interviewCount = 0
let selectedCount = 0
let joiningCount = 0

clientEmails.forEach(email => {
const emailInterviews = interviewMap.get(email.id) || []
emailInterviews.forEach(interview => {
const status = interview.interview_status?.toLowerCase()
const remark = interview.client_remark?.toLowerCase()

if (status === 'interviewed') {
interviewCount++
}
if (remark?.includes('shortlisted') || remark?.includes('shortlist')) {
shortlistCount++
}
if (remark?.includes('selected') || remark?.includes('hired')) {
selectedCount++
}
if (remark?.includes('joining') || remark?.includes('joined')) {
joiningCount++
}
})
})

// Collect shared dates and email IDs
const sharedDates = clientEmails.map(e => e.shared_date).filter(Boolean)
const emailIdsList = clientEmails.map(e => e.id)

const transformedData = [{
client_id: client.client_id,
created_at: client.created_at,
shared_count: sharedCount,
shortlist_count: shortlistCount,
interview_count: interviewCount,
selected_count: selectedCount,
joining_count: joiningCount,
shared_dates: sharedDates,
email_ids: emailIdsList,
emails: clientEmails.map(email => ({
...email,
interviews: interviewMap.get(email.id) || []
}))
}]

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