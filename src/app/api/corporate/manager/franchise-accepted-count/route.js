import { supabaseServer } from '@/lib/supabase-server';
import { NextResponse } from 'next/server';

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

    const { searchParams } = new URL(request.url);
    const leadgenId = searchParams.get('leadgen_id');
    const fromDate = searchParams.get('fromDate');
    const toDate = searchParams.get('toDate');
    const dateRange = searchParams.get('dateRange') || 'default';

    const franchiseStatus = 'form filled';

    let leadgenIds = [];
    
    if (leadgenId && leadgenId !== 'All') {
      leadgenIds = [leadgenId];
    } else {
      const { data: leadgenUsers } = await supabaseServer
        .from('users')
        .select('user_id')
        .eq('manager_id', user.id)
        .contains('role', ['LEADGEN']);
      
      leadgenIds = leadgenUsers?.map(u => u.user_id) || [];
    }

    if (leadgenIds.length === 0) {
      return NextResponse.json({ success: true, data: { franchiseAccepted: { total: 0 } } });
    }

    const { data: allFranchiseInteractions, error: allError } = await supabaseServer
      .from('corporate_leads_interaction')
      .select('id, client_id, date, created_at, franchise_status')
      .in('leadgen_id', leadgenIds)
      .order('created_at', { ascending: true });

    if (allError) {
      console.error('Franchise accepted interactions fetch error:', allError);
      return NextResponse.json({ success: false, error: allError.message }, { status: 500 });
    }

    const filteredInteractions = (allFranchiseInteractions || []).filter(interaction => {
      const fs = interaction.franchise_status;
      if (!fs) return false;
      return fs.toLowerCase() === franchiseStatus.toLowerCase();
    });

    const firstFranchiseMap = new Map();
    
    filteredInteractions.forEach(interaction => {
      const clientId = interaction.client_id;
      
      if (!firstFranchiseMap.has(clientId)) {
        firstFranchiseMap.set(clientId, {
          ...interaction,
          isFirstFranchise: true
        });
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
    } else if (dateRange === 'default') {
      const { data: allDatesData } = await supabaseServer
        .from('corporate_leads_interaction')
        .select('date, created_at')
        .in('leadgen_id', leadgenIds)
        .not('date', 'is', null)
        .order('created_at', { ascending: false })
        .limit(100);

      const uniqueDates = [...new Set(allDatesData?.map(d => getInteractionDate(d)).filter(Boolean) || [])];

      if (uniqueDates.length > 0) {
        const latestDate = uniqueDates[0];
        filteredFirstFranchise = firstFranchiseList.filter(interaction => {
          const interactionDate = getInteractionDate(interaction);
          if (!interactionDate) return false;
          return interactionDate === latestDate;
        });
      }
    }

    const totalFranchiseAccepted = filteredFirstFranchise.length;

    return NextResponse.json({
      success: true,
      data: {
        franchiseAccepted: { total: totalFranchiseAccepted }
      }
    });

  } catch (error) {
    console.error('Franchise Accepted count API error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}