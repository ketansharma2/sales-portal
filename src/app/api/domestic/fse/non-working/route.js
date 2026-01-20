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

    // Get request body
    const body = await request.json()
    const { date, reason } = body

    // Validate required fields
    if (!date || !reason) {
      return NextResponse.json({
        error: 'Missing required fields',
        details: 'date and reason are required'
      }, { status: 400 })
    }

    // Insert into domestic_non_working table
    const { data, error } = await supabaseServer
      .from('domestic_non_working')
      .insert({
        user_id: user.id,
        date: date,
        reason: reason
      })
      .select()

    if (error) {
      return NextResponse.json({
        error: 'Failed to create non-working entry',
        details: error.message
      }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      data: data[0]
    })

  } catch (error) {
    console.error('Non-working API error:', error)
    return NextResponse.json({
      error: 'Internal server error',
      details: error.message
    }, { status: 500 })
  }
}