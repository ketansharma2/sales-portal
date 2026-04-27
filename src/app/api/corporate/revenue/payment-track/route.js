import { supabaseServer } from '@/lib/supabase-server'
import { NextResponse } from 'next/server'

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

    const currentUserId = user.user_id || user.id
    const body = await request.json()
    const { revenue_id, date, amount_received, payment_status, remarks } = body

    if (!revenue_id || !date) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Verify revenue exists
    const { data: revenue, error: revError } = await supabaseServer
      .from('corporate_revenue')
      .select('revenue_id')
      .eq('revenue_id', revenue_id)
      .single()

    if (revError || !revenue) {
      return NextResponse.json({ error: 'Revenue record not found' }, { status: 404 })
    }

    const { data: track, error: insertError } = await supabaseServer
      .from('corporate_payment_track')
      .insert({
        revenue_id,
        user_id: currentUserId,
        date,
        amount_received: amount_received || null,
        payment_status: payment_status || null,
        remarks: remarks || null,
        created_at: new Date().toISOString()
      })
      .select()
      .single()

    if (insertError) {
      return NextResponse.json({ error: 'Failed to save payment log' }, { status: 500 })
    }

     return NextResponse.json({ success: true, data: track })

   } catch (error) {
     return NextResponse.json({ error: 'Internal server error', details: error.message }, { status: 500 })
   }
 }

 // GET: Fetch payment track records for a revenue
 export async function GET(request) {
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

     const { searchParams } = new URL(request.url)
     const revenueId = searchParams.get('revenue_id')

     if (!revenueId) {
       return NextResponse.json({ error: 'revenue_id is required' }, { status: 400 })
     }

     const { data: tracks, error: fetchError } = await supabaseServer
       .from('corporate_payment_track')
       .select('*')
       .eq('revenue_id', revenueId)
       .order('date', { ascending: false })

     if (fetchError) {
       return NextResponse.json({ error: 'Failed to fetch payment track data' }, { status: 500 })
     }

     // Get user names for loggedBy
     const userIds = [...new Set((tracks || []).map(t => t.user_id).filter(Boolean))]
     let userMap = {}
     if (userIds.length > 0) {
       const { data: users } = await supabaseServer
         .from('users')
         .select('user_id, name')
         .in('user_id', userIds)
       if (users) {
         users.forEach(u => { userMap[u.user_id] = u.name })
       }
     }

     const transformedTracks = (tracks || []).map(track => ({
       ...track,
       loggedBy: userMap[track.user_id] || 'Unknown'
     }))

     return NextResponse.json({ success: true, data: transformedTracks })

   } catch (error) {
     return NextResponse.json({ error: 'Internal server error', details: error.message }, { status: 500 })
   }
 }
