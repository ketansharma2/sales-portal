import { NextResponse } from 'next/server'
import { supabaseServer } from '@/lib/supabase-server'

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

    const body = await request.json()
    const urls = body.urls || []

    if (!urls.length) {
      return NextResponse.json({ error: 'No URLs provided' }, { status: 400 })
    }

    console.log(`Testing ${urls.length} URLs with double encoding...`)

    const results = []

    const doubleEncodeUrl = (url) => {
      return url
        .replace(/%5B/g, '%255B')
        .replace(/%5D/g, '%255D')
        .replace(/%28/g, '%2528')
        .replace(/%29/g, '%2529')
        .replace(/%20/g, '%2520')
        .replace(/%23/g, '%2523')
        .replace(/%26/g, '%2526')
        .replace(/%3D/g, '%253D')
        .replace(/%2F/g, '%252F')
    }

    for (const item of urls) {
      const originalUrl = item.cv_url
      const fixedUrl = doubleEncodeUrl(originalUrl)

      try {
        const response = await fetch(fixedUrl, { method: 'HEAD', timeout: 10000 })
        
        if (response.ok) {
          results.push({
            id: item.id,
            name: item.name || '',
            portal: item.portal || '',
            original_url: originalUrl,
            fixed_url: fixedUrl,
            status: 'working'
          })
        } else {
          results.push({
            id: item.id,
            name: item.name || '',
            original_url: originalUrl,
            fixed_url: fixedUrl,
            status: 'failed',
            status_code: response.status
          })
        }
      } catch (err) {
        results.push({
          id: item.id,
          name: item.name || '',
          original_url: originalUrl,
          fixed_url: fixedUrl,
          status: 'error',
          error: err.message
        })
      }
    }

    const workingCount = results.filter(r => r.status === 'working').length
    console.log(`Found ${workingCount} working URLs after double encoding`)

    return NextResponse.json({
      success: true,
      total_tested: urls.length,
      working_count: workingCount,
      results: results
    })

  } catch (error) {
    console.error('Test double encoded URLs error:', error)
    return NextResponse.json({ error: 'Internal server error', details: error.message }, { status: 500 })
  }
}