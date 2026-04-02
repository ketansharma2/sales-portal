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

    // Get today's date
    const today = new Date().toISOString().split('T')[0]

    // Step 1: Get the latest past date (not today)
    const { data: latestDateData } = await supabaseServer
      .from('domestic_crm_conversation')
      .select('date')
      .neq('date', today)
      .order('date', { ascending: false })
      .limit(1)

    // Handle case when no data exists
    let latestDateStr = null
    if (latestDateData && latestDateData.length > 0) {
      latestDateStr = latestDateData[0].date
    }

    if (!latestDateStr) {
      return NextResponse.json({
        success: true,
        data: {
          conversations: [],
          latestDate: null
        }
      })
    }

    // Step 2: Get conversations for the latest date
    const { data: conversations, error: conversationsError } = await supabaseServer
      .from('domestic_crm_conversation')
      .select('*')
      .eq('date', latestDateStr)
      .order('created_at', { ascending: false })

    if (conversationsError) {
      console.error('Error fetching conversations:', conversationsError)
      return NextResponse.json({ error: conversationsError.message }, { status: 500 })
    }

    // Step 3: Get unique user_ids and branch_ids for additional queries
    const userIds = [...new Set((conversations || []).map(c => c.user_id).filter(Boolean))]
    const branchIds = [...new Set((conversations || []).map(c => c.branch_id).filter(Boolean))]
    const contactNames = [...new Set((conversations || []).map(c => c.contact_name).filter(Boolean))]

    // Get user names
    let userNamesMap = new Map()
    if (userIds.length > 0) {
      const { data: usersData } = await supabaseServer
        .from('users')
        .select('user_id, name')
        .in('user_id', userIds)
      
      usersData?.forEach(u => {
        userNamesMap.set(u.user_id, u.name)
      })
    }

    // Get branch/company info using domestic_crm_branch table
    // First get branch to client mapping, then get company names
    let branchInfoMap = new Map()
    if (branchIds.length > 0) {
      // Step 1: Get branch -> client mapping
      const { data: branchesData } = await supabaseServer
        .from('domestic_crm_branch')
        .select('branch_id, client_id')
        .in('branch_id', branchIds)
      
      // Build branch to client map
      const branchToClientMap = new Map()
      const clientIds = []
      branchesData?.forEach(b => {
        if (b.client_id) {
          branchToClientMap.set(b.branch_id, b.client_id)
          clientIds.push(b.client_id)
        }
      })
      
      // Step 2: Get client_id -> company_name mapping
      let clientToCompanyMap = new Map()
      if (clientIds.length > 0) {
        const uniqueClientIds = [...new Set(clientIds)]
        const { data: clientsData } = await supabaseServer
          .from('domestic_crm_clients')
          .select('client_id, company_name')
          .in('client_id', uniqueClientIds)
        
        clientsData?.forEach(c => {
          clientToCompanyMap.set(c.client_id, c.company_name)
        })
      }
      
      // Step 3: Build final branch info map
      branchIds.forEach(branchId => {
        const clientId = branchToClientMap.get(branchId)
        branchInfoMap.set(branchId, {
          client_id: clientId || '',
          company: clientId ? (clientToCompanyMap.get(clientId) || '') : '',
          branch_name: ''
        })
      })
    }

    // Get contact info from domestic_crm_contacts using contact_name
    let contactInfoMap = new Map()
    if (contactNames.length > 0) {
      const { data: contactsData } = await supabaseServer
        .from('domestic_crm_contacts')
        .select('name, designation')
        .in('name', contactNames)
      
      contactsData?.forEach(c => {
        contactInfoMap.set(c.name, { designation: c.designation || '' })
      })
    }

    // Step 4: Format the conversations with all joined data
    const formattedConversations = (conversations || []).map(conversation => {
      const branchInfo = branchInfoMap.get(conversation.branch_id) || {}
      const contactInfo = contactInfoMap.get(conversation.contact_name) || {}
      
      return {
        conversation_id: conversation.conversation_id,
        date: conversation.date,
        mode: conversation.mode,
        contact_name: conversation.contact_name,
        discussion: conversation.discussion,
        user_id: conversation.user_id,
        user_name: userNamesMap.get(conversation.user_id) || conversation.user_id || 'Unknown',
        branch_id: conversation.branch_id,
        company_name: branchInfo.company || '',
        branch_name: branchInfo.branch_name || '',
        client_id: branchInfo.client_id || '',
        designation: contactInfo.designation || ''
      }
    })

    return NextResponse.json({
      success: true,
      data: {
        conversations: formattedConversations,
        latestDate: latestDateStr,
        latestDateFormatted: latestDateStr ? new Date(latestDateStr).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' }) : null
      }
    })

  } catch (error) {
    console.error('CRM Conversation Log API error:', error)
    return NextResponse.json({ 
      error: error.message || 'Internal server error' 
    }, { status: 500 })
  }
}