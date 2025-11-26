import { NextRequest, NextResponse } from 'next/server'
import { sendReactivationEmail } from '@/lib/email/service'

// Test endpoint to send reactivation (Day-3) email
// Only works in development mode
export async function POST(request: NextRequest) {
  // Only allow in development
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: 'Not available in production' }, { status: 403 })
  }

  try {
    const { email, firstName } = await request.json()

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 })
    }

    const testName = firstName || email.split('@')[0]

    const result = await sendReactivationEmail({ 
      to: email, 
      firstName: testName 
    })

    if (result.success) {
      return NextResponse.json({
        success: true,
        message: 'Day-3 Reactivation email sent!',
        emailId: result.id
      })
    }

    return NextResponse.json({
      success: false,
      error: result.error
    }, { status: 500 })
  } catch (error) {
    console.error('Error sending reactivation email:', error)
    return NextResponse.json(
      { error: 'Failed to send email', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

