import { supabaseServer } from '@/lib/supabase-server';
import { NextResponse } from 'next/server';
import { getUser } from '@/lib/auth-helper';

export async function GET(request) {
  try {
    // Authentication - user injected by middleware (no auth calls needed!)
    const { user, error: authError } = getUser(request);
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
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

    // Get FSE team members under this manager
    const { data: fseTeam, error: fseError } = await supabaseServer
      .from('users')
      .select('user_id, name')
      .eq('manager_id', user.id)
      .contains('role', ['FSE'])

    if (fseError) {
      console.error('FSE team fetch error:', fseError)
    }

    // Get tab parameter from URL
    const { searchParams } = new URL(request.url);
    const tab = searchParams.get('tab') || 'actionable';

    let rawData;
    
    if (tab === 'actionable') {
      // For Interested/Onboarded tab: use corporate_manager_leads table
      // Fetch leads first
      const { data, error } = await supabaseServer
        .from('corporate_manager_leads')
        .select('*')
        .eq('user_id', user.id)
        .order('sourcing_date', { ascending: false })

      if (error) {
        console.error('Leads fetch error:', error)
        return NextResponse.json({ error: 'Failed to fetch leads', details: error.message }, { status: 500 })
      }
      rawData = data

      // Fetch all unique sourced_by UUIDs and get their names
      if (rawData && rawData.length > 0) {
        const uniqueSourcedByIds = [...new Set(rawData.map(lead => lead.sourced_by).filter(Boolean))]
        if (uniqueSourcedByIds.length > 0) {
          const { data: usersData } = await supabaseServer
            .from('users')
            .select('user_id, name')
            .in('user_id', uniqueSourcedByIds)
          
          // Create a map of UUID to name
          const userNameMap = {}
          usersData?.forEach(user => {
            userNameMap[user.user_id] = user.name
          })
          
          // Add sourcedByName to each lead
          rawData = rawData.map(lead => ({
            ...lead,
            sourcedByName: userNameMap[lead.sourced_by] || lead.sourced_by || 'Unknown'
          }))
        } else {
          rawData = rawData.map(lead => ({
            ...lead,
            sourcedByName: 'Unknown'
          }))
        }
      }

      // Now fetch interactions from BOTH tables for these leads
      if (rawData && rawData.length > 0) {
        const clientIds = rawData.map(lead => lead.client_id)
        
        // Fetch from corporate_manager_interaction (manager's interactions)
        const { data: managerInteractionsData, error: managerInteractionsError } = await supabaseServer
          .from('corporate_manager_interaction')
          .select('*')
          .in('client_id', clientIds)
          .order('created_at', { ascending: false })

        // Fetch from corporate_leads_interaction (leadgen's interactions)
        const { data: leadsInteractionsData, error: leadsInteractionsError } = await supabaseServer
          .from('corporate_leads_interaction')
          .select('*')
          .in('client_id', clientIds)
          .order('created_at', { ascending: false })

        // Combine both interaction sources
        const allInteractions = [
          ...(managerInteractionsData || []),
          ...(leadsInteractionsData || [])
        ]

        // Group by client_id
        const interactionsByClient = {}
        allInteractions.forEach(interaction => {
          if (!interactionsByClient[interaction.client_id]) {
            interactionsByClient[interaction.client_id] = []
          }
          interactionsByClient[interaction.client_id].push(interaction)
        })

        // Sort each client's interactions by date (newest first), pushing null dates to end
        Object.keys(interactionsByClient).forEach(clientId => {
          interactionsByClient[clientId].sort((a, b) => {
            // Push null/undefined dates to end
            if (!a.date) return 1;
            if (!b.date) return -1;
            return new Date(b.date) - new Date(a.date);
          });
        })

// Attach interactions to each lead
         rawData = rawData.map(lead => {
           const interactions = interactionsByClient[lead.client_id] || []
           // Check if ANY interaction has Contract Share (for filtering)
           const everContractShare = interactions.some(
             interaction => (interaction.sub_status || interaction.subStatus) === 'Contract Share'
           ) || false
           return {
             ...lead,
             allInteractions: interactions,
             everContractShare: everContractShare
           }
         })
       }
    } else {
      // For All Leads Database tab: use corporate_leadgen_leads table
      // Get all leadgens under this manager
      const { data: team, error: teamError } = await supabaseServer
        .from('users')
        .select('user_id')
        .eq('manager_id', user.id)
        .contains('role', ['LEADGEN'])

      if (teamError) {
        console.error('Team fetch error:', teamError)
        return NextResponse.json({ error: 'Failed to fetch team' }, { status: 500 })
      }

      const leadgenIds = team?.map(t => t.user_id) || []
      
      if (leadgenIds.length === 0) {
        return NextResponse.json({ leads: [], fseTeam: fseTeam || [] });
      }

      const { data, error } = await supabaseServer
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
          created_at,
          leadgen_id,
          projection,
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

      if (error) {
        console.error('Leads fetch error:', error)
        return NextResponse.json({ error: 'Failed to fetch leads' }, { status: 500 })
      }
      rawData = data
    }

    console.log("leads:",rawData);
// Format the data
     let formattedLeads = rawData?.map((lead) => {
       // For actionable tab, use allInteractions; for database tab, use corporate_leads_interaction
       const interactions = lead.allInteractions || lead.corporate_leads_interaction || []
       const latestInteraction = interactions.length > 0 ? interactions[0] : null
       
       // Check if ANY interaction has Contract Share (for filtering) - already computed above
       const everContractShare = lead.everContractShare || interactions.some(
         interaction => (interaction.sub_status || interaction.subStatus) === 'Contract Share'
       ) || false
       
return {
          id: lead.client_id,
          sourcingDate: lead.sourcing_date ? new Date(lead.sourcing_date).toLocaleDateString('en-GB') : 'N/A',
          sourcingDateRaw: lead.sourcing_date || null,
          arrivedDate: lead.arrived_date ? new Date(lead.arrived_date).toLocaleDateString('en-GB') : 'N/A',
          arrivedDateRaw: lead.arrived_date || null,
          company: lead.company,
          category: lead.category,
          state: lead.state,
          city: lead.city || '',
          location: lead.location || lead.district_city || '',
          districtCity: lead.district_city || '',
          empCount: lead.emp_count,
          reference: lead.reference,
          startup: lead.startup,
          projection: lead.projection,
          status: latestInteraction?.status || 'New',
          subStatus: latestInteraction?.sub_status || 'New Lead',
          franchiseStatus: latestInteraction?.franchise_status || '',
          latestFollowup: (latestInteraction && latestInteraction.date) 
            ? new Date(latestInteraction.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: '2-digit' }) 
            : 'N/A',
          latestFollowupRaw: latestInteraction?.date || null,
          remarks: latestInteraction?.remarks || '',
          latestRemark: latestInteraction?.remarks || '',
         nextFollowup: latestInteraction?.next_follow_up 
           ? new Date(latestInteraction.next_follow_up).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: '2-digit' })
           : (lead.next_follow_up 
             ? new Date(lead.next_follow_up).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: '2-digit' })
             : 'N/A'),
         contactPerson: latestInteraction?.contact_person || '',
         contactNo: latestInteraction?.contact_no || '',
         email: latestInteraction?.email || '',
         phone: latestInteraction?.contact_no || '',
         // Leadgen info
         leadgenId: lead.leadgen_id || lead.user_id,
         sourcedBy: lead.sourcedByName || lead.sourced_by || 'Unknown',
         // Submission status
         isSubmitted: lead.sent_to_sm || false,
         sentToCrm: lead.sent_to_crm || false,
         // Historical sub-status check for Contract Share filter
         everContractShare: everContractShare,
         // Interactions array for compatibility
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

    return NextResponse.json({ leads: formattedLeads, fseTeam: fseTeam || [] });

  } catch (error) {
    console.error('Server error:', error);
    return NextResponse.json({ error: 'Internal server error', details: error.message }, { status: 500 });
  }
}
