import { NextResponse } from 'next/server';
import { getUser } from '@/lib/auth-helper';
import { supabaseServer } from '@/lib/supabase-server';

export async function GET(request) {
  try {
    // Authentication - user injected by middleware (no auth calls needed!)
    const { user, error: authError } = getUser(request);
    if (authError || !user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    /* ---------------- DATE PARAMS ---------------- */
    const { searchParams } = new URL(request.url);
    const fromDate = searchParams.get('fromDate');
    const toDate = searchParams.get('toDate');
    const dateRange = searchParams.get('dateRange') || 'default'; // default, all, specific

    /* ---------------- FETCH DATA ---------------- */
    // Build query to get all interactions with lead data for this leadgen user
    let query = supabaseServer
      .from('corporate_leads_interaction')
      .select(`
        *,
        corporate_leadgen_leads(
          client_id,
          company,
          category,
          state,
          district_city,
          startup,
          sent_to_sm,
          sourcing_date
        )
      `)
      .eq('leadgen_id', user.id);

    // Add date filtering based on dateRange type
    if (dateRange === 'specific' && fromDate && toDate) {
      query = query
        .gte('date', fromDate)
        .lte('date', toDate);
    } else if (dateRange === 'default') {
      // Get the latest interaction date for this user
      const { data: latestData } = await supabaseServer
        .from('corporate_leads_interaction')
        .select('date')
        .eq('leadgen_id', user.id)
        .order('date', { ascending: false })
        .limit(1)
        .single();

      if (latestData && latestData.date) {
        const latestDate = latestData.date;
        query = query.eq('date', latestDate);
      }
    }
    // If dateRange === 'all', no date filter is applied

    // Order by date descending
    query = query.order('date', { ascending: false });

    const { data: interactionsData, error } = await query;

    if (error) {
      console.error('Fetch error:', error);
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    /* ---------------- FILTER: LATEST INTERACTION PER UNIQUE CONTACT PERSON ---------------- */
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

    // Get the filtered interactions
    const uniqueContacts = Array.from(latestInteractionPerContact.values());

    /* ---------------- FORMAT INTERACTIONS DATA ---------------- */
    const formattedInteractions = uniqueContacts.map(interaction => ({
      id: interaction.id,
      client_id: interaction.client_id,
      date: interaction.date,
      created_at: interaction.created_at,
      status: interaction.status || '',
      sub_status: interaction.sub_status || '',
      remarks: interaction.remarks || '',
      next_follow_up: interaction.next_follow_up || '',
      contact_person: interaction.contact_person || '',
      contact_no: interaction.contact_no || '',
      email: interaction.email || '',
      franchise_status: interaction.franchise_status || '',
      sourcing_date: interaction.corporate_leadgen_leads?.sourcing_date || '',
      company: interaction.corporate_leadgen_leads?.company || '',
      category: interaction.corporate_leadgen_leads?.category || '',
      state: interaction.corporate_leadgen_leads?.state || '',
      district_city: interaction.corporate_leadgen_leads?.district_city || '',
      startup: interaction.corporate_leadgen_leads?.startup || '',
      isSubmitted: interaction.corporate_leadgen_leads?.sent_to_sm || false
    }));

    // Sort by date descending
    formattedInteractions.sort((a, b) => new Date(b.date) - new Date(a.date));

    // Count equals the number of unique contacts (rows returned)
    const totalContacts = formattedInteractions.length;

    /* ---------------- RESPONSE ---------------- */
    return NextResponse.json({
      success: true,
      data: {
        contacts: { total: totalContacts.toString() }
      },
      records: formattedInteractions
    });

  } catch (err) {
    console.error('API Error:', err);
    return NextResponse.json(
      { success: false, error: err.message },
      { status: 500 }
    );
  }
}