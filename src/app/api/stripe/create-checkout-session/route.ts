import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { supabase } from '@/lib/supabaseClient'
import { authenticateRequest } from '@/lib/authMiddleware'
import { UserService } from '@/lib/userService'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-12-18.acacia',
})

export async function POST(request: NextRequest) {
  try {
    // Authenticate user
    const { user, error: authError } = await authenticateRequest(request)
    if (authError || !user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    const { plan = 'pro' } = await request.json()

    // Validate plan type
    if (!['pro', 'turbo'].includes(plan)) {
      return NextResponse.json(
        { error: 'Invalid plan type. Must be "pro" or "turbo"' },
        { status: 400 }
      )
    }

    // Get or create user record using UserService (has fallback logic)
    const userData = await UserService.getUser(user.id, user.email!)

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
        email: user.email!,
        metadata: {
          userId: user.id,
        },
      })
      customerId = customer.id

      // Save customer ID to Supabase
      await supabase
        .from('users')
        .update({ stripe_customer_id: customerId })
        .eq('id', user.id)
    }

    // Get the correct price ID based on plan
    const priceId = plan === 'pro' 
      ? process.env.STRIPE_PRO_PRICE_ID
      : process.env.STRIPE_TURBO_PRICE_ID

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
      success_url: `${request.nextUrl.origin}/?success=true&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${request.nextUrl.origin}/?canceled=true`,
      metadata: {
        userId: userId,
        plan: plan,
      },
    })

    return NextResponse.json({ sessionId: session.id, url: session.url })
  } catch (error) {
    console.error('Error creating checkout session:', error)
    return NextResponse.json(
      { error: 'Failed to create checkout session' },
      { status: 500 }
    )
  }
}
