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

    // Get date range from query params
    const { searchParams } = new URL(request.url)
    const fromDate = searchParams.get('fromDate')
    const toDate = searchParams.get('toDate')

    // Build query for conversations
    let query = supabaseServer
      .from('domestic_crm_conversation')
      .select('conversation_id, branch_id, date, mode, contact_name, discussion')
      .eq('user_id', user.id)

    // Apply date filters if provided
    if (fromDate) {
      query = query.gte('date', fromDate)
    }
    if (toDate) {
      query = query.lte('date', toDate)
    }

    // Order by date descending
    query = query.order('date', { ascending: false })

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

    // Get unique branch_ids
    const branchIds = [...new Set(conversations.map(c => c.branch_id))]

    // Fetch branches to get client_ids
    const { data: branches, error: branchesError } = await supabaseServer
      .from('domestic_crm_branch')
      .select('branch_id, client_id')
      .in('branch_id', branchIds)

    if (branchesError) {
      console.error('Fetch branches error:', branchesError)
      return NextResponse.json({
        error: 'Failed to fetch branches',
        details: branchesError.message
      }, { status: 500 })
    }

    // Create a map of branch_id to client_id
    const branchToClientMap = {}
    branches?.forEach(branch => {
      branchToClientMap[branch.branch_id] = branch.client_id
    })

    // Get unique client_ids
    const clientIds = [...new Set(Object.values(branchToClientMap))]

    // Fetch clients to get company names
    const { data: clients, error: clientsError } = await supabaseServer
      .from('domestic_crm_clients')
      .select('client_id, company_name')
      .in('client_id', clientIds)

    if (clientsError) {
      console.error('Fetch clients error:', clientsError)
      return NextResponse.json({
        error: 'Failed to fetch clients',
        details: clientsError.message
      }, { status: 500 })
    }

    // Create a map of client_id to company_name
    const clientToCompanyMap = {}
    clients?.forEach(client => {
      clientToCompanyMap[client.client_id] = client.company_name
    })

    // Get unique branch_ids for contacts lookup
    const branchIdsForContacts = [...new Set(conversations.map(c => c.branch_id))]

    // Fetch contacts to get email and phone
    const { data: contacts, error: contactsError } = await supabaseServer
      .from('domestic_crm_contacts')
      .select('branch_id, name, email, phone')
      .in('branch_id', branchIdsForContacts)

    if (contactsError) {
      console.error('Fetch contacts error:', contactsError)
      return NextResponse.json({
        error: 'Failed to fetch contacts',
        details: contactsError.message
      }, { status: 500 })
    }

    // Create a map of branch_id + contact_name to email and phone
    const contactInfoMap = {}
    contacts?.forEach(contact => {
      const key = `${contact.branch_id}_${contact.name}`
      contactInfoMap[key] = {
        email: contact.email || 'N/A',
        phone: contact.phone || 'N/A'
      }
    })

    // Combine the data
    const conversationData = conversations.map(conversation => {
      const clientId = branchToClientMap[conversation.branch_id]
      const companyName = clientToCompanyMap[clientId] || 'N/A'
      const contactKey = `${conversation.branch_id}_${conversation.contact_name}`
      const contactInfo = contactInfoMap[contactKey] || { email: 'N/A', phone: 'N/A' }
      
      return {
        conversation_id: conversation.conversation_id,
        date: conversation.date,
        mode: conversation.mode || 'N/A',
        company_name: companyName,
        contact_name: conversation.contact_name || 'N/A',
        email: contactInfo.email,
        phone: contactInfo.phone,
        discussion: conversation.discussion || 'No discussion'
      }
    })

    return NextResponse.json({
      success: true,
      data: conversationData
    })

  } catch (error) {
    console.error('CRM conversations API error:', error)
    return NextResponse.json({
      error: 'Internal server error',
      details: error.message
    }, { status: 500 })
  }
}
