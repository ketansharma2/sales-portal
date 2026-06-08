import { NextResponse } from 'next/server'
import { supabaseServer } from '@/lib/supabase-server'
import { cookies } from 'next/headers'

export async function POST(request) {
  try {
    const cookieStore = cookies()
    const token = cookieStore.get('access_token')?.value
    
    if (token) {
      await supabaseServer.auth.signOut()
    }
    
    const response = NextResponse.json({ 
      success: true,
      message: 'Logged out successfully' 
    })
    
    response.cookies.delete('access_token')
    
    return response
  } catch (error) {
    console.error('Logout error:', error)
    
    const response = NextResponse.json({ 
      success: true,
      message: 'Logged out' 
    })
    
    response.cookies.delete('access_token')
    
    return response
  }
}
