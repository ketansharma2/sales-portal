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

    // Fetch ALL interactions with franchise_status that is NOT 'no franchise discussed' (case-insensitive)
    const { data: allFranchiseInteractions, error: allError } = await supabaseServer
      .from('corporate_leads_interaction')
      .select(`
        id,
        client_id,
        date,
        created_at,
        status,
        sub_status,
        franchise_status,
        remarks,
        next_follow_up,
        contact_person,
        contact_no,
        email,
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
      .not('franchise_status', 'ilike', 'no franchise discuss')
      .order('created_at', { ascending: true });

    if (allError) {
      console.error('Franchise Discussed interactions fetch error:', allError);
      return NextResponse.json({ success: false, error: allError.message }, { status: 500 });
    }

    // Step 1: Find first franchise discussed interaction for each client_id
    const firstFranchiseMap = new Map();
    
    (allFranchiseInteractions || []).forEach(interaction => {
      const clientId = interaction.client_id;
      
      // Keep only the first interaction (earliest created_at) for each client_id
      if (!firstFranchiseMap.has(clientId)) {
        firstFranchiseMap.set(clientId, {
          ...interaction,
          isFirstFranchise: true
        });
      }
    });

    // Get the first franchise discussed interactions
    const firstFranchiseList = Array.from(firstFranchiseMap.values());

    // Step 2: Apply date filtering to the first franchise list
    let filteredFirstFranchise = firstFranchiseList;
    
    if (dateRange === 'specific' && fromDate && toDate) {
      filteredFirstFranchise = firstFranchiseList.filter(interaction => {
        const interactionDate = getInteractionDate(interaction);
        if (!interactionDate) return false;
        return interactionDate >= fromDate && interactionDate <= toDate;
      });
    } else if (dateRange === 'default') {
      // Get the latest interaction date for this user with franchise discussed
      const { data: latestData } = await supabaseServer
        .from('corporate_leads_interaction')
        .select('date, created_at')
        .eq('leadgen_id', user.id)
        .not('franchise_status', 'ilike', 'no franchise discussed')
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (latestData) {
        const latestDate = getInteractionDate(latestData);
        if (latestDate) {
          filteredFirstFranchise = firstFranchiseList.filter(interaction => {
            const interactionDate = getInteractionDate(interaction);
            if (!interactionDate) return false;
            return interactionDate === latestDate;
          });
        }
      }
    }
    // If dateRange === 'all', return all first franchise discussed (no filter)

    // Format the data - include ALL fields needed by details page
    const formattedInteractions = filteredFirstFranchise.map(interaction => {
      const leadData = interaction.corporate_leadgen_leads;
      
      return {
        id: interaction.id,
        client_id: interaction.client_id,
        date: interaction.date,
        created_at: interaction.created_at,
        status: interaction.status,
        sub_status: interaction.sub_status,
        franchise_status: interaction.franchise_status,
        remarks: interaction.remarks || '',
        next_follow_up: interaction.next_follow_up || '',
        contact_person: interaction.contact_person || '',
        contact_no: interaction.contact_no || '',
        email: interaction.email || '',
        sourcing_date: leadData?.sourcing_date || '',
        company: leadData?.company || '',
        category: leadData?.category || '',
        district_city: leadData?.district_city || '',
        state: leadData?.state || '',
        startup: leadData?.startup || ''
      };
    });

    // Get total count (unique clients that had franchise discussed)
    const totalFranchise = formattedInteractions.length;

    return NextResponse.json({
      success: true,
      data: {
        franchise: { total: totalFranchise }
      },
      records: formattedInteractions
    });

  } catch (error) {
    console.error('Franchise Discussed API error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
