import { NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase-server';
import { getUser } from '@/lib/auth-helper';

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
    // Authentication - user injected by middleware (no auth calls needed!)
    const { user, error: authError } = getUser(request);
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
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
