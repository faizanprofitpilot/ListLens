import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { supabase } from '@/lib/supabaseClient'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-08-27.basil',
})

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!

export async function POST(request: NextRequest) {
  try {
    const body = await request.text()
    const signature = request.headers.get('stripe-signature')!

    const event = stripe.webhooks.constructEvent(body, signature, webhookSecret)

    // Handle the event
    switch (event.type) {
      case 'customer.subscription.created':
      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription
        
        // Find user by customer ID
        const { data: user, error: fetchError } = await supabase
          .from('users')
          .select('id')
          .eq('stripe_customer_id', subscription.customer)
          .single()

        if (!fetchError && user) {
          // Update user to Pro
          const { error } = await supabase
            .from('users')
            .update({ is_pro: true })
            .eq('id', user.id)

          if (error) {
            console.error('Error updating user to Pro:', error)
          }
        }
        break
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription
        
        // Find user by customer ID
        const { data: user, error: fetchError } = await supabase
          .from('users')
          .select('id')
          .eq('stripe_customer_id', subscription.customer)
          .single()

        if (!fetchError && user) {
          // Update user to free
          const { error } = await supabase
            .from('users')
            .update({ is_pro: false })
            .eq('id', user.id)

          if (error) {
            console.error('Error updating user to free:', error)
          }
        }
        break
      }

      default:
        console.log(`Unhandled event type: ${event.type}`)
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error('Webhook error:', error)
    return NextResponse.json({ error: 'Webhook failed' }, { status: 400 })
  }
}