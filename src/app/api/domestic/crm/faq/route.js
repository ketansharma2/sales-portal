import { supabaseServer } from '@/lib/supabase-server'
import { NextResponse } from 'next/server'

export async function GET(request) {
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

    const { data: faqs, error } = await supabaseServer
      .from('domestic_crm_faq')
      .select('*')
      .eq('user_id', currentUserId)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Fetch FAQs error:', error)
      return NextResponse.json({ error: 'Failed to fetch FAQs', details: error.message }, { status: 500 })
    }

    const clientIds = [...new Set(faqs?.map(f => f.client_id).filter(Boolean))] || []
    const reqIds = [...new Set(faqs?.map(f => f.req_id).filter(Boolean))] || []

    let clientsData = []
    if (clientIds.length > 0) {
      const { data: clients } = await supabaseServer
        .from('domestic_crm_clients')
        .select('client_id, company_name')
        .in('client_id', clientIds)
      
      clientsData = clients || []
    }
    const clientsMap = new Map(clientsData.map(c => [c.client_id, c.company_name]))

    let reqsData = []
    if (reqIds.length > 0) {
      const { data: reqs } = await supabaseServer
        .from('domestic_crm_reqs')
        .select('req_id, job_title')
        .in('req_id', reqIds)
      
      reqsData = reqs || []
    }
    const reqsMap = new Map(reqsData.map(r => [r.req_id, r.job_title]))

    const transformedData = (faqs || []).map(faq => ({
      ...faq,
      client_name: clientsMap.get(faq.client_id) || '',
      job_title: reqsMap.get(faq.req_id) || ''
    }))

    return NextResponse.json({
      success: true,
      data: transformedData
    })

  } catch (error) {
    console.error('GET FAQs API error:', error)
    return NextResponse.json({ error: 'Internal server error', details: error.message }, { status: 500 })
  }
}

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
    const { client_id, req_id, questions } = body

    if (!client_id || !req_id || !questions || questions.length === 0) {
      return NextResponse.json({ error: 'client_id, req_id, and questions are required' }, { status: 400 })
    }

    const { data: existingFaq } = await supabaseServer
      .from('domestic_crm_faq')
      .select('faq_id')
      .eq('user_id', currentUserId)
      .eq('client_id', client_id)
      .eq('req_id', req_id)
      .single()

    if (existingFaq) {
      return NextResponse.json({ error: 'FAQ already exists for this client and profile. Please edit the existing one.' }, { status: 400 })
    }

    const filteredQuestions = questions.filter(q => q.question && q.question.trim() !== '')
    
    if (filteredQuestions.length === 0) {
      return NextResponse.json({ error: 'At least one question is required' }, { status: 400 })
    }

    const { data, error } = await supabaseServer
      .from('domestic_crm_faq')
      .insert({
        user_id: currentUserId,
        client_id,
        req_id,
        questions: filteredQuestions
      })
      .select()
      .single()

    if (error) {
      console.error('Create FAQ error:', error)
      return NextResponse.json({ error: 'Failed to create FAQ', details: error.message }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      data
    })

  } catch (error) {
    console.error('POST FAQ API error:', error)
    return NextResponse.json({ error: 'Internal server error', details: error.message }, { status: 500 })
  }
}

export async function PUT(request) {
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
    const { faq_id, questions } = body

    if (!faq_id) {
      return NextResponse.json({ error: 'faq_id is required' }, { status: 400 })
    }

    if (!questions || !Array.isArray(questions)) {
      return NextResponse.json({ error: 'questions array is required' }, { status: 400 })
    }

    const filteredQuestions = questions.filter(q => q.question && q.question.trim() !== '')

    const { data, error } = await supabaseServer
      .from('domestic_crm_faq')
      .update({ questions: filteredQuestions })
      .eq('faq_id', faq_id)
      .eq('user_id', currentUserId)
      .select()
      .single()

    if (error) {
      console.error('Update FAQ error:', error)
      return NextResponse.json({ error: 'Failed to update FAQ', details: error.message }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      data
    })

  } catch (error) {
    console.error('PUT FAQ API error:', error)
    return NextResponse.json({ error: 'Internal server error', details: error.message }, { status: 500 })
  }
}