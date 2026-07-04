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

    // Get query parameters
    const { searchParams } = new URL(request.url)
    const clientId = searchParams.get('client_id')

    if (!clientId) {
      return NextResponse.json({ error: 'Client ID is required' }, { status: 400 })
    }

    // Fetch interactions for the client with user name
    const { data: interactionsData, error: interactionsError } = await supabaseServer
      .from('domestic_leads_interaction')
      .select(`
        *,
        users!domestic_leads_interaction_leadgen_id_fkey (
          name
        )
      `)
      .eq('client_id', clientId)
      .order('created_at', { ascending: false })

    if (interactionsError) {
      console.error('Interactions fetch error:', interactionsError)
      return NextResponse.json({
        error: 'Failed to fetch interactions',
        details: interactionsError.message
      }, { status: 500 })
    }

    // Format the data
    const formattedInteractions = interactionsData?.map(interaction => ({
      id: interaction.id,
      date: interaction.date,
      contact_person: interaction.contact_person,
      contact_no: interaction.contact_no,
      email: interaction.email,
      remarks: interaction.remarks,
      status: interaction.status,
      sub_status: interaction.sub_status,
      next_follow_up: interaction.next_follow_up,
      created_at: interaction.created_at,
      user_name: interaction.users?.name || null
    })) || []

    return NextResponse.json({
      success: true,
      data: formattedInteractions
    })

  } catch (error) {
    console.error('Interactions GET API error:', error)
    return NextResponse.json({
      error: 'Internal server error',
      details: error.message
    }, { status: 500 })
  }
}

export async function POST(request) {
  try {
    // Authentication
      const { user, error: authError } = getUser(request);
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json()
    const { client_id, date, status, sub_status, remarks, next_follow_up, contact_person, contact_no, email } = body

    // Validate required fields
    if (!client_id || !date || !status) {
      return NextResponse.json({ error: 'Client ID, date, and status are required' }, { status: 400 })
    }

    // Insert new interaction
    const { data: newInteraction, error: insertError } = await supabaseServer
      .from('domestic_leads_interaction')
      .insert({
        client_id,
        leadgen_id: user.id,
        date,
        status,
        sub_status,
        remarks,
        next_follow_up,
        contact_person,
        contact_no,
        email
      })
      .select()
      .single()

    if (insertError) {
      console.error('Interaction insert error:', insertError)
      return NextResponse.json({
        error: 'Failed to create interaction',
        details: insertError.message
      }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      data: newInteraction
    })

  } catch (error) {
    console.error('Create interaction API error:', error)
    return NextResponse.json({
      error: 'Internal server error',
      details: error.message
    }, { status: 500 })
  }
}
