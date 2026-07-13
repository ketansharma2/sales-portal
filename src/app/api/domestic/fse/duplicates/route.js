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

    // Get all clients for this user
    const { data: clients, error: clientsError } = await supabaseServer
      .from('domestic_clients')
      .select('client_id, company_name, state, location, sourcing_date, user_id')
      .eq('user_id', user.id)

    if (clientsError) {
      console.error('Clients fetch error:', clientsError)
      return NextResponse.json({ error: 'Failed to fetch clients' }, { status: 500 })
    }

    // Group clients by combo key (company_name|state|location) to find duplicates
    const companyGroups = {}
    clients?.forEach(client => {
      const lowerCompanyName = client.company_name?.toLowerCase().trim() || ''
      const state = client.state?.toLowerCase().trim() || ''
      const location = client.location?.toLowerCase().trim() || ''
      const comboKey = `${lowerCompanyName}|${state}|${location}`

      if (lowerCompanyName && state && location && comboKey !== '||') {
        if (!companyGroups[comboKey]) {
          companyGroups[comboKey] = []
        }
        companyGroups[comboKey].push({
          client_id: client.client_id,
          company_name: client.company_name,
          sourcing_date: client.sourcing_date,
          state: client.state,
          location: client.location
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
