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
    .select('free_edits_used, is_pro')
    .eq('id', user.id)
    .single()

  if (userError) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 })
  }

  const used = userData.free_edits_used || 0
  const isPro = userData.is_pro || false
  const remaining = isPro ? 999 : Math.max(0, 5 - used)

  return NextResponse.json({
    used,
    remaining,
    isPro,
    quota: isPro ? 999 : 5,
    plan: isPro ? 'pro' : 'free'
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
    .select('free_edits_used, is_pro')
    .eq('id', user.id)
    .single()

  if (userError) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 })
  }

  // Don't increment for Pro users
  if (userData.is_pro) {
    return NextResponse.json({ success: true, message: 'Pro user - no limit' })
  }

  // Increment usage
  const newUsage = (userData.free_edits_used || 0) + 1
  
  const { error: updateError } = await supabase
    .from('users')
    .update({ free_edits_used: newUsage })
    .eq('id', user.id)

  if (updateError) {
    return NextResponse.json({ error: 'Failed to update usage' }, { status: 500 })
  }

  return NextResponse.json({
    success: true,
    used: newUsage,
    remaining: Math.max(0, 5 - newUsage),
    plan: 'free'
  })
}
