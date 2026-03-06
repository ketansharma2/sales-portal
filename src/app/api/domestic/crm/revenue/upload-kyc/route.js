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
    const revenueId = formData.get('revenue_id')

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    // Generate unique filename
    const fileExt = file.name.split('.').pop()
    const timestamp = Date.now()
    const fileName = revenueId 
      ? `${revenueId}_kyc_${timestamp}.${fileExt}`
      : `new_${user.id}_kyc_${timestamp}.${fileExt}`

    // Upload to Supabase storage bucket (use same bucket as corporate)
    const bucketName = 'revenue_kyc_docs'
    
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

    // If revenue_id is provided, update the revenue record with the URL
    if (revenueId) {
      const { data: updatedRevenue, error: updateError } = await supabaseServer
        .from('domestic_crm_revenue')
        .update({ kyc_link: publicUrl })
        .eq('id', revenueId)
        .select()
        .single()

      if (updateError) {
        console.error('Update revenue error:', updateError)
        // Still return the URL even if update fails
      }
      
      return NextResponse.json({
        success: true,
        url: publicUrl,
        revenue: updatedRevenue
      })
    }

    return NextResponse.json({
      success: true,
      url: publicUrl
    })

  } catch (error) {
    console.error('KYC upload API error:', error)
    return NextResponse.json({
      error: 'Internal server error',
      details: error.message
    }, { status: 500 })
  }
}
