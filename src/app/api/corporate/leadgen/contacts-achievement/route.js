import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getUser } from "@/lib/auth-helper";
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabaseServer = createClient(supabaseUrl, supabaseKey);

export async function GET(request) {
  try {
   
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
    console.log('Contacts achievement - Month:', month, 'Year:', year, 'User:', user.id);

    // Build query to get all interactions with lead data for this leadgen user within month
    const { data: interactionsData, error } = await supabaseServer
      .from('corporate_leads_interaction')
      .select('contact_person, date, created_at')
      .eq('leadgen_id', user.id)
      .gte('date', startDate)
      .lte('date', monthEnd)
      .order('date', { ascending: false });

    if (error) {
      console.error('Contacts fetch error:', error);
      return NextResponse.json({ error: 'Failed to fetch contacts data', details: error.message }, { status: 500 });
    }

    // Group by lowercase contact_person and keep only the latest interaction per person
    const latestInteractionPerContact = new Map();

    for (const interaction of (interactionsData || [])) {
      const contactPerson = interaction.contact_person;

      if (!contactPerson) continue;

      // Convert to lowercase for comparison
      const lowercaseContact = String(contactPerson).toLowerCase().trim();

      // If this contact person hasn't been added, or if this interaction is newer, use this one
      if (!latestInteractionPerContact.has(lowercaseContact)) {
        latestInteractionPerContact.set(lowercaseContact, interaction);
      } else {
        const existing = latestInteractionPerContact.get(lowercaseContact);
        const existingDate = existing?.date ? new Date(existing.date) : new Date(0);
        const newDate = interaction?.date ? new Date(interaction.date) : new Date(0);

        if (newDate > existingDate) {
          latestInteractionPerContact.set(lowercaseContact, interaction);
        }
      }
    }

    // Count equals the number of unique contacts (rows returned)
    const achieved = latestInteractionPerContact.size;
    console.log('Unique contacts in month:', achieved);

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
    console.error('Contacts achievement API error:', error);
    return NextResponse.json({
      error: 'Internal server error',
      details: error.message
    }, { status: 500 });
  }
}