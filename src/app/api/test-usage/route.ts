import { NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabaseServer'
import { supabaseService } from '@/lib/supabaseService'

export async function GET() {
  try {
    const supabase = await createSupabaseServerClient()
    const { data: { user }, error } = await supabase.auth.getUser()
    
    if (error || !user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    // Test 1: Check if user exists in users table
    const { data: userData, error: userError } = await supabaseService
      .from('users')
      .select('*')
      .eq('id', user.id)
      .single()

    // Test 2: Try the RPC function
    const { data: rpcData, error: rpcError } = await supabaseService.rpc('get_usage_summary', { 
      _user_id: user.id 
    })

    // Test 3: Check usage_events table
    const { data: eventsData, error: eventsError } = await supabaseService
      .from('usage_events')
      .select('*')
      .eq('user_id', user.id)

    // Test 4: Check usage_current view
    const { data: viewData, error: viewError } = await supabaseService
      .from('usage_current')
      .select('*')
      .eq('user_id', user.id)

    return NextResponse.json({
      userId: user.id,
      userEmail: user.email,
      tests: {
        userExists: {
          data: userData,
          error: userError?.message
        },
        rpcFunction: {
          data: rpcData,
          error: rpcError?.message
        },
        usageEvents: {
          data: eventsData,
          error: eventsError?.message
        },
        usageView: {
          data: viewData,
          error: viewError?.message
        }
      }
    })
  } catch (error) {
    return NextResponse.json({ 
      error: 'Test failed', 
      details: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 })
  }
}
