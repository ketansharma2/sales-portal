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

    // Get date from query params or default to today
    const { searchParams } = new URL(request.url)
    const dateParam = searchParams.get('date')
    const targetDate = dateParam || new Date().toISOString().split('T')[0]

    // Step 1: Fetch conversations with next_follow_up = target date
    const { data: conversations, error: conversationsError } = await supabaseServer
      .from('corporate_crm_conversation')
      .select('contact_name, discussion, branch_id')
      .eq('user_id', user.id)
      .eq('next_follow_up', targetDate)

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

    // Step 2: Get unique branch_ids
    const branchIds = [...new Set(conversations.map(c => c.branch_id))]

    // Step 3: Fetch branches to get client_ids
    const { data: branches, error: branchesError } = await supabaseServer
      .from('corporate_crm_branch')
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

    // Step 4: Get unique client_ids
    const clientIds = [...new Set(Object.values(branchToClientMap))]

    // Step 5: Fetch clients to get company names
    const { data: clients, error: clientsError } = await supabaseServer
      .from('corporate_crm_clients')
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

    // Step 6: Combine the data
    const followUps = conversations.map(conversation => {
      const clientId = branchToClientMap[conversation.branch_id]
      const companyName = clientToCompanyMap[clientId] || 'N/A'
      
      return {
        company_name: companyName,
        contact_name: conversation.contact_name || 'N/A',
        discussion: conversation.discussion || 'No discussion'
      }
    })

    return NextResponse.json({
      success: true,
      data: followUps
    })

  } catch (error) {
    console.error('CRM today followups API error:', error)
    return NextResponse.json({
      error: 'Internal server error',
      details: error.message
    }, { status: 500 })
  }
}
