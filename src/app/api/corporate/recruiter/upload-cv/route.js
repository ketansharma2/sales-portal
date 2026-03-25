import { NextResponse } from 'next/server'
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3'
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

    const formData = await request.formData()
    const file = formData.get('file')
    const cvParsingId = formData.get('cv_parsing_id')

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    // Validate file type
    const allowedTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({ error: 'Invalid file type. Only PDF and DOC files are allowed' }, { status: 400 })
    }

    // Validate file size (max 10MB)
    const maxSize = 10 * 1024 * 1024
    if (file.size > maxSize) {
      return NextResponse.json({ error: 'File size exceeds 10MB limit' }, { status: 400 })
    }

    // Generate unique filename (use original file name - S3 handles URL encoding automatically)
    const fileName = `${cvParsingId}_${file.name}`

    // Convert file to buffer
    console.log('Converting file to buffer...')
    console.log('File type:', file.type)
    console.log('File size:', file.size)
    
    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)
    
    console.log('Buffer created, size:', buffer.length)

    // Create S3 client
    console.log('Creating S3 client...')
    console.log('AWS Region:', process.env.AWS_REGION || 'ap-south-1')
    console.log('AWS Access Key ID:', process.env.AWS_ACCESS_KEY_ID ? '***' + process.env.AWS_ACCESS_KEY_ID.slice(-4) : 'NOT SET')
    console.log('AWS Secret Access Key:', process.env.AWS_SECRET_ACCESS_KEY ? '***' + process.env.AWS_SECRET_ACCESS_KEY.slice(-4) : 'NOT SET')
    console.log('AWS S3 Bucket Name:', process.env.AWS_S3_BUCKET_NAME)
    
    const s3Client = new S3Client({
      region: process.env.AWS_REGION || 'ap-south-1',
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
      },
    })

    // Upload to S3
    console.log('Uploading to S3...')
    console.log('Bucket:', process.env.AWS_S3_BUCKET_NAME)
    console.log('Key:', fileName)
    console.log('Content Type:', file.type)
    
    const command = new PutObjectCommand({
      Bucket: process.env.AWS_S3_BUCKET_NAME,
      Key: fileName,
      Body: buffer,
      ContentType: file.type,
      ContentDisposition: "attachment",
    })

    await s3Client.send(command)
    console.log('S3 upload successful!')

    // Generate the S3 URL
    const s3Url = `https://${process.env.AWS_S3_BUCKET_NAME}.s3.${process.env.AWS_REGION || 'ap-south-1'}.amazonaws.com/${fileName}`

    // Update the cv_parsing record with the CV URL if cvParsingId is provided
    if (cvParsingId) {
      await supabaseServer
        .from('cv_parsing')
        .update({ cv_url: s3Url })
        .eq('id', cvParsingId)
    }

    return NextResponse.json({
      success: true,
      message: 'File uploaded successfully',
      url: s3Url,
      fileName: fileName,
    })
  } catch (error) {
    console.error('Upload CV API error:', error)
    console.error('Error name:', error.name)
    console.error('Error message:', error.message)
    console.error('Error stack:', error.stack)
    
    // Check if it's an AWS error
    if (error.$metadata) {
      console.error('AWS Error Metadata:', error.$metadata)
    }
    
    return NextResponse.json(
      {
        error: 'Internal server error',
        details: error.message,
        errorName: error.name,
        awsMetadata: error.$metadata || null
      },
      { status: 500 }
    )
  }
}
