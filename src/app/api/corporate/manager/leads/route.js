import { supabaseServer } from '@/lib/supabase-server';
import { NextResponse } from 'next/server';

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

    // Check if user has MANAGER role
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

    // Get leadgen team members under this manager
    const { data: team, error: teamError } = await supabaseServer
      .from('users')
      .select('user_id, name')
      .eq('manager_id', user.id)
      .contains('role', ['LEADGEN'])

    if (teamError) {
      console.error('Team fetch error:', teamError)
      return NextResponse.json({ error: 'Failed to fetch team' }, { status: 500 })
    }

    const leadgenIds = team?.map(t => t.user_id) || []

    if (leadgenIds.length === 0) {
      return NextResponse.json({ leads: [], fseTeam: [] });
    }

    // Get FSE team members under this manager
    const { data: fseTeam, error: fseError } = await supabaseServer
      .from('users')
      .select('user_id, name')
      .eq('manager_id', user.id)
      .contains('role', ['FSE'])

    if (fseError) {
      console.error('FSE team fetch error:', fseError)
      // Continue without FSE team
    }

    // Fetch leads from corporate_leadgen_leads table for leadgen under this manager
    const { data: leads, error } = await supabaseServer
      .from('corporate_leadgen_leads')
      .select('*')
      .eq('sent_to_sm', true)
      .in('leadgen_id', leadgenIds)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching leads:', error);
      return NextResponse.json({ error: 'Failed to fetch leads' }, { status: 500 });
    }

    // Format leads with interactions and sourced_by
    const formattedLeads = await Promise.all(leads?.map(async (lead) => {
      // Get sourced by name
      const sourcedByUser = team.find(t => t.user_id === lead.leadgen_id)
      const sourcedBy = sourcedByUser?.name || 'Unknown'

      // Get all interactions for this lead
      const { data: interactions } = await supabaseServer
        .from('corporate_leads_interaction')
        .select('*')
        .eq('client_id', lead.client_id)
        .order('created_at', { ascending: false })

      // Get latest FSE assignment
      const { data: assignment } = await supabaseServer
        .from('corporate_sm_fse_visits')
        .select('*, users(name)')
        .eq('client_id', lead.client_id)
        .order('created_at', { ascending: false })
        .limit(1)
        .single()

      // Format interactions
      const formattedInteractions = interactions?.map(interaction => ({
        date: new Date(interaction.date).toLocaleDateString('en-GB'),
        person: interaction.contact_person || 'N/A',
        role: '', // Not in table
        phone: interaction.contact_no,
        email: interaction.email,
        remarks: interaction.remarks,
        status: interaction.status,
        subStatus: interaction.sub_status
      })) || []

      // Get latest interaction for status
      const latestInteraction = interactions?.[0]
      const status = latestInteraction?.status || 'New'
      const subStatus = latestInteraction?.sub_status || 'New Lead'
      const latestRemark = latestInteraction?.remarks || ''

      return {
        id: lead.client_id,
        arrivedDate: (lead.lock_date || lead.created_at) ? new Date(lead.lock_date || lead.created_at).toLocaleDateString('en-GB') : '',
        sourcedBy,
        company: lead.company,
        location: lead.location,
        state: lead.state,
        latestRemark,
        status,
        subStatus,
        empCount: lead.emp_count,
        category: lead.category,
        sourcingDate: lead.sourcing_date,
        reference: lead.reference,
        interactions: formattedInteractions,
        // Assignment data
        assignedDate: assignment ? assignment.date : null,
        actionType: assignment ? 'FSE' : null,
        assignedTo: assignment ? assignment.users?.name : null,
        visitStatus: assignment ? assignment.fse_status : null,
        isProcessed: !!assignment
      }
    }) || [])

    return NextResponse.json({ leads: formattedLeads, fseTeam: fseTeam || [] });
  } catch (error) {
    console.error('Server error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}