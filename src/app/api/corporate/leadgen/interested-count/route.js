import { NextResponse } from 'next/server';
import { getUser } from '@/lib/auth-helper';
import { supabaseServer } from '@/lib/supabase-server';

export const getTargetUserId = async (supabase, currentUserId) => {
  // Current user data
  const { data: userData, error: userError } = await supabase
    .from('users')
    .select('role, sector')
    .eq('user_id', currentUserId)
    .single();

  if (userError) {
    throw userError;
  }

  const userRole = userData.role;
  const userSector = userData.sector;

  // LEADGEN + Corporate
  if (
    Array.isArray(userRole) &&
    userRole.includes('LEADGEN') &&
    userSector === 'Corporate'
  ) {
    return currentUserId;
  }

  // Find LEADGEN user in same sector
  const { data, error } = await supabase
    .from('users')
    .select('user_id')
    .contains('role', ['LEADGEN'])
    .eq('sector', userSector)
    .single();

  if (error) {
    throw error;
  }

  return data.user_id;
}; 

// Helper function to get date - returns date or created_at if date is null
const getInteractionDate = (interaction) => {
  const date = interaction.date;
  const createdAt = interaction.created_at;
  
  // If date has value, use it
  if (date) {
    return typeof date === 'string' ? date.split('T')[0] : date;
  }
  
  // If date is null, fallback to created_at
  if (createdAt) {
    return typeof createdAt === 'string' ? createdAt.split('T')[0] : createdAt;
  }
  
  return null;
};

export async function GET(request) {
  try {
    // Authentication - user injected by middleware (no auth calls needed!)
    const { user, error: authError } = getUser(request);
    if (authError || !user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const user_id = await getTargetUserId(
          supabaseServer,
          user.id
        );

    // Get query params
    const { searchParams } = new URL(request.url);
    const dateRange = searchParams.get('dateRange') || 'default';
    const fromDate = searchParams.get('fromDate');
    const toDate = searchParams.get('toDate');

    // Fetch ALL interactions with status = 'Interested' for this user (complete history)
    // This is needed to find first interested per client_id regardless of date filter
    const { data: allInterestedInteractions, error: allError } = await supabaseServer
      .from('corporate_leads_interaction')
      .select(`
        id,
        client_id,
        date,
        created_at,
        status,
        sub_status,
        remarks,
        next_follow_up,
        contact_person,
        contact_no,
        email,
        franchise_status,
        corporate_leadgen_leads(
          sourcing_date,
          company,
          category,
          district_city,
          state,
          startup
        )
      `)
      .eq('leadgen_id', user_id)
      .ilike('status', 'Interested')
      .order('created_at', { ascending: true });

    if (allError) {
      console.error('Interested interactions fetch error:', allError);
      return NextResponse.json({ success: false, error: allError.message }, { status: 500 });
    }

    // Step 1: Find first interested interaction for each client_id
    const firstInterestedMap = new Map();
    
    (allInterestedInteractions || []).forEach(interaction => {
      const clientId = interaction.client_id;
      const createdAt = interaction.created_at;
      
      // Keep only the first interaction (earliest created_at) for each client_id
      if (!firstInterestedMap.has(clientId)) {
        firstInterestedMap.set(clientId, {
          ...interaction,
          isFirstInterested: true
        });
      }
    });

    // Get the first interested interactions
    const firstInterestedList = Array.from(firstInterestedMap.values());

    // Step 2: Apply date filtering to the first interested list
    // Use getInteractionDate to handle null date values
    let filteredFirstInterested = firstInterestedList;
    
    if (dateRange === 'specific' && fromDate && toDate) {
      filteredFirstInterested = firstInterestedList.filter(interaction => {
        const interactionDate = getInteractionDate(interaction);
        if (!interactionDate) return false;
        return interactionDate >= fromDate && interactionDate <= toDate;
      });
    } else if (dateRange === 'default') {
      // Get the latest interaction date for this user with 'Interested' status
      // Use getInteractionDate to handle null date values
      const { data: latestData } = await supabaseServer
        .from('corporate_leads_interaction')
        .select('date, created_at')
        .eq('leadgen_id', user_id)
        .ilike('status', 'Interested')
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (latestData) {
        const latestDate = getInteractionDate(latestData);
        if (latestDate) {
          filteredFirstInterested = firstInterestedList.filter(interaction => {
            const interactionDate = getInteractionDate(interaction);
            if (!interactionDate) return false;
            return interactionDate === latestDate;
          });
        }
      }
    }
    // If dateRange === 'all', return all first interested (no filter)

    // Format the data - include ALL fields needed by details page
    const formattedInteractions = filteredFirstInterested.map(interaction => {
      const leadData = interaction.corporate_leadgen_leads;
      
      return {
        id: interaction.id,
        client_id: interaction.client_id,
        date: interaction.date,
        created_at: interaction.created_at,
        status: interaction.status,
        sub_status: interaction.sub_status,
        remarks: interaction.remarks || '',
        next_follow_up: interaction.next_follow_up || '',
        contact_person: interaction.contact_person || '',
        contact_no: interaction.contact_no || '',
        email: interaction.email || '',
        franchise_status: interaction.franchise_status || '',
        sourcing_date: leadData?.sourcing_date || '',
        company: leadData?.company || '',
        category: leadData?.category || '',
        district_city: leadData?.district_city || '',
        state: leadData?.state || '',
        startup: leadData?.startup || ''
      };
    });

    // Get total count (unique clients that became interested)
    const totalInterested = formattedInteractions.length;

    return NextResponse.json({
      success: true,
      data: {
        interested: { total: totalInterested }
      },
      records: formattedInteractions
    });

  } catch (error) {
    console.error('Interested API error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
