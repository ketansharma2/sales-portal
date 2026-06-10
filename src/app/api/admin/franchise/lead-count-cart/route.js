import { NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase-server';
import { getUser } from '@/lib/auth-helper';

// Helper: normalize date
const getDate = (row) => {
  if (row.date) return row.date.toString().split('T')[0];
  if (row.created_at) return row.created_at.toString().split('T')[0];
  return null;
};

export async function GET(request) {
  try {
    // Authentication - user injected by middleware (no auth calls needed!)
    const { user, error: authError } = getUser(request);
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 📅 Filters
    const { searchParams } = new URL(request.url);
    const fromDate = searchParams.get('fromDate');
    const toDate = searchParams.get('toDate');

    // 📦 Query - get all data without user_id filter
    let query = supabaseServer
      .from('corporate_leads_interaction')
      .select('client_id, date, franchise_status')
      .not('franchise_status', 'ilike', '%no franchise discuss%');

    if (fromDate) query = query.gte('date', fromDate);
    if (toDate) query = query.lte('date', toDate);

    const { data, error: fetchError } = await query;

    if (fetchError) {
      return NextResponse.json({ success: false, error: fetchError.message }, { status: 500 });
    }


    console.log(" data:", data.length);
    // 🧠 Group by client
    const map = new Map();

    data.forEach((row) => {
      const id = row.client_id;
      const date = getDate(row);
      const fs = row.franchise_status?.toLowerCase().trim();

      if (!id || !date || !fs) return;

      if (!map.has(id)) {
        map.set(id, {
          discussed: null,
          formAsk: null,
          formShared: null,
          accepted: null
        });
      }

      const entry = map.get(id);

      if (!entry.discussed || date < entry.discussed) {
        entry.discussed = date;
      }

      if (fs === 'form ask') {
        if (!entry.formAsk || date < entry.formAsk) {
          entry.formAsk = date;
        }
      }

      if (fs === 'form shared') {
        if (!entry.formShared || date < entry.formShared) {
          entry.formShared = date;
        }
      }

      if (fs === 'form filled' || fs === 'accepted') {
        if (!entry.accepted || date < entry.accepted) {
          entry.accepted = date;
        }
      }
    });

    // 📊 Count
    const counts = {
      discussed: 0,
      formAsk: 0,
      formShared: 0,
      accepted: 0
    };

    map.forEach((v) => {
      if (v.discussed) counts.discussed++;
      if (v.formAsk) counts.formAsk++;
      if (v.formShared) counts.formShared++;
      if (v.accepted) counts.accepted++;
    });

     return NextResponse.json({
       success: true,
       data: {
         pipeline: counts
       }
     });


  } catch (err) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}