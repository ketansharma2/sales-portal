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

    // Check if user has MANAGER role
    const { data: userProfile, error: profileError } = await supabaseServer
      .from('users')
      .select('role')
      .eq('user_id', user.id)
      .single()

    if (profileError || !userProfile) {
      return NextResponse.json({ error: 'User profile not found' }, { status: 404 })
    }

    if (!userProfile.role || !userProfile.role.includes('MANAGER')) {
      return NextResponse.json({ error: 'Access denied. Manager role required.' }, { status: 403 })
    }

    // Get query parameters
    const { searchParams } = new URL(request.url)
    const fseId = searchParams.get('fse_id')

    // Get all FSEs under this manager
    let fseUserIds = []
    
    if (fseId) {
      // If specific FSE is requested, use only that FSE
      fseUserIds = [fseId]
    } else {
      // Otherwise get all FSEs under this manager
      const { data: fseList, error: fseError } = await supabaseServer
        .from('users')
        .select('user_id')
        .contains('role', ['FSE'])
        .eq('manager_id', user.id)

      if (fseError) {
        console.error('FSE list fetch error:', fseError)
        return NextResponse.json({ error: 'Failed to fetch FSE team' }, { status: 500 })
      }

      fseUserIds = fseList?.map(fse => fse.user_id) || []
    }

    if (fseUserIds.length === 0) {
      return NextResponse.json({
        success: true,
        onboarded_count: 0
      })
    }

    // Fetch all interactions for these FSEs
    let allInteractions = []
    let offset = 0
    const batchSize = 1000

    while (true) {
      let query = supabaseServer
        .from('domestic_clients_interaction')
        .select('client_id, status, contact_date, created_at')
        .in('user_id', fseUserIds)
        .order('client_id', { ascending: true })
        .order('contact_date', { ascending: false })
        .order('created_at', { ascending: false })
        .range(offset, offset + batchSize - 1)

      const { data, error } = await query

      if (error) {
        console.error('Interactions fetch error:', error)
        break
      }

      if (data.length === 0) break

      allInteractions.push(...data)
      offset += batchSize

      if (data.length < batchSize) break
    }

    // Process to get latest status per client
    const latestClientStatus = new Map()
    allInteractions?.forEach(interaction => {
      const clientId = interaction.client_id
      if (!latestClientStatus.has(clientId)) {
        latestClientStatus.set(clientId, interaction.status)
      }
    })

    // Count clients with latest status = "Onboarded"
    const onboardedCount = Array.from(latestClientStatus.values())
      .filter(status => status === 'Onboarded')
      .length

    return NextResponse.json({
      success: true,
      onboarded_count: onboardedCount
    })

  } catch (error) {
    console.error('Onboarded count API error:', error)
    return NextResponse.json({
      error: 'Internal server error',
      details: error.message
    }, { status: 500 })
  }
}