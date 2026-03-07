  import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabaseServer = createClient(supabaseUrl, supabaseKey);

export async function GET(request) {
  try {
    // Get user from token
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json({ success: false, error: 'No authorization header' }, { status: 401 });
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabaseServer.auth.getUser(token);

    if (authError || !user) {
      return NextResponse.json({ success: false, error: 'Invalid token' }, { status: 401 });
    }

  // Get date range from query params
    // Frontend sends in format YYYY-MM-DD (e.g., "2026-03-07") or DD-MM-YY (e.g., "05-03-26")
    const { searchParams } = new URL(request.url);
    const fromDateInput = searchParams.get('fromDate');
    const toDateInput = searchParams.get('toDate');

    // Convert DD-MM-YY to YYYY-MM-DD, but passthrough if already YYYY-MM-DD
    const convertDateFormat = (dateStr) => {
      if (!dateStr) return null;
      const parts = dateStr.split('-');
      if (parts.length === 3) {
        // Check if first part is 4 digits (already YYYY-MM-DD)
        if (parts[0].length === 4) {
          // Already YYYY-MM-DD format, return as-is
          return dateStr;
        }
        // Otherwise assume DD-MM-YY format
        const day = parts[0];
        const month = parts[1];
        const year = parseInt(parts[2], 10) + 2000;
        return `${year}-${month}-${day}`;
      }
      return dateStr;
    };

    const fromDate = convertDateFormat(fromDateInput);
    const toDate = convertDateFormat(toDateInput);

    // First, fetch ALL interactions (no date filter) to determine who is truly "new"
    const { data: allInteractionsData, error: allInteractionsError } = await supabaseServer
      .from('corporate_leads_interaction')
      .select('*, corporate_leadgen_leads!inner(startup)')
      .eq('leadgen_id', user.id);

    if (allInteractionsError) {
      console.error('All interactions fetch error:', allInteractionsError);
      return NextResponse.json({ success: false, error: allInteractionsError.message }, { status: 500 });
    }

    // Then, fetch interactions within the date range for Total Calls count
    let query = supabaseServer
      .from('corporate_leads_interaction')
      .select('*, corporate_leadgen_leads!inner(startup)')
      .eq('leadgen_id', user.id);

    // Add date filtering if provided
    if (fromDate && toDate) {
      query = query
        .gte('date', fromDate)
        .lte('date', toDate);
    }

    const { data: interactionsData, error: interactionsError } = await query;

    if (interactionsError) {
      console.error('Interactions fetch error:', interactionsError);
      return NextResponse.json({ success: false, error: interactionsError.message }, { status: 500 });
    }

    // Count all interactions (Total Calls)
    const totalInteractions = interactionsData?.length || 0;

    // Count startup interactions (handle both boolean and string)
    const startupInteractions = interactionsData?.filter(i => {
      const startup = i.corporate_leadgen_leads?.startup;
      return startup === true || 
             String(startup).toLowerCase() === 'yes' ||
             String(startup) === '1' ||
             String(startup).toLowerCase() === 'true';
    }).length || 0;

    // Use fromDate as the reference date for determining New vs Followup
    // fromDate is now in YYYY-MM-DD format
    let referenceDate = null;
    
    if (fromDate) {
      const parts = fromDate.split('-');
      if (parts.length === 3) {
        // YYYY-MM-DD -> create Date object
        const year = parseInt(parts[0], 10);
        const month = parseInt(parts[1], 10) - 1;
        const day = parseInt(parts[2], 10);
        referenceDate = new Date(year, month, day);
        referenceDate.setHours(0, 0, 0, 0);
      }
    }

    // Build a map of ALL interactions to determine who is truly "new"
    // "New" = Client has NO interactions BEFORE fromDate (or date is NULL)
    // "Followup" = Client HAS at least one interaction BEFORE fromDate
    const allClientsMap = new Map();
    allInteractionsData?.forEach(interaction => {
      if (!allClientsMap.has(interaction.client_id)) {
        allClientsMap.set(interaction.client_id, []);
      }
      allClientsMap.get(interaction.client_id).push(interaction);
    });
    
    // Determine which clients in the date range are "new"
    // A client is "new" if they have NO valid (non-null) date interaction before fromDate
    const newClientIds = new Set();
    
    if (referenceDate) {
      allClientsMap.forEach((interactions, clientId) => {
        // Check if this client has any interaction with a valid date BEFORE fromDate
        const hasPriorInteraction = interactions.some(interaction => {
          if (!interaction.date) {
            // NULL date means we can't determine - treat as prior (Followup)
            return true;
          }
          const interactionDate = new Date(interaction.date);
          return interactionDate < referenceDate;
        });
        
        // If NO prior interaction, this client is "new"
        if (!hasPriorInteraction) {
          newClientIds.add(clientId);
        }
      });
    } else {
      // No fromDate provided - treat all as "new" if no prior interactions exist
      allClientsMap.forEach((interactions, clientId) => {
        const hasAnyInteraction = interactions.some(i => i.date);
        if (!hasAnyInteraction) {
          newClientIds.add(clientId);
        }
      });
    }
    
    // Now count interactions within date range for "new" clients
    let newCount = 0;
    let newStartupCount = 0;
    
    interactionsData?.forEach(interaction => {
      if (newClientIds.has(interaction.client_id)) {
        newCount++;
        const startup = interaction.corporate_leadgen_leads?.startup;
        const isStartup = startup === true || 
               String(startup).toLowerCase() === 'yes' ||
               String(startup) === '1' ||
               String(startup).toLowerCase() === 'true';
        if (isStartup) newStartupCount++;
      }
    });
    
    // Followup = Total calls - New
    const followupCount = totalInteractions - newCount;
    const followupStartupCount = startupInteractions - newStartupCount;

    return NextResponse.json({
      success: true,
      data: {
        calls: { total: totalInteractions, startup: startupInteractions },
        new: { total: newCount, startup: newStartupCount },
        followup: { total: followupCount, startup: followupStartupCount }
      }
    });

  } catch (error) {
    console.error('Interactions count API error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
