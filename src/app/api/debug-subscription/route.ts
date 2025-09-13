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

    return NextResponse.json({
      success: true,
      user: {
        id: userData.id,
        email: userData.email,
        is_pro: userData.is_pro,
        stripe_customer_id: userData.stripe_customer_id,
        free_edits_used: userData.free_edits_used,
        created_at: userData.created_at,
        updated_at: userData.updated_at
      },
      credits: {
        used: userData.free_edits_used || 0,
        remaining: userData.is_pro ? 999 : Math.max(0, 5 - (userData.free_edits_used || 0)),
        isPro: userData.is_pro,
        quota: userData.is_pro ? 999 : 5,
        plan: userData.is_pro ? 'pro' : 'free'
      }
    })

  } catch (error) {
    console.error('Debug subscription error:', error)
    return NextResponse.json({ 
      error: 'Server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

export async function POST() {
  try {
    const supabase = await createSupabaseServerClient()
    const { data: { user }, error } = await supabase.auth.getUser()
    
    if (error || !user) {
      return NextResponse.json({ 
        error: 'Not authenticated' 
      }, { status: 401 })
    }

    // Force update user to Pro (for testing)
    const { data: updatedUser, error: updateError } = await supabase
      .from('users')
      .update({ 
        is_pro: true,
        updated_at: new Date().toISOString()
      })
      .eq('id', user.id)
      .select()
      .single()

    if (updateError) {
      return NextResponse.json({ 
        error: 'Failed to update user to Pro',
        details: updateError.message 
      }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: 'User updated to Pro status',
      user: updatedUser
    })

  } catch (error) {
    console.error('Debug subscription error:', error)
    return NextResponse.json({ 
      error: 'Server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
