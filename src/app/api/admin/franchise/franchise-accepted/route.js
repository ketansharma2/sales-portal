import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabaseServer = createClient(supabaseUrl, supabaseKey);

const getInteractionDate = (interaction) => {
  const date = interaction.date;
  const createdAt = interaction.created_at;

  if (date) {
    return typeof date === 'string' ? date.split('T')[0] : date;
  }
  if (createdAt) {
    return typeof createdAt === 'string' ? createdAt.split('T')[0] : createdAt;
  }
  return null;
};

export async function GET(request) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json({ success: false, error: 'No authorization header' }, { status: 401 });
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabaseServer.auth.getUser(token);

    if (authError || !user) {
      return NextResponse.json({ success: false, error: 'Invalid token' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const dateRange = searchParams.get('dateRange') || 'all';
    const fromDate = searchParams.get('fromDate');
    const toDate = searchParams.get('toDate');

    const franchiseStatus = 'form filled';

    // NO user_id filter - return all data
    const { data: allFranchiseInteractions, error: allError } = await supabaseServer
      .from('corporate_leads_interaction')
      .select(`
        id, client_id, date, created_at, status, sub_status, franchise_status,
        remarks, next_follow_up, contact_person, contact_no, email,
        corporate_leadgen_leads(sourcing_date, company, category, district_city, state, startup)
      `)
      .order('created_at', { ascending: true });

    if (allError) {
      console.error('Franchise accepted interactions fetch error:', allError);
      return NextResponse.json({ success: false, error: allError.message }, { status: 500 });
    }

    const filteredInteractions = (allFranchiseInteractions || []).filter(interaction => {
      const fs = interaction.franchise_status;
      if (!fs) return false;
      return fs.toLowerCase() === franchiseStatus;
    });

    const firstFranchiseMap = new Map();
    filteredInteractions.forEach(interaction => {
      const clientId = interaction.client_id;
      if (!firstFranchiseMap.has(clientId)) {
        firstFranchiseMap.set(clientId, { ...interaction, isFirstFranchise: true });
      }
    });

    const firstFranchiseList = Array.from(firstFranchiseMap.values());

    let filteredFirstFranchise = firstFranchiseList;
    if (dateRange === 'specific' && fromDate && toDate) {
      filteredFirstFranchise = firstFranchiseList.filter(interaction => {
        const interactionDate = getInteractionDate(interaction);
        if (!interactionDate) return false;
        return interactionDate >= fromDate && interactionDate <= toDate;
      });
    }

    const totalFranchiseAccepted = filteredFirstFranchise.length;

    return NextResponse.json({
      success: true,
      data: { franchiseAccepted: { total: totalFranchiseAccepted } },
    });

  } catch (error) {
    console.error('Franchise Accepted API error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
