import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createSupabaseServerClient } from '@/lib/supabaseServer'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-08-27.basil',
})

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!

export async function POST(request: NextRequest) {
  try {
    const body = await request.text()
    const signature = request.headers.get('stripe-signature')!

    const event = stripe.webhooks.constructEvent(body, signature, webhookSecret)
    
    // Create server-side Supabase client
    const supabase = await createSupabaseServerClient()

    console.log(`Processing webhook event: ${event.type}`)

    // Handle the event
    switch (event.type) {
      case 'customer.subscription.created':
      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription
        
        console.log(`Processing subscription ${subscription.id} for customer ${subscription.customer}`)
        console.log(`Subscription status: ${subscription.status}, cancel_at_period_end: ${subscription.cancel_at_period_end}`)
        
        // Find user by customer ID
        const { data: user, error: fetchError } = await supabase
          .from('users')
          .select('id, email, is_pro')
          .eq('stripe_customer_id', subscription.customer)
          .single()

        if (fetchError) {
          console.error('Error finding user by customer ID:', fetchError)
          return NextResponse.json({ error: 'User not found' }, { status: 404 })
        }

        if (user) {
          console.log(`Found user ${user.email} (${user.id}), current is_pro: ${user.is_pro}`)
          
          // Determine if user should be Pro based on subscription status
          const shouldBePro = subscription.status === 'active' && !subscription.cancel_at_period_end
          
          // Update user Pro status
          const { error: updateError } = await supabase
            .from('users')
            .update({ 
              is_pro: shouldBePro,
              updated_at: new Date().toISOString()
            })
            .eq('id', user.id)

          if (updateError) {
            console.error('Error updating user Pro status:', updateError)
            return NextResponse.json({ error: 'Failed to update user' }, { status: 500 })
          }
          
          console.log(`Successfully updated user ${user.email} to ${shouldBePro ? 'Pro' : 'Free'}`)
        }
        break
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription
        
        console.log(`Processing subscription deletion ${subscription.id} for customer ${subscription.customer}`)
        
        // Find user by customer ID
        const { data: user, error: fetchError } = await supabase
          .from('users')
          .select('id, email, is_pro')
          .eq('stripe_customer_id', subscription.customer)
          .single()

        if (fetchError) {
          console.error('Error finding user by customer ID:', fetchError)
          return NextResponse.json({ error: 'User not found' }, { status: 404 })
        }

        if (user) {
          console.log(`Found user ${user.email} (${user.id}), current is_pro: ${user.is_pro}`)
          
          // Update user to free
          const { error: updateError } = await supabase
            .from('users')
            .update({ 
              is_pro: false,
              updated_at: new Date().toISOString()
            })
            .eq('id', user.id)

          if (updateError) {
            console.error('Error updating user to free:', updateError)
            return NextResponse.json({ error: 'Failed to update user' }, { status: 500 })
          }
          
          console.log(`Successfully updated user ${user.email} to free`)
        }
        break
      }

      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session
        
        console.log(`Checkout session completed: ${session.id}`)
        console.log(`Customer: ${session.customer}, Metadata:`, session.metadata)
        
        // This event fires when payment is successful
        // The subscription events above will handle the actual user update
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