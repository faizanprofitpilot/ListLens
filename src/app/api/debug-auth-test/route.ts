import { NextRequest, NextResponse } from 'next/server'
import { authenticateRequest } from '@/lib/authMiddleware'
import { createSupabaseServerClient } from '@/lib/supabaseServer'

export async function GET(request: NextRequest) {
  try {
    // Test authentication
    const { user, error } = await authenticateRequest(request)
    
    // Also test direct Supabase client
    const supabase = createSupabaseServerClient()
    const { data: { user: directUser }, error: directError } = await supabase.auth.getUser()
    
    return NextResponse.json({
      success: true,
      authenticated: !!user,
      user: user ? {
        id: user.id,
        email: user.email,
        // Don't expose sensitive data
      } : null,
      error: error || null,
      directAuth: {
        authenticated: !!directUser,
        user: directUser ? { id: directUser.id, email: directUser.email } : null,
        error: directError?.message || null
      },
      headers: {
        cookie: request.headers.get('cookie') ? 'Present' : 'Missing',
        authorization: request.headers.get('authorization') ? 'Present' : 'Missing',
      },
      cookies: request.headers.get('cookie')?.split(';').map(c => c.trim().split('=')[0]) || []
    })
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: error.message,
      stack: error.stack
    }, { status: 500 })
  }
}
