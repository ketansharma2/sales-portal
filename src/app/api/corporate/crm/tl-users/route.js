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

    // Fetch users where role array contains 'TL' AND sector = 'Corporate'
    const { data: users, error: fetchError } = await supabaseServer
      .from('users')
      .select('user_id, name')
      .contains('role', ['TL'])
      .eq('sector', 'Corporate')
      .order('name', { ascending: true })

    if (fetchError) {
      console.error('Fetch TL users error:', fetchError)
      return NextResponse.json({
        error: 'Failed to fetch TL users',
        details: fetchError.message
      }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      data: users || []
    })

  } catch (error) {
    console.error('Fetch TL users API error:', error)
    return NextResponse.json({
      error: 'Internal server error',
      details: error.message
    }, { status: 500 })
  }
}
