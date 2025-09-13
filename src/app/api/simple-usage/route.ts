import { NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabaseServer'

export async function GET() {
  const supabase = await createSupabaseServerClient()
  const { data: { user }, error } = await supabase.auth.getUser()
  
  if (error || !user) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
  }

  // Get user's current usage from users table
  const { data: userData, error: userError } = await supabase
    .from('users')
    .select('free_edits_used, monthly_edits_used, is_pro, plan, last_reset_date')
    .eq('id', user.id)
    .single()

  if (userError) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 })
  }

  // Check if monthly reset is needed for Pro/Turbo users
  const now = new Date()
  const lastReset = new Date(userData.last_reset_date || now.toISOString())
  const needsReset = userData.plan !== 'free' && 
    (now.getMonth() !== lastReset.getMonth() || now.getFullYear() !== lastReset.getFullYear())

  if (needsReset) {
    // Reset monthly usage
    await supabase
      .from('users')
      .update({ 
        monthly_edits_used: 0,
        last_reset_date: now.toISOString()
      })
      .eq('id', user.id)
    
    userData.monthly_edits_used = 0
  }

  // Calculate usage and quota based on plan
  const plan = userData.plan || 'free'
  const used = plan === 'free' ? (userData.free_edits_used || 0) : (userData.monthly_edits_used || 0)
  const quota = plan === 'free' ? 5 : plan === 'pro' ? 350 : 2000
  const remaining = Math.max(0, quota - used)

  return NextResponse.json({
    used,
    remaining,
    isPro: userData.is_pro || false,
    quota,
    plan
  })
}

export async function POST() {
  const supabase = await createSupabaseServerClient()
  const { data: { user }, error } = await supabase.auth.getUser()
  
  if (error || !user) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
  }

  // Get current usage
  const { data: userData, error: userError } = await supabase
    .from('users')
    .select('free_edits_used, monthly_edits_used, is_pro, plan, last_reset_date')
    .eq('id', user.id)
    .single()

  if (userError) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 })
  }

  // Check if monthly reset is needed for Pro/Turbo users
  const now = new Date()
  const lastReset = new Date(userData.last_reset_date || now.toISOString())
  const needsReset = userData.plan !== 'free' && 
    (now.getMonth() !== lastReset.getMonth() || now.getFullYear() !== lastReset.getFullYear())

  if (needsReset) {
    // Reset monthly usage
    await supabase
      .from('users')
      .update({ 
        monthly_edits_used: 0,
        last_reset_date: now.toISOString()
      })
      .eq('id', user.id)
    
    userData.monthly_edits_used = 0
  }

  const plan = userData.plan || 'free'
  const quota = plan === 'free' ? 5 : plan === 'pro' ? 350 : 2000
  const currentUsed = plan === 'free' ? (userData.free_edits_used || 0) : (userData.monthly_edits_used || 0)
  
  // Check if user has remaining credits
  if (currentUsed >= quota) {
    return NextResponse.json({ 
      error: `Usage limit reached. You have used ${currentUsed} of ${quota} ${plan === 'free' ? 'total' : 'monthly'} edits.`,
      upgradeRequired: plan === 'free'
    }, { status: 402 })
  }

  // Increment usage based on plan
  const newUsage = currentUsed + 1
  const updateData = plan === 'free' 
    ? { free_edits_used: newUsage }
    : { monthly_edits_used: newUsage }
  
  const { error: updateError } = await supabase
    .from('users')
    .update(updateData)
    .eq('id', user.id)

  if (updateError) {
    return NextResponse.json({ error: 'Failed to update usage' }, { status: 500 })
  }

  return NextResponse.json({
    success: true,
    used: newUsage,
    remaining: Math.max(0, quota - newUsage),
    plan
  })
}
