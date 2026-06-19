import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase-server";

export async function GET(request) {
  try {
    // 🔒 Authentication
    const authHeader = request.headers.get('authorization')
    if (!authHeader) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authError } = await supabaseServer.auth.getUser(token)
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }

    // 📊 Get all users count
    const { count: totalUsers, error: userError } = await supabaseServer
      .from('users')
      .select('*', { count: 'exact', head: true })

    if (userError) {
      throw userError
    }



    // ✅ Return only user counts
    return NextResponse.json({
      success: true,
      data: {
        total: totalUsers || 0,
      },
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('API Error:', error)
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 })
  }
}