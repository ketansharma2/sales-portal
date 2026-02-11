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

    const { data: userProfile, error: profileError } = await supabaseServer
      .from('users')
      .select('role')
      .eq('user_id', user.id)
      .single()

    if (profileError || !userProfile) {
      return NextResponse.json({ error: 'User profile not found' }, { status: 404 })
    }

    if (!userProfile.role || !userProfile.role.includes('MANAGER')) {
      return NextResponse.json({ error: 'Access denied. Manager role required.' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const clientId = searchParams.get('client_id')

    if (!clientId) {
      return NextResponse.json({ error: 'client_id is required' }, { status: 400 })
    }

    // Fetch contact person, email, and contact_no from domestic_leads_interaction
    const { data: leadgenData, error: leadgenError } = await supabaseServer
      .from('domestic_leads_interaction')
      .select('contact_person, email, contact_no')
      .eq('client_id', clientId)

    // Fetch contact person, email, and contact_no from domestic_manager_interaction
    const { data: interactionData, error: interactionError } = await supabaseServer
      .from('domestic_manager_interaction')
      .select('contact_person, email, contact_no')
      .eq('client_id', clientId)

    // Combine results
    const contactPersons = new Set()
    const emails = new Set()
    const contactNos = new Set()

    // Add from leadgen interaction data
    if (leadgenData && !leadgenError) {
      leadgenData.forEach(interaction => {
        if (interaction.contact_person) {
          contactPersons.add(interaction.contact_person)
        }
        if (interaction.email) {
          emails.add(interaction.email)
        }
        if (interaction.contact_no) {
          contactNos.add(interaction.contact_no)
        }
      })
    }

    // Add from manager interaction data
    if (interactionData && !interactionError) {
      interactionData.forEach(interaction => {
        if (interaction.contact_person) {
          contactPersons.add(interaction.contact_person)
        }
        if (interaction.email) {
          emails.add(interaction.email)
        }
        if (interaction.contact_no) {
          contactNos.add(interaction.contact_no)
        }
      })
    }

    return NextResponse.json({
      success: true,
      data: {
        contactPersons: Array.from(contactPersons),
        emails: Array.from(emails),
        contactNos: Array.from(contactNos)
      }
    })

  } catch (error) {
    console.error('Contact suggestions API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
