import { NextResponse } from 'next/server';
import { getUser } from '@/lib/auth-helper';
import { supabaseServer } from '@/lib/supabase-server';

export const getTargetUserId = async (supabase, currentUserId) => {
  const { data: userData, error: userError } = await supabase
    .from('users')
    .select('role, sector')
    .eq('user_id', currentUserId)
    .single();

  if (userError) throw userError;

  const userRole = userData.role;
  const userSector = userData.sector;

  if (
    Array.isArray(userRole) &&
    userRole.includes('LEADGEN') &&
    userSector === 'Corporate'
  ) {
    return currentUserId;
  }

  const { data, error } = await supabase
    .from('users')
    .select('user_id')
    .contains('role', ['LEADGEN'])
    .eq('sector', userSector)
    .single();

  if (error) throw error;

  return data.user_id;
};

export async function GET(request) {
  try {
    const { user, error: authError } = getUser(request);
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const fromDate = searchParams.get('fromDate');
    const toDate = searchParams.get('toDate');
    const startupFilter = searchParams.get('startup');

    const user_id = await getTargetUserId(supabaseServer, user.id);

    // Fetch leads with currently_flag column
    let query = supabaseServer
      .from('corporate_leadgen_leads')
      .select(`
        client_id,
        company,
        category,
        state,
        location,
        district_city,
        startup,
        sourcing_date,
        currently_flag
      `)
      .eq('leadgen_id', user_id);

    // Startup filter
    if (startupFilter && startupFilter !== 'All') {
      if (startupFilter === 'No') {
        query = query.or('startup.ilike.no,startup.is.null');
      } else if (startupFilter === 'Yes') {
        query = query.ilike('startup', 'yes');
      }
    }

    // Date filter
    if (fromDate && toDate) {
      query = query
        .gte('sourcing_date', fromDate)
        .lte('sourcing_date', toDate);
    }

    const { data: rawData, error: rawError } = await query;

    if (rawError) {
      console.error('Flagged fetch error:', rawError);
      return NextResponse.json(
        { error: 'Failed to fetch flagged data', details: rawError.message },
        { status: 500 }
      );
    }

    const leads = rawData || [];

    // ✅ Count BOTH true and false for currently_flag
    const flaggedTrue  = leads.filter((l) => l.currently_flag === true);
    const flaggedFalse = leads.filter(
      (l) => l.currently_flag === false || l.currently_flag === null || l.currently_flag === undefined
    );

    // Startup breakdown
    const isStartup = (l) => l.startup === 'Yes' || l.startup === 'yes';

    const totalTrue   = flaggedTrue.length;
    const totalFalse  = flaggedFalse.length;
    const startupTrue  = flaggedTrue.filter(isStartup).length;
    const startupFalse = flaggedFalse.filter(isStartup).length;

    return NextResponse.json({
      success: true,
      data: {
        flagged: {
          total: totalTrue,        // currently_flag = true
          startup: startupTrue,
        },
        unflagged: {
          total: totalFalse,       // currently_flag = false
          startup: startupFalse,
        },
      },
    });

  } catch (error) {
    console.error('Flagged API error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}