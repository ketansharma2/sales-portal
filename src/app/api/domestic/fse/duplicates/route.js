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

    // Get all clients for this user
    const { data: clients, error: clientsError } = await supabaseServer
      .from('domestic_clients')
      .select('client_id, company_name, user_id, sourcing_date')
      .eq('user_id', user.id)

    if (clientsError) {
      console.error('Clients fetch error:', clientsError)
      return NextResponse.json({ error: 'Failed to fetch clients' }, { status: 500 })
    }

    // Group clients by lowercase company_name to find duplicates
    const companyGroups = {}
    clients?.forEach(client => {
      const lowerCompanyName = client.company_name?.toLowerCase().trim() || ''
      if (lowerCompanyName) {
        if (!companyGroups[lowerCompanyName]) {
          companyGroups[lowerCompanyName] = []
        }
        companyGroups[lowerCompanyName].push({
          client_id: client.client_id,
          company_name: client.company_name,
          sourcing_date: client.sourcing_date
        })
      }
    })

    // Filter to only groups with duplicates (more than 1 entry)
    const duplicates = Object.values(companyGroups)
      .filter(group => group.length > 1)
      .flat()

    // Count total duplicates
    const duplicateCount = duplicates.length

    return NextResponse.json({
      success: true,
      data: {
        count: duplicateCount,
        duplicates: duplicates
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
