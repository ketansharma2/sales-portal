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
    let files = formData.getAll('files') // Get all files as array
    const revenueId = formData.get('revenue_id')

    if (!files || files.length === 0) {
      // Check if it's single file (backward compatibility)
      const singleFile = formData.get('file')
      if (!singleFile) {
        return NextResponse.json({ error: 'No file provided' }, { status: 400 })
      }
      files = [singleFile]
    }

    const bucketName = 'revenue_kyc_docs'
    const uploadedUrls = []

    // Upload each file
    for (const file of files) {
      if (!file || !file.name) continue

      // Generate unique filename
      const fileExt = file.name.split('.').pop()
      const timestamp = Date.now()
      const randomSuffix = Math.random().toString(36).substring(2, 8)
      const fileName = revenueId 
        ? `${revenueId}_kyc_${timestamp}_${randomSuffix}.${fileExt}`
        : `new_${user.id}_kyc_${timestamp}_${randomSuffix}.${fileExt}`

      // Upload to Supabase storage bucket
      const { data: uploadData, error: uploadError } = await supabaseServer.storage
        .from(bucketName)
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: true
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

      uploadedUrls.push(publicUrl)
    }

    // If revenue_id is provided, update the revenue record with the URLs
    if (revenueId) {
      // Get existing kyc_link array
      const { data: existingRecord, error: fetchError } = await supabaseServer
        .from('corporate_crm_revenue')
        .select('kyc_link')
        .eq('id', revenueId)
        .single()

      let newKycLinks = uploadedUrls
      if (!fetchError && existingRecord && existingRecord.kyc_link) {
        // Append new URLs to existing array
        newKycLinks = [...existingRecord.kyc_link, ...uploadedUrls]
      }

      const { data: updatedRevenue, error: updateError } = await supabaseServer
        .from('corporate_crm_revenue')
        .update({ kyc_link: newKycLinks })
        .eq('id', revenueId)
        .select()
        .single()

      if (updateError) {
        console.error('Update revenue error:', updateError)
        // Still return the URLs even if update fails
      }
      
      return NextResponse.json({
        success: true,
        urls: uploadedUrls,
        all_kyc_links: newKycLinks,
        revenue: updatedRevenue
      })
    }

    return NextResponse.json({
      success: true,
      urls: uploadedUrls
    })

  } catch (error) {
    console.error('KYC upload API error:', error)
    return NextResponse.json({
      error: 'Internal server error',
      details: error.message
    }, { status: 500 })
  }
}

// DELETE endpoint to remove a specific KYC document
export async function DELETE(request) {
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

    const { searchParams } = new URL(request.url)
    const revenueId = searchParams.get('revenue_id')
    const urlToRemove = searchParams.get('url')

    if (!revenueId || !urlToRemove) {
      return NextResponse.json({ error: 'revenue_id and url are required' }, { status: 400 })
    }

    // Get existing kyc_link array
    const { data: existingRecord, error: fetchError } = await supabaseServer
      .from('corporate_crm_revenue')
      .select('kyc_link')
      .eq('id', revenueId)
      .single()

    if (fetchError) {
      return NextResponse.json({ error: 'Failed to fetch record', details: fetchError.message }, { status: 500 })
    }

    // Handle both string and array formats for backward compatibility
    let existingLinks = existingRecord.kyc_link
    if (typeof existingLinks === 'string') {
      // Convert single string to array
      existingLinks = existingLinks ? [existingLinks] : []
    } else if (!Array.isArray(existingLinks)) {
      existingLinks = []
    }

    // Filter out the URL to remove (handle URL encoding)
    const decodedUrlToRemove = decodeURIComponent(urlToRemove)
    const newKycLinks = existingLinks.filter(link => {
      const decodedLink = decodeURIComponent(link)
      return decodedLink !== decodedUrlToRemove && link !== urlToRemove
    })

    // Update the record
    const { data: updatedRevenue, error: updateError } = await supabaseServer
      .from('corporate_crm_revenue')
      .update({ kyc_link: newKycLinks })
      .eq('id', revenueId)
      .select()
      .single()

    if (updateError) {
      console.error('Update revenue error:', updateError)
      return NextResponse.json({ error: 'Failed to remove KYC document' }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      all_kyc_links: newKycLinks,
      revenue: updatedRevenue
    })

  } catch (error) {
    console.error('KYC delete API error:', error)
    return NextResponse.json({
      error: 'Internal server error',
      details: error.message
    }, { status: 500 })
  }
}
