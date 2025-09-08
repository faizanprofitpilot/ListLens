import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabaseClient'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    
    if (!userId) {
      return NextResponse.json({ error: 'userId required' }, { status: 400 })
    }

    // Check users table
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single()

    // Check user_usage table
    const { data: usageData, error: usageError } = await supabase
      .from('user_usage')
      .select('*')
      .eq('user_id', userId)
      .single()

    return NextResponse.json({
      userId,
      usersTable: {
        data: userData,
        error: userError?.message
      },
      userUsageTable: {
        data: usageData,
        error: usageError?.message
      }
    })
    } catch {
    return NextResponse.json({ error: 'Debug failed' }, { status: 500 })
  }
}
