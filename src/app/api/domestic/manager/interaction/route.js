import { supabaseServer } from '@/lib/supabase-server';
import { NextResponse } from 'next/server';

export async function GET(request) {
  try {
    // Authentication
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabaseServer.auth.getUser(token);
    if (authError || !user) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    // Get query parameters
    const { searchParams } = new URL(request.url);
    const clientId = searchParams.get('client_id');

    if (!clientId) {
      return NextResponse.json({ error: 'Client ID is required' }, { status: 400 });
    }

    // Fetch interactions for the client
    const { data: interactionsData, error: interactionsError } = await supabaseServer
      .from('domestic_manager_interaction')
      .select('*')
      .eq('client_id', clientId)
      .order('created_at', { ascending: false });

    if (interactionsError) {
      console.error('Interactions fetch error:', interactionsError);
      return NextResponse.json({
        error: 'Failed to fetch interactions',
        details: interactionsError.message
      }, { status: 500 });
    }

    // Get unique user IDs from interactions
    const userIds = [...new Set(interactionsData?.map(i => i.user_id).filter(Boolean))] || [];
    console.log('User IDs found:', userIds);

    // Fetch user names separately - try with user_id column first
    let userNameMap = {};
    if (userIds.length > 0) {
      // Try selecting by user_id column
      const { data: usersData } = await supabaseServer
        .from('users')
        .select('user_id, name')
        .in('user_id', userIds);
      
      console.log('Users data:', usersData);
      
      if (usersData && usersData.length > 0) {
        userNameMap = usersData.reduce((acc, u) => {
          acc[u.user_id] = u.name;
          return acc;
        }, {});
      } else {
        // Try with id column
        const { data: usersData2 } = await supabaseServer
          .from('users')
          .select('id, name')
          .in('id', userIds);
        
        console.log('Users data (by id):', usersData2);
        
        if (usersData2) {
          userNameMap = usersData2.reduce((acc, u) => {
            acc[u.id] = u.name;
            return acc;
          }, {});
        }
      }
    }

    // Format the data with user names
    const formattedInteractions = interactionsData?.map(interaction => ({
      id: interaction.id,
      date: interaction.date,
      contact_person: interaction.contact_person,
      contact_no: interaction.contact_no,
      email: interaction.email,
      remarks: interaction.remarks,
      status: interaction.status,
      sub_status: interaction.sub_status,
      next_follow_up: interaction.next_follow_up,
      created_at: interaction.created_at,
      user_name: userNameMap[interaction.user_id] || null
    })) || [];

    return NextResponse.json({
      success: true,
      data: formattedInteractions
    });

  } catch (error) {
    console.error('Interactions GET API error:', error);
    return NextResponse.json({
      error: 'Internal server error',
      details: error.message
    }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    // Authentication
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabaseServer.auth.getUser(token);
    if (authError || !user) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const body = await request.json();
    const { 
      client_id,
      date,
      status,
      sub_status,
      remarks,
      next_follow_up,
      contact_person,
      contact_no,
      email
    } = body;

    // Validate required fields
    if (!client_id) {
      return NextResponse.json({ error: 'client_id is required' }, { status: 400 });
    }

    // Insert into domestic_manager_interaction table
    const { data, error } = await supabaseServer
      .from('domestic_manager_interaction')
      .insert({
        client_id,
        user_id: user.id,
        date: date || new Date().toISOString().split('T')[0],
        status: status || null,
        sub_status: sub_status || null,
        remarks: remarks || null,
        next_follow_up: next_follow_up || null,
        contact_person: contact_person || null,
        contact_no: contact_no || null,
        email: email || null,
      })
      .select()
      .single();

    if (error) {
      console.error('Supabase error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error('Error posting interaction:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
