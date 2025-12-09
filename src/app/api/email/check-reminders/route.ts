import { NextResponse } from 'next/server'
import { sendLowCreditsEmail, sendStarterUpsellEmail, sendReactivationEmail, sendDay7Email } from '@/lib/email/service'
import { createSupabaseServiceClient } from '@/lib/supabaseServer'

// Helper function to add delay (Resend rate limit: 2 requests/second)
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

// Shared handler function for both GET and POST
async function handleCheckReminders(request: Request) {
  // Verify cron secret for security (for external cron services)
  // Vercel cron jobs have User-Agent: vercel-cron/1.0
  const authHeader = request.headers.get('authorization')
  const vercelCron = request.headers.get('x-vercel-cron')
  const userAgent = request.headers.get('user-agent') || ''
  
  // Allow if it's a Vercel cron job (check User-Agent or x-vercel-cron header)
  // OR if authorization header matches
  const isVercelCron = userAgent.includes('vercel-cron') || vercelCron === '1'
  const hasValidAuth = authHeader === `Bearer ${process.env.CRON_SECRET}`
  
  if (!isVercelCron && !hasValidAuth) {
    console.error('[Email Cron] Unauthorized request:', {
      userAgent,
      hasVercelCronHeader: !!vercelCron,
      hasAuthHeader: !!authHeader,
      isVercelCron,
      hasValidAuth
    })
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  console.log('[Email Cron] ✅ Authorized request:', {
    userAgent,
    isVercelCron,
    hasValidAuth
  })

  try {
    // Use service role client to bypass RLS policies for cron job
    const supabase = createSupabaseServiceClient()
    const now = new Date()
    const threeDaysAgo = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000)
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)

    console.log('[Email Cron] Starting check at:', now.toISOString())
    console.log('[Email Cron] Three days ago threshold:', threeDaysAgo.toISOString())
    console.log('[Email Cron] Seven days ago threshold:', sevenDaysAgo.toISOString())

    let reactivationEmailsSent = 0
    let reactivationEmailsFailed = 0
    let day7EmailsSent = 0
    let day7EmailsFailed = 0

    // 1. Day 3 Reactivation: Users on free plan, signed up 3 days ago
    const { data: reactivationUsers, error: reactivationError } = await supabase
      .from('users')
      .select('id, email, created_at, reactivation_email_sent_at')
      .eq('plan', 'free')
      .lte('created_at', threeDaysAgo.toISOString()) // Signed up 3+ days ago
      .is('reactivation_email_sent_at', null) // Haven't been emailed yet

    if (reactivationError) {
      console.error('[Email Cron] Error fetching reactivation users:', reactivationError)
    } else {
      console.log(`[Email Cron] Found ${reactivationUsers?.length || 0} potential Day 3 reactivation users`)
      
      if (reactivationUsers && reactivationUsers.length > 0) {
        for (const user of reactivationUsers) {
          const createdAt = new Date(user.created_at)
          const daysSinceSignup = Math.floor((now.getTime() - createdAt.getTime()) / (24 * 60 * 60 * 1000))
          
          console.log(`[Email Cron] Day 3 check - User ${user.email}: created ${daysSinceSignup} days ago`)
          
          // Send if exactly 3 days since signup (or more)
          if (daysSinceSignup >= 3) {
            const firstName = user.email?.split('@')[0]
            console.log(`[Email Cron] Sending Day 3 reactivation email to ${user.email}`)
            
            const result = await sendReactivationEmail({
              to: user.email,
              firstName,
            })

            // Respect Resend rate limit (2 requests/second)
            await delay(600)

            if (result.success) {
              const updateResult = await supabase
                .from('users')
                .update({ 
                  reactivation_email_sent_at: new Date().toISOString()
                })
                .eq('id', user.id)
              
              if (updateResult.error) {
                console.error(`[Email Cron] Failed to update reactivation_email_sent_at for ${user.email}:`, updateResult.error)
              } else {
                console.log(`[Email Cron] ✅ Day 3 reactivation email sent successfully to ${user.email}`)
                reactivationEmailsSent++
              }
            } else {
              console.error(`[Email Cron] ❌ Failed to send Day 3 reactivation email to ${user.email}:`, result.error)
              reactivationEmailsFailed++
            }
          } else {
            console.log(`[Email Cron] Skipping ${user.email} - only ${daysSinceSignup} days since signup (need 3+)`)
          }
        }
      }
    }

    // 2. Day 7 email: Users on free plan, signed up 7 days ago
    const { data: day7Users, error: day7Error } = await supabase
      .from('users')
      .select('id, email, created_at, day7_email_sent_at')
      .eq('plan', 'free') // Still on free plan
      .lte('created_at', sevenDaysAgo.toISOString()) // Signed up 7+ days ago
      .is('day7_email_sent_at', null) // Haven't been emailed yet

    if (day7Error) {
      console.error('[Email Cron] Error fetching Day 7 users:', day7Error)
    } else {
      console.log(`[Email Cron] Found ${day7Users?.length || 0} potential Day 7 users`)
      
      if (day7Users && day7Users.length > 0) {
        for (const user of day7Users) {
          const createdAt = new Date(user.created_at)
          const daysSinceSignup = Math.floor((now.getTime() - createdAt.getTime()) / (24 * 60 * 60 * 1000))
          
          console.log(`[Email Cron] Day 7 check - User ${user.email}: created ${daysSinceSignup} days ago`)
          
          // Send if exactly 7 days since signup (or more)
          if (daysSinceSignup >= 7) {
            const firstName = user.email?.split('@')[0]
            console.log(`[Email Cron] Sending Day 7 email to ${user.email}`)
            
            const result = await sendDay7Email({
              to: user.email,
              firstName,
            })

            // Respect Resend rate limit (2 requests/second)
            await delay(600)

            if (result.success) {
              const updateResult = await supabase
                .from('users')
                .update({ 
                  day7_email_sent_at: new Date().toISOString()
                })
                .eq('id', user.id)
              
              if (updateResult.error) {
                console.error(`[Email Cron] Failed to update day7_email_sent_at for ${user.email}:`, updateResult.error)
              } else {
                console.log(`[Email Cron] ✅ Day 7 email sent successfully to ${user.email}`)
                day7EmailsSent++
              }
            } else {
              console.error(`[Email Cron] ❌ Failed to send Day 7 email to ${user.email}:`, result.error)
              day7EmailsFailed++
            }
          } else {
            console.log(`[Email Cron] Skipping ${user.email} - only ${daysSinceSignup} days since signup (need 7+)`)
          }
        }
      }
    }

    // 3. Low-credits email: Users with 3 edits used (2 remaining) - promote Starter Plan
    const { data: lowCreditUsers, error: lowCreditError } = await supabase
      .from('users')
      .select('id, email, free_edits_used, low_credits_email_sent_at')
      .eq('plan', 'free')
      .eq('free_edits_used', 3) // Exactly 3 used = 2 remaining
      .is('low_credits_email_sent_at', null) // Haven't been emailed yet

    if (lowCreditError) {
      console.error('[Email Cron] Error fetching low credit users:', lowCreditError)
    } else if (lowCreditUsers) {
      console.log(`[Email Cron] Found ${lowCreditUsers.length} low credit users`)
      for (const user of lowCreditUsers) {
        const firstName = user.email?.split('@')[0]
        const result = await sendLowCreditsEmail({
          to: user.email,
          firstName,
        })

        // Respect Resend rate limit (2 requests/second)
        await delay(600)

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
      console.error('[Email Cron] Error fetching starter users:', starterError)
    } else if (starterUsers) {
      console.log(`[Email Cron] Found ${starterUsers.length} starter users for upsell`)
      for (const user of starterUsers) {
        const createdAt = new Date(user.created_at)
        const daysSinceSignup = Math.floor((now.getTime() - createdAt.getTime()) / (24 * 60 * 60 * 1000))
        
        if (daysSinceSignup >= 21) {
          const firstName = user.email?.split('@')[0]
          const result = await sendStarterUpsellEmail({
            to: user.email,
            firstName,
          })

          // Respect Resend rate limit (2 requests/second)
          await delay(600)

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

    const summary = {
      success: true,
      reactivationEmailsSent,
      reactivationEmailsFailed,
      day7EmailsSent,
      day7EmailsFailed,
      lowCreditEmailsSent: lowCreditUsers?.length || 0,
      starterUpsellEmailsSent: starterUsers?.length || 0
    }

    console.log('[Email Cron] ✅ Completed:', summary)
    return NextResponse.json(summary)
  } catch (error) {
    console.error('[Email Cron] Error in check reminders cron:', error)
    return NextResponse.json(
      { error: 'Failed to process reminders' },
      { status: 500 }
    )
  }
}

// Export both GET and POST handlers
export async function GET(request: Request) {
  return handleCheckReminders(request)
}

export async function POST(request: Request) {
  return handleCheckReminders(request)
}

