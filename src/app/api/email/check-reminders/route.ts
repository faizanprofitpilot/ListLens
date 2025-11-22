import { NextResponse } from 'next/server'
import { sendLowCreditsEmail, sendStarterUpsellEmail, sendReactivationEmail } from '@/lib/email/service'
import { createSupabaseServerClient } from '@/lib/supabaseServer'

export async function POST(request: Request) {
  // Verify cron secret for security (for external cron services)
  // Vercel cron jobs automatically include a vercel-cron header
  const authHeader = request.headers.get('authorization')
  const vercelCron = request.headers.get('x-vercel-cron')
  
  // Allow if it's a Vercel cron job OR if authorization header matches
  if (!vercelCron && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const supabase = await createSupabaseServerClient()
    const now = new Date()
    const threeDaysAgo = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000)

    // 1. Day 3 Reactivation: Users with 0-1 edits used, signed up 3 days ago
    const { data: reactivationUsers, error: reactivationError } = await supabase
      .from('users')
      .select('id, email, free_edits_used, created_at, reactivation_email_sent_at')
      .eq('plan', 'free')
      .lte('free_edits_used', 1) // 0 or 1 edits used
      .lt('created_at', threeDaysAgo.toISOString()) // Signed up 3+ days ago
      .is('reactivation_email_sent_at', null) // Haven't been emailed yet

    if (reactivationError) {
      console.error('Error fetching reactivation users:', reactivationError)
    } else if (reactivationUsers) {
      for (const user of reactivationUsers) {
        const createdAt = new Date(user.created_at)
        const daysSinceSignup = Math.floor((now.getTime() - createdAt.getTime()) / (24 * 60 * 60 * 1000))
        
        // Send if exactly 3 days since signup (or more)
        if (daysSinceSignup >= 3) {
          const firstName = user.email?.split('@')[0]
          const result = await sendReactivationEmail({
            to: user.email,
            firstName,
          })

          if (result.success) {
            await supabase
              .from('users')
              .update({ 
                reactivation_email_sent_at: new Date().toISOString()
              })
              .eq('id', user.id)
          }
        }
      }
    }

    // 2. Low-credits email: Users with 3 edits used (2 remaining) - promote Starter Plan
    const { data: lowCreditUsers, error: lowCreditError } = await supabase
      .from('users')
      .select('id, email, free_edits_used, low_credits_email_sent_at')
      .eq('plan', 'free')
      .eq('free_edits_used', 3) // Exactly 3 used = 2 remaining
      .is('low_credits_email_sent_at', null) // Haven't been emailed yet

    if (lowCreditError) {
      console.error('Error fetching low credit users:', lowCreditError)
    } else if (lowCreditUsers) {
      for (const user of lowCreditUsers) {
        const firstName = user.email?.split('@')[0]
        const result = await sendLowCreditsEmail({
          to: user.email,
          firstName,
        })

        if (result.success) {
          await supabase
            .from('users')
            .update({ 
              low_credits_email_sent_at: new Date().toISOString()
            })
            .eq('id', user.id)
        }
      }
    }

    // Get Starter plan users who signed up 21 days ago and haven't been upsold
    const twentyOneDaysAgo = new Date(now.getTime() - 21 * 24 * 60 * 60 * 1000)
    const { data: starterUsers, error: starterError } = await supabase
      .from('users')
      .select('id, email, plan, created_at, starter_upsell_email_sent_at')
      .eq('plan', 'starter')
      .is('starter_upsell_email_sent_at', null)
      .lt('created_at', twentyOneDaysAgo.toISOString())

    if (starterError) {
      console.error('Error fetching starter users:', starterError)
    } else if (starterUsers) {
      for (const user of starterUsers) {
        const createdAt = new Date(user.created_at)
        const daysSinceSignup = Math.floor((now.getTime() - createdAt.getTime()) / (24 * 60 * 60 * 1000))
        
        if (daysSinceSignup >= 21) {
          const firstName = user.email?.split('@')[0]
          const result = await sendStarterUpsellEmail({
            to: user.email,
            firstName,
          })

          if (result.success) {
            await supabase
              .from('users')
              .update({ 
                starter_upsell_email_sent_at: new Date().toISOString()
              })
              .eq('id', user.id)
          }
        }
      }
    }

    return NextResponse.json({ 
      success: true,
      reactivationEmailsSent: reactivationUsers?.length || 0,
      lowCreditEmailsSent: lowCreditUsers?.length || 0,
      starterUpsellEmailsSent: starterUsers?.length || 0
    })
  } catch (error) {
    console.error('Error in check reminders cron:', error)
    return NextResponse.json(
      { error: 'Failed to process reminders' },
      { status: 500 }
    )
  }
}

