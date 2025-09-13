import { NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabaseServer'
import { UserService } from '@/lib/userService'

export async function GET() {
  try {
    const supabase = await createSupabaseServerClient()
    const { data: { user }, error } = await supabase.auth.getUser()
    
    if (error || !user) {
      return NextResponse.json({ 
        error: 'Not authenticated',
        user: null,
        session: null
      }, { status: 401 })
    }

    // Try to get user from database
    let dbUser = null
    let dbError = null
    try {
      dbUser = await UserService.getUser(user.id, user.email || '')
    } catch (err) {
      dbError = err instanceof Error ? err.message : 'Unknown error'
    }

    return NextResponse.json({
      authUser: {
        id: user.id,
        email: user.email,
        created_at: user.created_at
      },
      dbUser,
      dbError,
      hasDbRecord: !!dbUser
    })
  } catch (error) {
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

    // Force create user record
    const dbUser = await UserService.getUser(user.id, user.email || '')
    
    return NextResponse.json({
      success: true,
      user: dbUser,
      message: 'User record created/verified'
    })
  } catch (error) {
    return NextResponse.json({ 
      error: 'Failed to create user record',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
