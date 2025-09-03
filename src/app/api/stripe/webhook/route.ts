import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { supabase } from '@/lib/supabaseClient'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-12-18.acacia',
})

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!

export async function POST(request: NextRequest) {
  try {
    const body = await request.text()
    const signature = request.headers.get('stripe-signature')!

    let event: Stripe.Event

    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret)
    } catch (err) {
      console.error('Webhook signature verification failed:', err)
      return NextResponse.json(
        { error: 'Webhook signature verification failed' },
        { status: 400 }
      )
    }

    // Handle the event
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session
        
        if (session.mode === 'subscription') {
          const userId = session.metadata?.userId
          
          if (userId) {
            // Update user to Pro status
            const { error } = await supabase
              .from('users')
              .update({ 
                is_pro: true,
                stripe_customer_id: session.customer as string
              })
              .eq('id', userId)

            if (error) {
              console.error('Error updating user to Pro:', error)
            } else {
              console.log(`User ${userId} upgraded to Pro`)
            }
          }
        }
        break
      }

      case 'customer.subscription.deleted':
      case 'customer.subscription.canceled': {
        const subscription = event.data.object as Stripe.Subscription
        
        // Find user by customer ID
        const { data: user, error: fetchError } = await supabase
          .from('users')
          .select('id')
          .eq('stripe_customer_id', subscription.customer)
          .single()

        if (!fetchError && user) {
          // Downgrade user from Pro status
          const { error } = await supabase
            .from('users')
            .update({ is_pro: false })
            .eq('id', user.id)

          if (error) {
            console.error('Error downgrading user from Pro:', error)
          } else {
            console.log(`User ${user.id} downgraded from Pro`)
          }
        }
        break
      }

      case 'invoice.payment_succeeded': {
        const invoice = event.data.object as Stripe.Invoice
        
        if (invoice.subscription) {
          // Find user by customer ID
          const { data: user, error: fetchError } = await supabase
            .from('users')
            .select('id')
            .eq('stripe_customer_id', invoice.customer)
            .single()

          if (!fetchError && user) {
            // Ensure user is Pro (in case of failed webhook)
            const { error } = await supabase
              .from('users')
              .update({ is_pro: true })
              .eq('id', user.id)

            if (error) {
              console.error('Error ensuring user Pro status:', error)
            } else {
              console.log(`User ${user.id} Pro status confirmed`)
            }
          }
        }
        break
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice
        
        if (invoice.subscription) {
          // Find user by customer ID
          const { data: user, error: fetchError } = await supabase
            .from('users')
            .select('id')
            .eq('stripe_customer_id', invoice.customer)
            .single()

          if (!fetchError && user) {
            // Downgrade user from Pro status due to failed payment
            const { error } = await supabase
              .from('users')
              .update({ is_pro: false })
              .eq('id', user.id)

            if (error) {
              console.error('Error downgrading user due to failed payment:', error)
            } else {
              console.log(`User ${user.id} downgraded due to failed payment`)
            }
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
    return NextResponse.json(
      { error: 'Webhook handler failed' },
      { status: 500 }
    )
  }
}
