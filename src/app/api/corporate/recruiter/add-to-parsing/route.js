import { supabaseServer } from '@/lib/supabase-server'
import { NextResponse } from 'next/server'

export async function PUT(request) {
  try {
    const authHeader = request.headers.get('authorization')
    if (!authHeader) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authError } = await supabaseServer.auth.getUser(token)
    if (authError || !user) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }
    const userId = user.user_id || user.id

    const body = await request.json()
    const { candidate_id } = body

    if (!candidate_id) {
      return NextResponse.json({ error: 'candidate_id is required' }, { status: 400 })
    }

    // Get current other_users array
    const { data: existingData, error: fetchError } = await supabaseServer
      .from('cv_parsing')
      .select('other_users')
      .eq('id', candidate_id)
      .maybeSingle()

    if (fetchError) {
      console.error('Fetch error:', fetchError)
      return NextResponse.json({ error: 'Failed to fetch candidate', details: fetchError.message }, { status: 500 })
    }

    // Build new array
    let currentUsers = existingData?.other_users || []
    if (!Array.isArray(currentUsers)) {
      currentUsers = []
    }

    // Add user_id if not already present
    if (!currentUsers.includes(userId)) {
      currentUsers.push(userId)

      const { error: updateError } = await supabaseServer
        .from('cv_parsing')
        .update({ other_users: currentUsers })
        .eq('id', candidate_id)

      if (updateError) {
        console.error('Update error:', updateError)
        return NextResponse.json({ error: 'Failed to update', details: updateError.message }, { status: 500 })
      }

      return NextResponse.json({
        success: true,
        message: 'Added to your parsing data',
        other_users: currentUsers
      })
    } else {
      return NextResponse.json({
        success: true,
        message: 'Already in your parsing data',
        other_users: currentUsers
      })
    }
  } catch (error) {
    console.error('Add to parsing API error:', error)
    return NextResponse.json({ error: 'Internal server error', details: error.message }, { status: 500 })
  }
}
