import { supabaseServer } from '@/lib/supabase-server'
import { NextResponse } from 'next/server'
import { getUser } from '@/lib/auth-helper';

export async function GET(request) {
  try {
    // Authentication
      const { user, error: authError } = getUser(request);
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user has MANAGER role
    const { data: userProfile, error: profileError } = await supabaseServer
      .from('users')
      .select('role')
      .eq('user_id', user.id)
      .single()

    if (profileError || !userProfile) {
      return NextResponse.json({ error: 'User profile not found' }, { status: 404 })
    }

    if (!userProfile.role || (!userProfile.role.includes('MANAGER') && !userProfile.role.includes('FSE')))  {
      return NextResponse.json({ error: 'Access denied. Manager role required.' }, { status: 403 })
    }

    // Get client_id from query parameters
    const { searchParams } = new URL(request.url)
    const clientId = searchParams.get('client_id')

    if (!clientId) {
      return NextResponse.json({ error: 'Client ID is required' }, { status: 400 })
    }

    // Step 1: Get ALL branches for this client_id
    const { data: branchesData, error: branchError } = await supabaseServer
      .from('domestic_crm_branch')
      .select('*')  // Gets all branch fields
      .eq('client_id', clientId)
      console.log("branchesData:",branchesData);
    if (branchError) {
      console.error('Branch fetch error:', branchError)
      return NextResponse.json({
        error: 'Failed to fetch branch details',
        details: branchError.message
      }, { status: 500 })
    }

    // If no branches found
    if (!branchesData || branchesData.length === 0) {
      return NextResponse.json({
        success: true,
        data: {
          client_id: clientId,
          branches: [],
          all_conversations: [],
          total_branches: 0,
          total_conversations: 0
        }
      })
    }

    // Step 2: Get all branch_ids
    const branchIds = branchesData.map(branch => branch.branch_id)

    // Step 3: Fetch all conversations for all branches
    let allConversations = []
    let offset = 0
    const batchSize = 100

    while (true) {
      const { data: conversations, error: conversationsError } = await supabaseServer
        .from('domestic_crm_conversation')
        .select('*')
        .in('branch_id', branchIds)  // Use 'in' to get conversations for all branches
        .order('created_at', { ascending: false })
        .range(offset, offset + batchSize - 1)

      if (conversationsError) {
        console.error('Conversations fetch error:', conversationsError)
        return NextResponse.json({
          error: 'Failed to fetch conversations',
          details: conversationsError.message
        }, { status: 500 })
      }

      if (!conversations || conversations.length === 0) break

      allConversations.push(...conversations)
      offset += batchSize

      if (conversations.length < batchSize) break
    }

    // Step 4: Organize conversations by branch
    const conversationsByBranch = {}
    branchesData.forEach(branch => {
      conversationsByBranch[branch.branch_id] = []
    })

    allConversations.forEach(conversation => {
      if (conversationsByBranch[conversation.branch_id]) {
        conversationsByBranch[conversation.branch_id].push(conversation)
      }
    })

    // Step 5: Return the data with all branches and their conversations
    return NextResponse.json({
      success: true,
      data: {
        client_id: clientId,
        branches: branchesData.map(branch => ({
          ...branch,
          conversations: conversationsByBranch[branch.branch_id] || [],
          conversation_count: conversationsByBranch[branch.branch_id]?.length || 0
        })),
        all_conversations: allConversations,
        total_branches: branchesData.length,
        total_conversations: allConversations.length
      }
    })

  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({
      success: false,
      error: 'Internal server error',
      details: error.message
    }, { status: 500 })
  }
}