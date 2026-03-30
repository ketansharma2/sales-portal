import { supabaseServer } from '@/lib/supabase-server';
import { NextResponse } from 'next/server';

export async function GET(request, { params }) {
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

    // Await params in Next.js 15
    const { id: conversationId } = await params;

    // Fetch email records for this conversation
    const { data: emailRecords, error: emailError } = await supabaseServer
      .from('corporate_crm_emails')
      .select('*')
      .eq('conversation_id', conversationId)
      .order('shared_date', { ascending: false })

    if (emailError) {
      console.error('Fetch email history error:', emailError)
      return NextResponse.json({ error: 'Failed to fetch email history' }, { status: 500 })
    }

    // Transform data to include company info and dates
    const transformedData = emailRecords.map(record => ({
      id: record.id,
      companyName: record.company_name || '-',
      crmFeedback: record.feedback || '-',
      date: record.shared_date || '-',
      cv_url: record.cv_url || '',
      // Additional fields from the record
      name: record.name || '-',
      profile: record.profile || '-',
      location: record.location || '-',
      qualification: record.qualification || '-',
      experience: record.experience ,
      // Journey would be empty for now - can be extended later
      journey: []
    }));

    return NextResponse.json({ 
      success: true, 
      data: transformedData,
      candidateInfo: emailRecords.length > 0 ? {
        name: emailRecords[0].name,
        profile: emailRecords[0].profile,
        location: emailRecords[0].location,
        qualification: emailRecords[0].qualification,
        experience: emailRecords[0].experience,
        cv_url: emailRecords[0].cv_url
      } : null
    })

  } catch (error) {
    console.error('Server error:', error)
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error.message 
    }, { status: 500 })
  }
}