import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

export async function GET(request) {
  try {
    // Get user from token
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json({ success: false, error: 'No authorization header' }, { status: 401 });
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return NextResponse.json({ success: false, error: 'Invalid token' }, { status: 401 });
    }
    
    // Debug: Log user ID
    console.log('DEBUG Contract Count: User ID:', user.id);

    // Get date range from query params
    const { searchParams } = new URL(request.url);
    const fromDate = searchParams.get('fromDate');
    const toDate = searchParams.get('toDate');

    let contractInteractions = [];
    
    if (fromDate && toDate) {
      // Direct query: Get interactions with sub_status = 'Contract Share' in the date range
      const { data: interactionsData, error: interactionsError } = await supabase
        .from('corporate_leads_interaction')
        .select(`
          id,
          client_id,
          date,
          sub_status,
          created_at,
          corporate_leadgen_leads!inner(startup)
        `)
        .eq('leadgen_id', user.id)
        .eq('sub_status', 'Contract Share')
        .gte('date', fromDate)
        .lte('date', toDate)
        .order('created_at', { ascending: false });

      if (interactionsError) {
        console.error('Interactions query error:', interactionsError);
        return NextResponse.json({ success: false, error: interactionsError.message }, { status: 500 });
      }

      contractInteractions = interactionsData || [];
    } else {
      // No date filter: Get all interactions with sub_status = 'Contract Share'
      // Debug: Also check what leadgen_ids exist in the interaction table
      const { data: leadgenIds, error: leadgenIdsError } = await supabase
        .from('corporate_leads_interaction')
        .select('leadgen_id')
        .eq('sub_status', 'Contract Share')
        .limit(100)
      
      console.log('DEBUG Contract Count: Sample leadgen_ids in Contract Share interactions:', leadgenIds?.map(i => i.leadgen_id).filter((v, i, a) => a.indexOf(v) === i) || [])
      
      const { data: interactionsData, error: interactionsError } = await supabase
        .from('corporate_leads_interaction')
        .select(`
          id,
          client_id,
          date,
          sub_status,
          created_at,
          leadgen_id,
          corporate_leadgen_leads!inner(startup)
        `)
        .eq('leadgen_id', user.id)
        .eq('sub_status', 'Contract Share')
        .order('created_at', { ascending: false });

      if (interactionsError) {
        console.error('Interactions query error:', interactionsError);
        return NextResponse.json({ success: false, error: interactionsError.message }, { status: 500 });
      }

      contractInteractions = interactionsData || [];
    }

    // Debug: Log the counts and client IDs
    console.log('DEBUG Contract Count: Total interactions with Contract Share:', contractInteractions.length);
    
    // Get unique clients (one entry per client - the latest one)
    const uniqueClientsMap = new Map();
    contractInteractions.forEach(interaction => {
      const existing = uniqueClientsMap.get(interaction.client_id);
      if (!existing || new Date(interaction.created_at) > new Date(existing.created_at)) {
        uniqueClientsMap.set(interaction.client_id, interaction);
      }
    });
    
    console.log('DEBUG Contract Count: Unique clients with Contract Share:', uniqueClientsMap.size);
    
    // Log first 10 client IDs for comparison
    const uniqueClients = Array.from(uniqueClientsMap.values()).slice(0, 10)
    console.log('DEBUG Contract Count client IDs (first 10):', JSON.stringify(uniqueClients.map(c => c.client_id)))

    const contractLatest = Array.from(uniqueClientsMap.values());
    const totalContract = contractLatest.length;

    // Count startup companies
    const startupContract = contractLatest.filter(i => {
      const startup = i.corporate_leadgen_leads?.startup;
      return startup === true || 
             String(startup).toLowerCase() === 'yes' ||
             String(startup) === '1' ||
             String(startup).toLowerCase() === 'true';
    }).length;

    return NextResponse.json({
      success: true,
      data: {
        contract: { total: totalContract, startup: startupContract }
      }
    });

  } catch (error) {
    console.error('Contract count API error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
