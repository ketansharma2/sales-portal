import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabaseServer = createClient(supabaseUrl, supabaseKey);

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
    // Authentication
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json({ success: false, error: 'No authorization header' }, { status: 401 });
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabaseServer.auth.getUser(token);

    if (authError || !user) {
      return NextResponse.json({ success: false, error: 'Invalid token' }, { status: 401 });
    }

    // Get query params
    const { searchParams } = new URL(request.url);
    const dateRange = searchParams.get('dateRange') || 'default';
    const fromDate = searchParams.get('fromDate');
    const toDate = searchParams.get('toDate');

    // Fetch ALL interactions with sub_status = 'Contract Share' (case-insensitive) for this user
    const { data: allContractInteractions, error: allError } = await supabaseServer
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
      .eq('leadgen_id', user.id)
      .ilike('sub_status', 'Contract Share')
      .order('created_at', { ascending: true });

    if (allError) {
      console.error('Contract Share interactions fetch error:', allError);
      return NextResponse.json({ success: false, error: allError.message }, { status: 500 });
    }

    // Step 1: Find first Contract Share interaction for each client_id
    const firstContractMap = new Map();
    
    (allContractInteractions || []).forEach(interaction => {
      const clientId = interaction.client_id;
      
      // Keep only the first interaction (earliest created_at) for each client_id
      if (!firstContractMap.has(clientId)) {
        firstContractMap.set(clientId, {
          ...interaction,
          isFirstContract: true
        });
      }
    });

    // Get the first Contract Share interactions
    const firstContractList = Array.from(firstContractMap.values());

    // Step 2: Apply date filtering to the first Contract list
    let filteredFirstContract = firstContractList;
    
    if (dateRange === 'specific' && fromDate && toDate) {
      filteredFirstContract = firstContractList.filter(interaction => {
        const interactionDate = getInteractionDate(interaction);
        if (!interactionDate) return false;
        return interactionDate >= fromDate && interactionDate <= toDate;
      });
    } else if (dateRange === 'default') {
      // Get the latest interaction date for this user with 'Contract Share' status
      const { data: latestData } = await supabaseServer
        .from('corporate_leads_interaction')
        .select('date, created_at')
        .eq('leadgen_id', user.id)
        .ilike('sub_status', 'Contract Share')
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (latestData) {
        const latestDate = getInteractionDate(latestData);
        if (latestDate) {
          filteredFirstContract = firstContractList.filter(interaction => {
            const interactionDate = getInteractionDate(interaction);
            if (!interactionDate) return false;
            return interactionDate === latestDate;
          });
        }
      }
    }
    // If dateRange === 'all', return all first Contract Share (no filter)

    // Format the data - include ALL fields needed by details page
    const formattedInteractions = filteredFirstContract.map(interaction => {
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

    // Get total count (unique clients that got Contract Share)
    const totalContract = formattedInteractions.length;

    return NextResponse.json({
      success: true,
      data: {
        contract: { total: totalContract }
      },
      records: formattedInteractions
    });

  } catch (error) {
    console.error('Contract Share API error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
