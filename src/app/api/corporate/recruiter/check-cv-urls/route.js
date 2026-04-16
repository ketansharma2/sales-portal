import { NextResponse } from 'next/server'
import { supabaseServer } from '@/lib/supabase-server'

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

    const { data: cvData, error: fetchError } = await supabaseServer
      .from('cv_parsing')
      .select('id, name, portal, cv_url, sector')
      .not('cv_url', 'is', null)

    if (fetchError) {
      return NextResponse.json({ error: 'Failed to fetch CV data', details: fetchError.message }, { status: 500 })
    }

    console.log(`Testing ${cvData.length} CV URLs...`)

    const brokenUrls = []

    for (const row of cvData) {
      if (!row.cv_url) continue

      try {
        const response = await fetch(row.cv_url, { method: 'HEAD', timeout: 10000 })
        
        if (!response.ok) {
          brokenUrls.push({
            id: row.id,
            name: row.name || '',
            portal: row.portal || '',
            cv_url: row.cv_url
          })
        }
      } catch (err) {
        brokenUrls.push({
          id: row.id,
          name: row.name || '',
          portal: row.portal || '',
          cv_url: row.cv_url,
          error: err.message
        })
      }
    }

    console.log(`Found ${brokenUrls.length} broken URLs`)

    return NextResponse.json({
      success: true,
      total_tested: cvData.length,
      broken_count: brokenUrls.length,
      broken_urls: brokenUrls
    })

  } catch (error) {
    console.error('Check CV URLs error:', error)
    return NextResponse.json({ error: 'Internal server error', details: error.message }, { status: 500 })
  }
}