import { supabaseServer } from '@/lib/supabase-server';
import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const authHeader = request.headers.get('authorization')
    if (!authHeader) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authError } = await supabaseServer.auth.getUser(token)
    if (authError || !user) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }

    const currentUserId = user.user_id || user.id
    const body = await request.json()
    
    const { 
      conversation_id,
      company_name,
      client_id,
      name,
      profile,
      location,
      qualification,
      experience,
      feedback,
      cv_url
    } = body

    if (!conversation_id || !company_name || !client_id) {
      return NextResponse.json({ 
        error: 'Missing required fields: conversation_id, company_name, client_id' 
      }, { status: 400 })
    }

    const { data, error } = await supabaseServer
      .from('domestic_crm_emails')
      .insert({
        conversation_id,
        user_id: currentUserId,
        company_name,
        client_id,
        name: name || '',
        profile: profile || '',
        location: location || '',
        qualification: qualification || '',
        experience: experience !== undefined && experience !== null ? String(experience) : '',
        feedback: feedback || '',
        cv_url: cv_url || '',
        shared_date: new Date().toISOString().split('T')[0]
      })
      .select()
      .single()

    if (error) {
      console.error('Insert email error:', error)
      return NextResponse.json({ 
        error: 'Failed to save email record',
        details: error.message 
      }, { status: 500 })
    }

    return NextResponse.json({ 
      success: true, 
      data 
    })

  } catch (error) {
    console.error('Server error:', error)
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error.message 
    }, { status: 500 })
  }
}