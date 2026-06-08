import { supabaseServer } from '@/lib/supabase-server';
import { NextResponse } from 'next/server';
import { getUser } from '@/lib/auth-helper';

export async function POST(request) {
  try {
    // Authentication - user injected by middleware (no auth calls needed!)
    const { user, error: authError } = getUser(request);
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const currentUserId = user.user_id || user.id
    const body = await request.json()
    
    // Extract email data
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
      cv_url,
      sent_via
    } = body

    // Validate required fields
    if (!conversation_id || !company_name || !client_id) {
      return NextResponse.json({ 
        error: 'Missing required fields: conversation_id, company_name, client_id' 
      }, { status: 400 })
    }

    // Insert into corporate_crm_emails
    const { data, error } = await supabaseServer
      .from('corporate_crm_emails')
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
        sent_via: sent_via || '',
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

 export async function PUT(request) {
   try {
     // Authentication
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
     const { id, sent_to_revenue } = body

     if (!id) {
       return NextResponse.json({ error: 'Email ID is required' }, { status: 400 })
     }

     // Verify this email belongs to the current user
     const { data: existingEmail, error: fetchError } = await supabaseServer
       .from('corporate_crm_emails')
       .select('id')
       .eq('id', id)
       .eq('user_id', currentUserId)
       .single()

     if (fetchError || !existingEmail) {
       return NextResponse.json({ error: 'Email not found or unauthorized' }, { status: 404 })
     }

     // Update sent_to_revenue field
     const { data: updatedEmail, error: updateError } = await supabaseServer
       .from('corporate_crm_emails')
       .update({ sent_to_revenue: sent_to_revenue || null })
       .eq('id', id)
       .select()
       .single()

     if (updateError) {
       console.error('Update email error:', updateError)
       return NextResponse.json({ 
         error: 'Failed to update email',
         details: updateError.message 
       }, { status: 500 })
     }

     return NextResponse.json({ 
       success: true, 
       data: updatedEmail 
     })

   } catch (error) {
     console.error('Update email error:', error)
     return NextResponse.json({ 
       error: 'Internal server error',
       details: error.message 
     }, { status: 500 })
   }
 }