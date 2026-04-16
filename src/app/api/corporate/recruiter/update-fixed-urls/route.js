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

    console.log(`Updating ${urls.length} CV URLs in database...`)

    const updates = []
    const errors = []

    for (const item of urls) {
      if (!item.fixed_url || item.status !== 'working') continue

      try {
        const { error: updateError } = await supabaseServer
          .from('cv_parsing')
          .update({ cv_url: item.fixed_url })
          .eq('id', item.id)

        if (updateError) {
          errors.push({ id: item.id, error: updateError.message })
        } else {
          updates.push({
            id: item.id,
            name: item.name,
            old_url: item.original_url,
            new_url: item.fixed_url
          })
        }
      } catch (err) {
        errors.push({ id: item.id, error: err.message })
      }
    }

    console.log(`Updated ${updates.length} URLs successfully`)

    return NextResponse.json({
      success: true,
      total_updated: updates.length,
      updated: updates,
      errors: errors
    })

  } catch (error) {
    console.error('Update CV URLs error:', error)
    return NextResponse.json({ error: 'Internal server error', details: error.message }, { status: 500 })
  }
}