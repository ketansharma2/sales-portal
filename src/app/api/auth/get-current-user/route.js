import { NextResponse } from "next/server";
import { getUserWithProfile } from "@/lib/auth-helper";

export async function GET(request) {
  try {
    const { user, profile, error } = await getUserWithProfile(request);
    console.log("GET /api/auth/get-current-user called. User:", user, "Profile:", profile, "Error:", error);
    if (error || !user) {
      return NextResponse.json({ error: error || 'Unauthorized' }, { status: 401 });
    }

    return NextResponse.json({ 
      id: user.id,
      user_id: profile?.user_id || user.id,
      email: user.email,
      name: profile?.name || user.user_metadata?.name || user.email
    });
  } catch (error) {
    console.error('Error getting current user:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
