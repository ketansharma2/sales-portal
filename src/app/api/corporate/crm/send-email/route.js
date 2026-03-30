import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import nodemailer from 'nodemailer';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

// Gmail SMTP configuration using App Password
const GMAIL_EMAIL = process.env.GMAIL_SENDER_EMAIL;
const GMAIL_APP_PASSWORD = process.env.GMAIL_APP_PASSWORD;

export async function POST(request) {
  try {
    const { to, subject, htmlBody } = await request.json();

    if (!to || !subject || !htmlBody) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: to, subject, htmlBody' },
        { status: 400 }
      );
    }

    // Check if SMTP is configured
    if (!GMAIL_EMAIL || !GMAIL_APP_PASSWORD) {
      return NextResponse.json({
        success: false,
        error: 'Email service not configured',
        setupRequired: true
      }, { status: 500 });
    }

    // Create nodemailer transporter
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: GMAIL_EMAIL,
        pass: GMAIL_APP_PASSWORD
      }
    });

    // Send email
    const info = await transporter.sendMail({
      from: `"Maven Jobs" <${GMAIL_EMAIL}>`,
      to: to,
      subject: subject,
      html: htmlBody
    });

    console.log('Email sent successfully:', info.messageId);

    return NextResponse.json({
      success: true,
      messageId: info.messageId
    });

  } catch (error) {
    console.error('Error sending email:', error);
    return NextResponse.json({ 
      success: false, 
      error: error.message 
    }, { status: 500 });
  }
}

export async function GET(request) {
  const isConfigured = !!(GMAIL_EMAIL && GMAIL_APP_PASSWORD);
  
  return NextResponse.json({
    configured: isConfigured,
    email: GMAIL_EMAIL ? 'configured' : 'not set',
    appPassword: GMAIL_APP_PASSWORD ? 'set' : 'not set'
  });
}
