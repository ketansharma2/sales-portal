import { NextResponse } from 'next/server';
import { getUser } from '@/lib/auth-helper';

export async function GET(request) {
  const { user, error } = getUser(request);
  
  if (error || !user) {
    return NextResponse.json(
      { error: 'Unauthorized', user: null },
      { status: 401 }
    );
  }
  
  return NextResponse.json({ user });
}