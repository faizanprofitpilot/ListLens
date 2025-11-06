import { NextResponse } from 'next/server'
import { sendLowCreditsEmail, sendStarterUpsellEmail } from '@/lib/email/service'
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

    // Get users with low credits (1-2 remaining) who haven't been emailed recently
    const { data: lowCreditUsers, error: lowCreditError } = await supabase
      .from('users')
      .select('id, email, free_edits_used, last_activity_at, low_credits_email_sent_at')
      .eq('plan', 'free')
      .in('free_edits_used', [3, 4]) // 1 or 2 remaining (out of 5)
      .is('low_credits_email_sent_at', null) // Haven't been emailed yet

    if (lowCreditError) {
      console.error('Error fetching low credit users:', lowCreditError)
    } else if (lowCreditUsers) {
      for (const user of lowCreditUsers) {
        const remaining = 5 - (user.free_edits_used || 0)
        const isInactive = !user.last_activity_at || new Date(user.last_activity_at) < threeDaysAgo
        
        // Send if low credits OR inactive
        if ((remaining >= 1 && remaining <= 2) || isInactive) {
          const firstName = user.email?.split('@')[0]
          const result = await sendLowCreditsEmail({
            to: user.email,
            firstName,
            remainingCredits: remaining,
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

