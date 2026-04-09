import { supabaseServer } from '@/lib/supabase-server'
import { NextResponse } from 'next/server'

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
    const fromDate = searchParams.get('fromDate')
    const toDate = searchParams.get('toDate')
    const allDatabase = searchParams.get('allDatabase')

    let query = supabaseServer
      .from('corporate_crm_interview')
      .select('email_draft_id')
      .eq('user_id', user.id)
      .eq('interview_status', 'Interviewed')

    if (allDatabase !== 'true' && fromDate && toDate) {
      query = query.gte('date', fromDate)
      query = query.lte('date', toDate)
    }

    const { data, error: fetchError } = await query

    if (fetchError) {
      console.error('Count interviews error:', fetchError)
      return NextResponse.json({
        error: 'Failed to count interviews',
        details: fetchError.message
      }, { status: 500 })
    }

    const uniqueEmails = new Set(data.map(row => row.email_draft_id).filter(Boolean))
    const count = uniqueEmails.size

    return NextResponse.json({
      success: true,
      data: {
        totalInterviews: count || 0
      }
    })

  } catch (error) {
    console.error('CRM interviews API error:', error)
    return NextResponse.json({
      error: 'Internal server error',
      details: error.message
    }, { status: 500 })
  }
}