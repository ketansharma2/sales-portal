import { supabaseServer } from '@/lib/supabase-server'
import { NextResponse } from 'next/server'

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

    const formData = await request.formData()
    const file = formData.get('file')
    const fileType = formData.get('fileType') // 'kyc_doc' or 'email_ss'

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    if (!fileType || !['kyc_doc', 'email_ss'].includes(fileType)) {
      return NextResponse.json({ error: 'Invalid file type' }, { status: 400 })
    }

    // Generate unique filename
    const fileExt = file.name.split('.').pop()
    const fileName = `${user.id}_${fileType}_${Date.now()}.${fileExt}`

    // Determine bucket based on file type
    const bucketName = fileType === 'kyc_doc' ? 'kyc_doc' : 'email_ss';

    // Upload to Supabase storage
    const { data: uploadData, error: uploadError } = await supabaseServer.storage
      .from(bucketName)
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: false
      })

    if (uploadError) {
      console.error('Upload error:', uploadError)
      return NextResponse.json({
        error: 'Failed to upload file',
        details: uploadError.message
      }, { status: 500 })
    }

    // Get public URL
    const { data: { publicUrl } } = supabaseServer.storage
      .from(bucketName)
      .getPublicUrl(fileName)

    return NextResponse.json({
      success: true,
      url: publicUrl
    })

  } catch (error) {
    console.error('File upload API error:', error)
    return NextResponse.json({
      error: 'Internal server error',
      details: error.message
    }, { status: 500 })
  }
}