import { NextResponse } from 'next/server'
import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3'
import { supabaseServer } from '@/lib/supabase-server'
import { getUser } from '@/lib/auth-helper';

export async function POST(request) {
  try {
    // Authentication
      const { user, error: authError } = getUser(request);
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Validate AWS configuration
    if (!process.env.AWS_ACCESS_KEY_ID || !process.env.AWS_SECRET_ACCESS_KEY) {
      return NextResponse.json(
        { error: 'AWS credentials are not configured' },
        { status: 500 }
      )
    }

    if (!process.env.AWS_S3_BUCKET_NAME) {
      return NextResponse.json(
        { error: 'AWS S3 bucket name is not configured' },
        { status: 500 }
      )
    }

    // Create S3 client
    const s3Client = new S3Client({
      region: process.env.AWS_REGION || 'ap-south-1',
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
      },
    })

    const formData = await request.formData()
    const file = formData.get('file')
    const cvParsingId = formData.get('cv_parsing_id')

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    if (!cvParsingId) {
      return NextResponse.json({ error: 'cv_parsing_id is required' }, { status: 400 })
    }

    // Get existing CV URL from database
    const { data: existingRecord, error: fetchError } = await supabaseServer
      .from('cv_parsing')
      .select('cv_url, name')
      .eq('id', cvParsingId)
      .single()

    if (fetchError && fetchError.code !== 'PGRST116') {
      console.error('Error fetching existing record:', fetchError)
    }

    // Delete old file from S3 if exists
    if (existingRecord?.cv_url) {
      try {
        // Extract key from URL
        const urlParts = existingRecord.cv_url.split('.com/')
        const oldKey = urlParts[urlParts.length - 1]
        if (oldKey) {
          const deleteCommand = new DeleteObjectCommand({
            Bucket: process.env.AWS_S3_BUCKET_NAME,
            Key: oldKey,
          })
          await s3Client.send(deleteCommand)
          console.log('Old CV deleted from S3:', oldKey)
        }
      } catch (deleteError) {
        console.error('Error deleting old CV:', deleteError)
        // Continue even if delete fails
      }
    }

    // Get candidate name
    let candidateName = 'unknown'
    if (existingRecord?.name) {
      candidateName = existingRecord.name.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase()
    }

    // Get file extension
    const extension = file.name.split('.').pop() || 'pdf'
    
    // Generate unique filename with timestamp
    const timestamp = Date.now()
    const fileName = `${cvParsingId}_${candidateName}_${timestamp}.${extension}`

    // Validate file type
    const allowedTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'image/jpeg', 'image/jpg', 'image/png']
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({ error: 'Invalid file type. Only PDF, DOC, DOCX, JPG, JPEG, and PNG files are allowed' }, { status: 400 })
    }

    // Validate file size (max 10MB)
    const maxSize = 10 * 1024 * 1024
    if (file.size > maxSize) {
      return NextResponse.json({ error: 'File size exceeds 10MB limit' }, { status: 400 })
    }

    // Convert file to buffer
    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    // Upload new file to S3
    const command = new PutObjectCommand({
      Bucket: process.env.AWS_S3_BUCKET_NAME,
      Key: fileName,
      Body: buffer,
      ContentType: file.type,
      ContentDisposition: "attachment",
    })

    await s3Client.send(command)
    console.log('New CV uploaded to S3:', fileName)

    // Generate the S3 URL
    const s3Url = `https://${process.env.AWS_S3_BUCKET_NAME}.s3.${process.env.AWS_REGION || 'ap-south-1'}.amazonaws.com/${fileName}`

    // Update the cv_parsing record with the new CV URL
    const { error: updateError } = await supabaseServer
      .from('cv_parsing')
      .update({ 
        cv_url: s3Url,
      })
      .eq('id', cvParsingId)

    if (updateError) {
      console.error('Error updating database:', updateError)
      return NextResponse.json({ error: 'Failed to update database' }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: 'CV uploaded and updated successfully',
      url: s3Url,
      fileName: fileName,
    })
  } catch (error) {
    console.error('Upload CV API error:', error)
    
    return NextResponse.json(
      {
        error: 'Internal server error',
        details: error.message,
      },
      { status: 500 }
    )
  }
}

