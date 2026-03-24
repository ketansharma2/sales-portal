import { NextResponse } from 'next/server'

export async function POST(request) {
  try {
    return NextResponse.json({
      success: true,
      message: 'Test route working',
    })
  } catch (error) {
    console.error('Test route error:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    )
  }
}
