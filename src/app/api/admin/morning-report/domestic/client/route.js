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

    // Get client_id from query parameters
    const { searchParams } = new URL(request.url)
    const clientId = searchParams.get('client_id')

    if (!clientId) {
      return NextResponse.json({ error: 'client_id is required' }, { status: 400 })
    }

    // Fetch client details from domestic_clients table
    const { data: clientData, error: clientError } = await supabaseServer
      .from('domestic_clients')
      .select('*')
      .eq('client_id', clientId)
      .single()

    if (clientError) {
      console.error('Client fetch error:', clientError)
      return NextResponse.json({ error: 'Failed to fetch client details' }, { status: 500 })
    }

    if (!clientData) {
      return NextResponse.json({ error: 'Client not found' }, { status: 404 })
    }

    // Fetch all interactions for this client from domestic_clients_interaction table
    const { data: interactionsData, error: interactionsError } = await supabaseServer
      .from('domestic_clients_interaction')
      .select('*')
      .eq('client_id', clientId)
      .order('created_at', { ascending: false })

    if (interactionsError) {
      console.error('Interactions fetch error:', interactionsError)
      // Don't fail the whole request, just return empty interactions
    }

    // Get current status from the most recent interaction (first one after sorting by created_at desc)
    const currentStatus = interactionsData && interactionsData.length > 0 ? interactionsData[0].status : null
    const currentSubStatus = interactionsData && interactionsData.length > 0 ? interactionsData[0].sub_status : null

    // Get user names for all interactions (to show owner)
    const ownerIds = [...new Set(interactionsData?.map(int => int.user_id).filter(Boolean) || [])]
    let userNamesMap = new Map()
    
    if (ownerIds.length > 0) {
      const { data: usersData } = await supabaseServer
        .from('users')
        .select('user_id, name')
        .in('user_id', ownerIds)
      
      usersData?.forEach(user => {
        userNamesMap.set(user.user_id, user.name)
      })
    }

    // Process interactions with owner names
    const processedInteractions = interactionsData?.map(interaction => ({
      ...interaction,
      owner_name: userNamesMap.get(interaction.user_id) || interaction.user_id || 'Unknown'
    })) || []

    return NextResponse.json({
      success: true,
      data: {
        client: clientData,
        interactions: processedInteractions,
        current_status: currentStatus,
        current_sub_status: currentSubStatus
      }
    })

  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({
      error: 'Internal server error',
      details: error.message
    }, { status: 500 })
  }
}
