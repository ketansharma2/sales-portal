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

    // Get all leadgen team members under this manager
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
      return NextResponse.json({ success: true, leads: [] });
    }

    // Fetch leads from corporate_leadgen_leads for all leadgens under this manager
    // With LEFT JOIN to corporate_leads_interaction to get latest interaction
    const { data: rawData, error: rawError } = await supabaseServer
      .from('corporate_leadgen_leads')
      .select(`
        client_id,
        company,
        category,
        state,
        location,
        district_city,
        emp_count,
        reference,
        startup,
        sourcing_date,
        sent_to_sm,
        created_at,
        leadgen_id,
        corporate_leads_interaction!left (
          id,
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
        )
      `)
      .in('leadgen_id', leadgenIds)
      .order('created_at', { ascending: false })

    if (rawError) {
      console.error('Leads database fetch error:', rawError)
      return NextResponse.json({ error: 'Failed to fetch leads database' }, { status: 500 })
    }

    // Format the data - same structure as leadgen leads API
    const formattedLeads = rawData?.map((lead) => {
      // Sort interactions by date descending (latest first), pushing null dates to end
      const sortedInteractions = lead.corporate_leads_interaction?.sort((a, b) => {
        if (!a.date) return 1;
        if (!b.date) return -1;
        return new Date(b.date) - new Date(a.date);
      }) || [];
      const latestInteraction = sortedInteractions[0] || null
      
      // Find the leadgen name who sourced this lead
      const leadgenUser = team.find(t => t.user_id === lead.leadgen_id)
      
      return {
        id: lead.client_id,
        sourcingDate: lead.sourcing_date ? new Date(lead.sourcing_date).toLocaleDateString('en-GB') : 'N/A',
        company: lead.company,
        category: lead.category,
        state: lead.state,
        location: lead.location,
        districtCity: lead.district_city || '',
        empCount: lead.emp_count,
        reference: lead.reference,
        startup: lead.startup,
        status: latestInteraction?.status || 'New',
        subStatus: latestInteraction?.sub_status || 'New Lead',
        franchiseStatus: latestInteraction?.franchise_status || '',
        latestFollowup: (latestInteraction && latestInteraction.date) 
          ? new Date(latestInteraction.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: '2-digit' }) 
          : 'N/A',
        remarks: latestInteraction?.remarks || '',
        nextFollowup: latestInteraction?.next_follow_up 
          ? new Date(latestInteraction.next_follow_up).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: '2-digit' }) 
          : 'N/A',
        // Contact info from latest interaction
        contactPerson: latestInteraction?.contact_person || '',
        contactNo: latestInteraction?.contact_no || latestInteraction?.phone || '',
        email: latestInteraction?.email || '',
        phone: latestInteraction?.contact_no || latestInteraction?.phone || '',
        // Leadgen info
        sourcedBy: leadgenUser?.name || 'Unknown',
        leadgenId: lead.leadgen_id,
        // Submission status
        isSubmitted: lead.sent_to_sm || false,
        // Interactions array for compatibility with existing table display
        interactions: latestInteraction ? [{
          date: latestInteraction.date,
          person: latestInteraction.contact_person || 'N/A',
          phone: latestInteraction.contact_no || '',
          email: latestInteraction.email || '',
          remarks: latestInteraction.remarks || '',
          status: latestInteraction.status || '',
          subStatus: latestInteraction.sub_status || '',
          franchiseStatus: latestInteraction.franchise_status || '',
          nextFollowUp: latestInteraction.next_follow_up || ''
        }] : []
      }
    }) || []

    return NextResponse.json({
      success: true,
      leads: formattedLeads
    })

  } catch (error) {
    console.error('Leads Database API error:', error)
    return NextResponse.json({
      error: 'Internal server error',
      details: error.message
    }, { status: 500 })
  }
}
