import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabaseServer = createClient(supabaseUrl, supabaseKey);

export async function GET(request) {
  try {
    /* ---------------- AUTH ---------------- */
    const authHeader = request.headers.get('authorization');

    if (!authHeader) {
      return NextResponse.json(
        { success: false, error: 'No authorization header' },
        { status: 401 }
      );
    }

    const token = authHeader.replace('Bearer ', '');
    const {
      data: { user },
      error: authError
    } = await supabaseServer.auth.getUser(token);

    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Invalid token' },
        { status: 401 }
      );
    }

    /* ---------------- DATE PARAMS ---------------- */
    const { searchParams } = new URL(request.url);
    const fromDate = searchParams.get('fromDate');
    const toDate = searchParams.get('toDate');

    /* ---------------- FETCH DATA ---------------- */
    let query = supabaseServer
      .from('corporate_leads_interaction')
      .select(`
        *,
        corporate_leadgen_leads!inner(startup)
      `)
      .eq('leadgen_id', user.id);

    // Add date filtering if provided
    if (fromDate && toDate) {
      query = query
        .gte('date', fromDate)
        .lte('date', toDate);
    }

    const { data: interactionsData, error } = await query;

    if (error) {
      console.error('Fetch error:', error);
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    /* ---------------- LATEST INTERACTION PER CLIENT ---------------- */
    const latestInteractionsMap = new Map();

    for (const interaction of interactionsData || []) {
      const existing = latestInteractionsMap.get(interaction.client_id);

      if (
        !existing ||
        new Date(interaction.date) > new Date(existing.date)
      ) {
        latestInteractionsMap.set(interaction.client_id, interaction);
      }
    }

    const latestInteractions = Array.from(
      latestInteractionsMap.values()
    );

    /* ---------------- FILTER: NOT PICKED ---------------- */
    const notPickedInteractions = latestInteractions.filter(
      i => i.status?.toLowerCase() === 'not picked'
    );

    const totalNotPicked = notPickedInteractions.length;

    /* ---------------- STARTUP COUNT ---------------- */
    const startupNotPicked = notPickedInteractions.filter(i => {
      const startup = i.corporate_leadgen_leads?.startup;
      return (
        startup === true ||
        String(startup).toLowerCase() === 'yes' ||
        String(startup).toLowerCase() === 'true' ||
        String(startup) === '1'
      );
    }).length;

    /* ---------------- RESPONSE ---------------- */
    return NextResponse.json({
      success: true,
      data: {
        notPicked: {
          total: totalNotPicked,
          startup: startupNotPicked
        }
      }
    });

  } catch (err) {
    console.error('API Error:', err);
    return NextResponse.json(
      { success: false, error: err.message },
      { status: 500 }
    );
  }
}
