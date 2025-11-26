import { NextRequest, NextResponse } from 'next/server'
import { sendWelcomeEmail, sendLowCreditsEmail, sendStarterUpsellEmail, sendReactivationEmail, sendDay7Email } from '@/lib/email/service'

// Test endpoint to send all email types
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

    // Send all email types
    const results = {
      welcome: await sendWelcomeEmail({ to: email, firstName: testName }),
      lowCredits: await sendLowCreditsEmail({ 
        to: email, 
        firstName: testName
      }),
      starterUpsell: await sendStarterUpsellEmail({ 
        to: email, 
        firstName: testName 
      }),
      reactivation: await sendReactivationEmail({
        to: email,
        firstName: testName
      }),
      day7: await sendDay7Email({
        to: email,
        firstName: testName
      }),
    }

    return NextResponse.json({
      success: true,
      message: 'All test emails sent!',
      results: {
        welcome: results.welcome.success ? '✅ Sent' : `❌ Failed: ${JSON.stringify(results.welcome.error)}`,
        lowCredits: results.lowCredits.success ? '✅ Sent' : `❌ Failed: ${JSON.stringify(results.lowCredits.error)}`,
        starterUpsell: results.starterUpsell.success ? '✅ Sent' : `❌ Failed: ${JSON.stringify(results.starterUpsell.error)}`,
        reactivation: results.reactivation.success ? '✅ Sent' : `❌ Failed: ${JSON.stringify(results.reactivation.error)}`,
        day7: results.day7.success ? '✅ Sent' : `❌ Failed: ${JSON.stringify(results.day7.error)}`,
      },
      emailIds: {
        welcome: results.welcome.id,
        lowCredits: results.lowCredits.id,
        starterUpsell: results.starterUpsell.id,
        reactivation: results.reactivation.id,
        day7: results.day7.id,
      }
    })
  } catch (error) {
    console.error('Error sending test emails:', error)
    return NextResponse.json(
      { error: 'Failed to send test emails', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

