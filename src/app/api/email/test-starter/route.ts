import { NextRequest, NextResponse } from 'next/server'
import { sendStarterUpsellEmail } from '@/lib/email/service'

// Test endpoint to send starter upsell email
// Only works in development mode
export async function POST(request: NextRequest) {
  try {
    const { email, firstName } = await request.json()

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 })
    }

    const testName = firstName || email.split('@')[0]

    const result = await sendStarterUpsellEmail({ 
      to: email, 
      firstName: testName 
    })

    if (result.success) {
      return NextResponse.json({
        success: true,
        message: 'Starter upsell email sent!',
        emailId: result.id
      })
    }

    return NextResponse.json({
      success: false,
      error: result.error
    }, { status: 500 })
  } catch (error) {
    console.error('Error sending starter upsell email:', error)
    return NextResponse.json(
      { error: 'Failed to send email', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

