import { NextResponse } from 'next/server'
import { supabaseServer } from '@/lib/supabase-server'
import { getUser } from '@/lib/auth-helper';

export async function POST(request) {
  try {
    // Authentication
      const { user, error: authError } = getUser(request);
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    return NextResponse.json({
      success: true,
      message: 'Supabase test route working',
      userId: user.id,
    })
  } catch (error) {
    console.error('Supabase test route error:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    )
  }
}
