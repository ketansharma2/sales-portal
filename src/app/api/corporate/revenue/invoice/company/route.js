import { supabaseServer } from '@/lib/supabase-server';
import { NextResponse } from 'next/server';
import { getUser } from '@/lib/auth-helper';

export async function GET(request) {
  try {
    const { user, error: authError } = getUser(request);

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const clientId = searchParams.get('client_id');

    if (!clientId) {
      return NextResponse.json(
        { error: 'client_id is required' },
        { status: 400 }
      );
    }

    const { data: company, error } = await supabaseServer
      .from('corporate_revenue_invoice')
      .select(`
        client_id,
        client_name,
        gst,
        state,
        address,
        pincode
      `)
      .eq('client_id', clientId)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) {
      console.error('Company lookup error:', error);

      return NextResponse.json(
        {
          error: 'Failed to fetch company',
          details: error.message
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      exists: !!company,
      data: company || null
    });

  } catch (error) {
    console.error('Company API error:', error);

    return NextResponse.json(
      {
        error: 'Internal server error',
        details: error.message
      },
      { status: 500 }
    );
  }
}