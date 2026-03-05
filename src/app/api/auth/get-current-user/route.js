import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export async function GET(request) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json({ error: 'No authorization header' }, { status: 401 });
    }

    const token = authHeader.replace('Bearer ', '');
    
    // Verify the token and get user
    const { data: { user }, error } = await supabase.auth.getUser(token);
    
    if (error || !user) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    // Get user_id from users table using the auth user id
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('user_id')
      .eq('email', user.email)
      .single();

    if (userError || !userData) {
      // Fallback: use the auth user's id
      return NextResponse.json({ 
        id: user.id,
        user_id: user.id,
        email: user.email,
        name: user.user_metadata?.name || user.email
      });
    }

    return NextResponse.json({ 
      id: user.id,
      user_id: userData.user_id,
      email: user.email,
      name: user.user_metadata?.name || user.email
    });
  } catch (error) {
    console.error('Error getting current user:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
