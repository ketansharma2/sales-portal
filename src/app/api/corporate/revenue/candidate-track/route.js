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

    const { searchParams } = new URL(request.url)
    const revenue_id = searchParams.get('revenue_id')
    const date = searchParams.get('date') // optional

    if (!revenue_id) {
      return NextResponse.json({ error: 'Missing required field: revenue_id' }, { status: 400 })
    }

    // Note: Not verifying revenue record exists to match the pattern of other track routes
    // If validation is needed, it should be handled at a higher level or the query will return empty results

    // Build query for candidate tracking logs
    let query = supabaseServer
      .from('corporate_candidate_track')
      .select('*')
      .eq('revenue_id', revenue_id)
      .order('created_at', { ascending: false })

    // If date is provided, filter by date (assuming we want logs for a specific date)
    // Note: This depends on how you want to use the date parameter
    // For now, we'll ignore date filtering in the query and handle it client-side if needed
    // Uncomment and adjust if needed:
    // if (date) {
    //   const startDate = new Date(date)
    //   startDate.setHours(0, 0, 0, 0)
    //   const endDate = new Date(date)
    //   endDate.setHours(23, 59, 59, 999)
    //   query = query.gte('created_at', startDate.toISOString())
    //                 .lt('created_at', endDate.toISOString())
    // }

    const { data: tracks, error: tracksError } = await query

    if (tracksError) {
      console.error('Fetch candidate track error:', tracksError)
      return NextResponse.json({ error: 'Failed to fetch candidate tracking logs' }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      data: tracks || []
    })

  } catch (error) {
    console.error('Candidate track GET API error:', error)
    return NextResponse.json({
      error: 'Internal server error',
      details: error.message
    }, { status: 500 })
  }
}

// Optional: POST method to create a new tracking log
export async function POST(request) {
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

    const body = await request.json()
    const {
      revenue_id,
      date, // followup date
      next_follow_up,
      candidate_status,
      remarks
    } = body

    // Validate required fields
    if (!revenue_id || !date) {
      return NextResponse.json({ 
        error: 'Missing required fields',
        details: 'revenue_id and date are required'
      }, { status: 400 })
    }

    // Verify revenue exists
    const { data: revenue, error: revenueError } = await supabaseServer
      .from('corporate_revenue')
      .select('revenue_id')
      .eq('revenue_id', revenue_id)
      .single()

    if (revenueError || !revenue) {
      return NextResponse.json({ error: 'Revenue record not found' }, { status: 404 })
    }

    // Note: Not checking user ownership here to match the pattern of other track routes
    // If authorization is needed, it should be handled at a higher level or based on business rules

    // Insert tracking log
    const insertData = {
      revenue_id,
      user_id: user.id,
      date,
      next_follow_up: next_follow_up || null,
      candidate_status: candidate_status || null,
      remarks: remarks || null,
      created_at: new Date().toISOString()
    }

    const { data: track, error: insertError } = await supabaseServer
      .from('corporate_candidate_track')
      .insert(insertData)
      .select()
      .single()

    if (insertError) {
      console.error('Insert candidate track error:', insertError)
      return NextResponse.json({ 
        error: 'Failed to save candidate tracking log',
        details: insertError.message
      }, { status: 500 })
    }

    // Optionally, update the revenue record's candidate_history or latest followup
    // This is commented out as it might be handled elsewhere or not needed
    /*
    try {
      const { data: currentRev, error: revError } = await supabaseServer
        .from('corporate_revenue')
        .select('candidate_history')
        .eq('id', revenue_id)
        .single()
      
      if (!revError && currentRev) {
        const newLog = {
          ...track,
          followup_date: date,
          next_followup_date: next_follow_up || '',
          conversation: remarks || '',
          candidate_status: candidate_status || '',
          loggedBy: user.user_metadata?.full_name || user.email || 'Unknown'
        }
        
        const updatedHistory = [newLog, ...(currentRev.candidate_history || [])]
        
        await supabaseServer
          .from('corporate_revenue')
          .update({ candidate_history: updatedHistory })
          .eq('id', revenue_id)
      }
    } catch (err) {
      console.error('Failed to update revenue candidate_history:', err)
      // Continue anyway
    }
    */

    return NextResponse.json({
      success: true,
      data: { ...track, ...insertData }
    }, { status: 201 })

  } catch (error) {
    console.error('Candidate track POST API error:', error)
    return NextResponse.json({
      error: 'Internal server error',
      details: error.message
    }, { status: 500 })
  }
}