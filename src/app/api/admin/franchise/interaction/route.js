import { supabaseServer } from '@/lib/supabase-server'
import { NextResponse } from 'next/server'
import { getUser } from '@/lib/auth-helper'

export async function GET(request) {
  try {
    // Authentication - user injected by middleware (no auth calls needed!)
    const { user, error: authError } = getUser(request);
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // =====================================================
    // 🔍 PARAMS
    // =====================================================
    const { searchParams } = new URL(request.url)
    const clientId = searchParams.get('client_id')

    if (!clientId) {
      return NextResponse.json(
        { error: 'client_id parameter is required' },
        { status: 400 }
      )
    }

    // =====================================================
    // 📥 FETCH INTERACTIONS FOR SPECIFIC CLIENT
    // =====================================================
    const { data: interactionsData, error: interactionsError } =
      await supabaseServer
        .from('corporate_leads_interaction')
        .select(`
          id,
          client_id,
          leadgen_id,
          date,
          status,
          sub_status,
          remarks,
          next_follow_up,
          contact_person,
          contact_no,
          email,
          franchise_status,
          created_at
        `)
        .eq('client_id', clientId)
        .order('created_at', { ascending: false }) // Most recent first

    if (interactionsError) {
      console.error("INTERACTIONS ERROR:", JSON.stringify(interactionsError, null, 2))
      return NextResponse.json(
        { error: 'Failed to fetch interactions', details: interactionsError.message },
        { status: 500 }
      )
    }

    // Return success response
    return NextResponse.json({
      success: true,
      data: interactionsData || []
    })

  } catch (error) {
    console.error('API ERROR:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    )
  }
}