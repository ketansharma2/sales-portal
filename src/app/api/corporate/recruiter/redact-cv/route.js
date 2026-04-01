import { NextResponse } from 'next/server'
import { supabaseServer } from '@/lib/supabase-server'

export async function POST(request) {
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

    const body = await request.json()
    const { cv_parsing_id } = body

    if (!cv_parsing_id) {
      return NextResponse.json(
        { error: 'cv_parsing_id is required' },
        { status: 400 }
      )
    }

    // Get the CV URL from cv_parsing table
    const { data: cvData, error: fetchError } = await supabaseServer
      .from('cv_parsing')
      .select('cv_url')
      .eq('id', cv_parsing_id)
      .single()

    if (fetchError || !cvData) {
      return NextResponse.json(
        { error: 'CV not found', details: fetchError?.message },
        { status: 404 }
      )
    }

    if (!cvData.cv_url) {
      return NextResponse.json(
        { error: 'No CV URL found for this record' },
        { status: 400 }
      )
    }

    // Call the external Redacting API
    const REDACT_API_URL = process.env.REDACT_API_URL || 'http://python-api-env.eba-ejbkeat3.ap-south-1.elasticbeanstalk.com'
    
    console.log('Calling Redact API with URL:', cvData.cv_url)
    
    // Encode the URL to handle special characters like spaces
    const encodedUrl = encodeURI(cvData.cv_url)
    console.log('Encoded URL:', encodedUrl)
    
    const redactResponse = await fetch(`${REDACT_API_URL}/redact`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        s3_url: encodedUrl
      })
    })

    const redactResult = await redactResponse.json()
    console.log('Redact API response:', redactResult)

    if (!redactResult.success) {
      return NextResponse.json(
        { 
          success: false, 
          message: redactResult.message || 'Redaction failed',
          redacted_cv_url: null
        },
        { status: 200 }
      )
    }

    // Update the cv_parsing table with redacted_cv_url
    const { data: updateData, error: updateError } = await supabaseServer
      .from('cv_parsing')
      .update({ redacted_cv_url: redactResult.redacted_url })
      .eq('id', cv_parsing_id)
      .select()
      .single()

    if (updateError) {
      console.error('Supabase update error:', updateError)
      return NextResponse.json(
        { error: 'Failed to update redacted CV URL', details: updateError.message },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'CV redacted successfully',
      redacted_cv_url: redactResult.redacted_url
    })

  } catch (error) {
    console.error('Redact CV API error:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    )
  }
}
