import { NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabaseServer'

export async function GET() {
  try {
    const supabase = await createSupabaseServerClient()
    const { data: { user }, error } = await supabase.auth.getUser()
    
    if (error || !user) {
      return NextResponse.json({ 
        error: 'Not authenticated' 
      }, { status: 401 })
    }

    // Get user data from database
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('id, email, is_pro, stripe_customer_id, free_edits_used, created_at, updated_at')
      .eq('id', user.id)
      .single()

    if (userError) {
      return NextResponse.json({ 
        error: 'User not found in database',
        details: userError.message 
      }, { status: 404 })
    }

    // Test usage calculation
    const used = userData.free_edits_used || 0
    const isPro = userData.is_pro || false
    const remaining = isPro ? 999 : Math.max(0, 5 - used)

    return NextResponse.json({
      success: true,
      auth: {
        userId: user.id,
        email: user.email,
        authenticated: true
      },
      database: {
        userExists: true,
        isPro: userData.is_pro,
        stripeCustomerId: userData.stripe_customer_id,
        freeEditsUsed: userData.free_edits_used
      },
      credits: {
        used,
        remaining,
        isPro,
        quota: isPro ? 999 : 5,
        plan: isPro ? 'pro' : 'free'
      },
      flow: {
        authCallback: '✅ Working',
        userCreation: '✅ Working',
        subscriptionFlow: userData.stripe_customer_id ? '✅ Ready' : '⏳ No subscription',
        creditCalculation: '✅ Working'
      }
    })

  } catch (error) {
    console.error('Test complete flow error:', error)
    return NextResponse.json({ 
      error: 'Server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
