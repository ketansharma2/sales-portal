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

    const { searchParams } = new URL(request.url)
    const revenueId = searchParams.get('revenue_id')

    if (!revenueId) {
      return NextResponse.json({ error: 'revenue_id is required' }, { status: 400 })
    }

    // Fetch revenue record by ID
    const { data: revenue, error } = await supabaseServer
      .from('corporate_revenue')
      .select('*')
      .eq('revenue_id', revenueId)
      .single()

    if (error) {
      console.error('Fetch revenue detail error:', error)
      return NextResponse.json({ error: 'Failed to fetch revenue record' }, { status: 500 })
    }

    if (!revenue) {
      return NextResponse.json({ error: 'Revenue record not found' }, { status: 404 })
    }

    // Fetch CRM name from users table
    let crmName = 'Unknown'
    if (revenue.user_id) {
      const { data: userData, error: userError } = await supabaseServer
        .from('users')
        .select('name')
        .eq('user_id', revenue.user_id)
        .single()

      if (!userError && userData) {
        crmName = userData.name
      }
    }

    // Transform to include crm_name
    const result = {
      ...revenue,
      crm_name: crmName
    }

    return NextResponse.json({
      success: true,
      data: result
    })

  } catch (error) {
    console.error('Revenue detail API error:', error)
    return NextResponse.json({
      error: 'Internal server error',
      details: error.message
    }, { status: 500 })
  }
}
