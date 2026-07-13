import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getUser } from '@/lib/auth-helper';

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
    // Get user from token
// Get user from auth-helper (middleware headers)
const { user, error: authError } = getUser(request);

if (authError || !user) {
  console.log('[API] Auth error:', authError);
  return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
}

    const { searchParams } = new URL(request.url);
    const month = searchParams.get('month');
    const year = searchParams.get('year');

    if (!month || !year) {
      return NextResponse.json({ error: 'Month and year parameters required' }, { status: 400 });
    }

    // Calculate month date range
    const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
    const monthIndex = monthNames.indexOf(month);
    if (monthIndex === -1) {
      return NextResponse.json({ error: 'Invalid month' }, { status: 400 });
    }

    const startDate = `${year}-${String(monthIndex + 1).padStart(2, '0')}-01`;
    const monthEnd = `${year}-${String(monthIndex + 1).padStart(2, '0')}-${new Date(parseInt(year), monthIndex + 1, 0).getDate()}`;

    // Debug logging for troubleshooting
    console.log('Interested achievement - Month:', month, 'Year:', year, 'User:', user.id);

    // Fetch ALL interactions with status = 'Interested' for this user (complete history)
    // This is needed to find first interested per client_id regardless of date filter
    const { data: allInterestedInteractions, error: allError } = await supabaseServer
      .from('corporate_leads_interaction')
      .select('client_id, date, created_at, status')
      .eq('leadgen_id', user.id)
      .ilike('status', 'Interested')
      .order('created_at', { ascending: true });

    if (allError) {
      console.error('All interested interactions fetch error:', allError);
      return NextResponse.json({ error: 'Failed to fetch interested interactions', details: allError.message }, { status: 500 });
    }

    // Step 1: Find first interested interaction for each client_id
    const firstInterestedMap = new Map();

    (allInterestedInteractions || []).forEach(interaction => {
      const clientId = interaction.client_id;
      const createdAt = interaction.created_at;

      // Keep only the first interaction (earliest created_at) for each client_id
      if (!firstInterestedMap.has(clientId)) {
        firstInterestedMap.set(clientId, interaction);
      }
    });

    // Get the first interested interactions
    const firstInterestedList = Array.from(firstInterestedMap.values());

    // Step 2: Apply month date filtering to the first interested list
    // Use getInteractionDate to handle null date values
    const filteredFirstInterested = firstInterestedList.filter(interaction => {
      const interactionDate = getInteractionDate(interaction);
      if (!interactionDate) return false;
      return interactionDate >= startDate && interactionDate <= monthEnd;
    });

    // Count the filtered first interested interactions
    const achieved = filteredFirstInterested.length;
    console.log('First interested clients in month:', achieved);

    // Return achieved count - percentage will be calculated in frontend
    const target = 0; // Not used in API, calculated in frontend
    const percentage = 0; // Not used in API, calculated in frontend

    return NextResponse.json({
      success: true,
      data: {
        achieved,
        target,
        percentage
      }
    });

  } catch (error) {
    console.error('Interested achievement API error:', error);
    return NextResponse.json({
      error: 'Internal server error',
      details: error.message
    }, { status: 500 });
  }
}