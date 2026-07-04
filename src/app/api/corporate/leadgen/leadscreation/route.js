import { NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase-server';
import { getUser } from "@/lib/auth-helper";
export async function GET(request) {
  try {
    // Authentication
    const { user, error: authError } = getUser(request)

if (authError || !user) {
  console.log('[API] Auth error:', authError)
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
}

    const supabase = supabaseServer;
    const { data, error } = await supabase
      .from('corporate_leadgen_leads')
      .select('*')
      .eq('leadgen_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Database error:', error);
      return NextResponse.json({ success: false, message: 'Failed to fetch leads' }, { status: 500 });
    }

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error('Server error:', error);
    return NextResponse.json({ success: false, message: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    // Authentication
    const { user, error: authError } = getUser(request)

if (authError || !user) {
  console.log('[API] Auth error:', authError)
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
}

    const supabase = supabaseServer;
    const body = await request.json();
    const { company, category, state, location, emp_count, reference, sourcing_date, district_city, startup,  projection  } = body;

    if (!company) {
      return NextResponse.json({ success: false, message: 'Company name is required' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('corporate_leadgen_leads')
      .insert({
        company,
        category,
        state,
        location,
        emp_count,
        reference,
        sourcing_date,
        district_city,
        startup,
        projection,
        leadgen_id: user.id
      })
      .select()
      .single();

    if (error) {
      console.error('Database error:', error);
      return NextResponse.json({ success: false, message: 'Failed to create lead' }, { status: 500 });
    }

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error('Server error:', error);
    return NextResponse.json({ success: false, message: 'Internal server error' }, { status: 500 });
  }
}