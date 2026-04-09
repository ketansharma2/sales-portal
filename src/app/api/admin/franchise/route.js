import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabaseServer = createClient(supabaseUrl, supabaseKey);

// Helper: Get usable interaction date
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
    // =========================
    // AUTHENTICATION
    // =========================
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

    // =========================
    // QUERY PARAMS
    // =========================
    const { searchParams } = new URL(request.url);

    const dateRange = searchParams.get('dateRange') || 'default';
    const fromDate = searchParams.get('fromDate');
    const toDate = searchParams.get('toDate');

    const type = searchParams.get('type') || 'discussed';
    const status = searchParams.get('status') || '';

    // =========================
    // FETCH DATA
    // =========================
    const { data: interactions, error } = await supabaseServer
      .from('corporate_leads_interaction')
      .select(`
        id,
        client_id,
        date,
        created_at,
        status,
        sub_status,
        franchise_status,
        remarks,
        next_follow_up,
        contact_person,
        contact_no,
        email,
        corporate_leadgen_leads(
          sourcing_date,
          company,
          category,
          district_city,
          state,
          startup
        )
      `)
      .eq('leadgen_id', user.id)
      .order('created_at', { ascending: true });

    if (error) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    let filtered = interactions || [];

    // =========================
    // TYPE FILTERING
    // =========================

    if (type === 'discussed') {
      filtered = filtered.filter((item) => {
        const fs = item.franchise_status?.toLowerCase().trim();

        return (
          fs &&
          fs !== 'no franchise discussed' &&
          fs !== 'no franchise discuss'
        );
      });
    }

    if (type === 'status' && status) {
      filtered = filtered.filter((item) => {
        const fs = item.franchise_status?.toLowerCase().trim();

        return fs === status.toLowerCase().trim();
      });
    }

    if (type === 'accepted') {
      filtered = filtered.filter((item) => {
        const fs = item.franchise_status?.toLowerCase().trim();

        return fs === 'form filled';
      });
    }

    // =========================
    // UNIQUE FIRST INTERACTION
    // =========================
    const firstMap = new Map();

    filtered.forEach((item) => {
      if (!firstMap.has(item.client_id)) {
        firstMap.set(item.client_id, item);
      }
    });

    let result = Array.from(firstMap.values());

    // =========================
    // DATE FILTER
    // =========================

    if (dateRange === 'specific' && fromDate && toDate) {
      result = result.filter((item) => {
        const d = getInteractionDate(item);

        if (!d) return false;

        return d >= fromDate && d <= toDate;
      });
    }

    else if (dateRange === 'default') {
      const latestDate = result.length
        ? getInteractionDate(result[result.length - 1])
        : null;

      if (latestDate) {
        result = result.filter(
          (item) => getInteractionDate(item) === latestDate
        );
      }
    }

    // =========================
    // FORMAT RESPONSE
    // =========================
    const records = result.map((item) => {
      const lead = item.corporate_leadgen_leads;

      return {
        id: item.id,
        client_id: item.client_id,
        date: item.date,
        created_at: item.created_at,
        status: item.status,
        sub_status: item.sub_status,
        franchise_status: item.franchise_status,
        remarks: item.remarks || '',
        next_follow_up: item.next_follow_up || '',
        contact_person: item.contact_person || '',
        contact_no: item.contact_no || '',
        email: item.email || '',
        sourcing_date: lead?.sourcing_date || '',
        company: lead?.company || '',
        category: lead?.category || '',
        district_city: lead?.district_city || '',
        state: lead?.state || '',
        startup: lead?.startup || ''
      };
    });

    // =========================
    // RESPONSE
    // =========================
    return NextResponse.json({
      success: true,
      total: records.length,
      records
    });

  } catch (error) {
    console.error('Franchise API Error:', error);

    return NextResponse.json(
      {
        success: false,
        error: error.message
      },
      { status: 500 }
    );
  }
}