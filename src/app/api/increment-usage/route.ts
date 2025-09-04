import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabaseClient'

export async function POST(request: NextRequest) {
  try {
    const { userId } = await request.json()
    
    if (!userId) {
      return NextResponse.json({ error: 'userId required' }, { status: 400 })
    }

    // Get current user
    const { data: currentUser, error: fetchError } = await supabase
      .from('users')
      .select('free_edits_used, is_pro')
      .eq('id', userId)
      .single()

    if (fetchError) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Don't increment for Pro users
    if (currentUser.is_pro) {
      return NextResponse.json({ 
        success: true, 
        free_edits_used: currentUser.free_edits_used,
        is_pro: true 
      })
    }

    // Increment usage
    const newUsage = currentUser.free_edits_used + 1
    const { data: updatedUser, error: updateError } = await supabase
      .from('users')
      .update({ 
        free_edits_used: newUsage,
        updated_at: new Date().toISOString()
      })
      .eq('id', userId)
      .select()
      .single()

    if (updateError) {
      return NextResponse.json({ error: 'Failed to update usage' }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      free_edits_used: updatedUser.free_edits_used,
      free_edits_remaining: 5 - updatedUser.free_edits_used,
      is_pro: false
    })
  } catch (error) {
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
