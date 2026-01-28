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

    // Fetch CRM users in Domestic sector
    const { data: crmUsers, error: crmError } = await supabaseServer
      .from('users')
      .select('user_id, name, email, role, sector')
      .contains('role', ['CRM'])
      .eq('sector', 'Domestic')
      .order('name', { ascending: true })

    if (crmError) {
      console.error('Fetch CRM users error:', crmError)
      return NextResponse.json({
        error: 'Failed to fetch CRM users',
        details: crmError.message
      }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      data: crmUsers || [],
      count: crmUsers?.length || 0
    })

  } catch (error) {
    console.error('CRM users API error:', error)
    return NextResponse.json({
      error: 'Internal server error',
      details: error.message
    }, { status: 500 })
  }
}