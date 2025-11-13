import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { supabase } from '@/lib/supabaseClient'
// import { authenticateRequest } from '@/lib/authMiddleware'
import { UserService } from '@/lib/userService'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-08-27.basil',
})

export async function POST(request: NextRequest) {
  let userId: string | undefined
  let userEmail: string | undefined
  let plan: string = 'pro'
  
  try {
    const requestData = await request.json()
    userId = requestData.userId
    userEmail = requestData.userEmail
    plan = requestData.plan || 'pro'

    if (!userId || !userEmail) {
      return NextResponse.json(
        { error: 'User ID and email are required' },
        { status: 400 }
      )
    }

    // Validate plan type
    if (!['starter', 'pro', 'team'].includes(plan)) {
      return NextResponse.json(
        { error: 'Invalid plan type. Must be "starter", "pro", or "team"' },
        { status: 400 }
      )
    }

    // Get or create user record using UserService (has fallback logic)
    const userData = await UserService.getUser(userId, userEmail)

    if (userData?.is_pro) {
      return NextResponse.json(
        { error: 'User already has an active subscription' },
        { status: 400 }
      )
    }

    let customerId = userData?.stripe_customer_id

    // Create Stripe customer if doesn't exist
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: userEmail,
        metadata: {
          userId: userId,
        },
      })
      customerId = customer.id

      // Save customer ID to Supabase
      await supabase
        .from('users')
        .update({ stripe_customer_id: customerId })
        .eq('id', userId)
    }

    // Get the correct price ID based on plan
    let priceId: string | undefined
    if (plan === 'starter') {
      priceId = process.env.STRIPE_STARTER_PRICE_ID
    } else if (plan === 'pro') {
      priceId = process.env.STRIPE_PRO_PRICE_ID
    } else if (plan === 'team') {
      priceId = process.env.STRIPE_TEAM_PRICE_ID
    }

    if (!priceId) {
      return NextResponse.json({ error: 'Pricing configuration error' }, { status: 500 })
    }

    // Create checkout session
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: 'subscription',
      success_url: `${request.nextUrl.origin}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${request.nextUrl.origin}/payment-cancelled`,
      metadata: {
        userId: userId,
        plan: plan,
      },
    })

    return NextResponse.json({ sessionId: session.id, url: session.url })
        } catch (error: unknown) {
    console.error('Error creating checkout session:', error)
    console.error('Error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      userId,
      userEmail,
      plan
    })
    return NextResponse.json(
      { 
        error: 'Failed to create checkout session',
        details: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    )
  }
}
