import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { supabase } from '@/lib/supabaseClient'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-12-18.acacia',
})

export async function POST(request: NextRequest) {
  try {
    const { userId, action } = await request.json()

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 })
    }

    // Get user's Stripe customer ID
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('stripe_customer_id, email')
      .eq('id', userId)
      .single()

    if (userError || !user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    if (!user.stripe_customer_id) {
      return NextResponse.json({ error: 'No subscription found' }, { status: 404 })
    }

    // Get customer's subscriptions
    const subscriptions = await stripe.subscriptions.list({
      customer: user.stripe_customer_id,
      status: 'active',
    })

    if (subscriptions.data.length === 0) {
      return NextResponse.json({ error: 'No active subscription found' }, { status: 404 })
    }

    const subscription = subscriptions.data[0]

    switch (action) {
      case 'create_portal_session': {
        // Create Stripe Customer Portal session
        const portalSession = await stripe.billingPortal.sessions.create({
          customer: user.stripe_customer_id,
          return_url: `${request.nextUrl.origin}/?portal=return`,
        })

        return NextResponse.json({ 
          success: true, 
          url: portalSession.url 
        })
      }

      case 'cancel_subscription': {
        // Cancel the subscription at period end
        const canceledSubscription = await stripe.subscriptions.update(subscription.id, {
          cancel_at_period_end: true,
        })

        return NextResponse.json({ 
          success: true, 
          message: 'Subscription will be canceled at the end of the current billing period',
          subscription: {
            id: canceledSubscription.id,
            status: canceledSubscription.status,
            cancel_at_period_end: canceledSubscription.cancel_at_period_end,
            current_period_end: canceledSubscription.current_period_end,
          }
        })
      }

      case 'reactivate_subscription': {
        // Reactivate a subscription that was set to cancel
        const reactivatedSubscription = await stripe.subscriptions.update(subscription.id, {
          cancel_at_period_end: false,
        })

        return NextResponse.json({ 
          success: true, 
          message: 'Subscription has been reactivated',
          subscription: {
            id: reactivatedSubscription.id,
            status: reactivatedSubscription.status,
            cancel_at_period_end: reactivatedSubscription.cancel_at_period_end,
            current_period_end: reactivatedSubscription.current_period_end,
          }
        })
      }

      case 'get_subscription_info': {
        // Get subscription details
        return NextResponse.json({ 
          success: true, 
          subscription: {
            id: subscription.id,
            status: subscription.status,
            cancel_at_period_end: subscription.cancel_at_period_end,
            current_period_start: subscription.current_period_start,
            current_period_end: subscription.current_period_end,
            plan: subscription.items.data[0]?.price?.nickname || 'Pro Plan',
          }
        })
      }

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    }

  } catch (error) {
    console.error('Subscription management error:', error)
    return NextResponse.json(
      { error: 'Failed to manage subscription' },
      { status: 500 }
    )
  }
}
