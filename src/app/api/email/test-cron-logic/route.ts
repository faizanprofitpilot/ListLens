import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabaseServer'

// Test endpoint to check cron job logic without sending emails
// Only works in development mode
export async function GET(request: NextRequest) {
  // Only allow in development
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: 'Not available in production' }, { status: 403 })
  }

  try {
    const supabase = await createSupabaseServerClient()
    const now = new Date()
    const threeDaysAgo = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000)
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)

    // Test Day-3 Reactivation query
    const { data: reactivationUsers, error: reactivationError } = await supabase
      .from('users')
      .select('id, email, created_at, reactivation_email_sent_at, plan, free_edits_used')
      .eq('plan', 'free')
      .lt('created_at', threeDaysAgo.toISOString())
      .is('reactivation_email_sent_at', null)
      .limit(10)

    // Test Day-7 query
    const { data: day7Users, error: day7Error } = await supabase
      .from('users')
      .select('id, email, created_at, day7_email_sent_at, plan, free_edits_used')
      .eq('plan', 'free')
      .lt('created_at', sevenDaysAgo.toISOString())
      .is('day7_email_sent_at', null)
      .limit(10)

    // Calculate days since signup for each user
    const reactivationWithDays = reactivationUsers?.map(user => {
      const createdAt = new Date(user.created_at)
      const daysSinceSignup = Math.floor((now.getTime() - createdAt.getTime()) / (24 * 60 * 60 * 1000))
      return {
        ...user,
        daysSinceSignup,
        eligible: daysSinceSignup >= 3
      }
    }) || []

    const day7WithDays = day7Users?.map(user => {
      const createdAt = new Date(user.created_at)
      const daysSinceSignup = Math.floor((now.getTime() - createdAt.getTime()) / (24 * 60 * 60 * 1000))
      return {
        ...user,
        daysSinceSignup,
        eligible: daysSinceSignup >= 7
      }
    }) || []

    return NextResponse.json({
      success: true,
      summary: {
        reactivation: {
          totalFound: reactivationUsers?.length || 0,
          eligible: reactivationWithDays.filter(u => u.eligible).length,
          error: reactivationError?.message
        },
        day7: {
          totalFound: day7Users?.length || 0,
          eligible: day7WithDays.filter(u => u.eligible).length,
          error: day7Error?.message
        }
      },
      reactivationUsers: reactivationWithDays,
      day7Users: day7WithDays,
      queryInfo: {
        now: now.toISOString(),
        threeDaysAgo: threeDaysAgo.toISOString(),
        sevenDaysAgo: sevenDaysAgo.toISOString()
      }
    })
  } catch (error) {
    console.error('Error testing cron logic:', error)
    return NextResponse.json(
      { error: 'Failed to test cron logic', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

