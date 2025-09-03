import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function GET(request: NextRequest) {
  try {
    const debug = {
      environment: {
        supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL ? 'Set' : 'Missing',
        supabaseAnonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'Set' : 'Missing',
        supabaseServiceKey: process.env.SUPABASE_SERVICE_ROLE_KEY ? 'Set' : 'Missing',
        nodeEnv: process.env.NODE_ENV,
      },
      request: {
        url: request.url,
        origin: request.nextUrl.origin,
        searchParams: Object.fromEntries(request.nextUrl.searchParams),
        headers: {
          host: request.headers.get('host'),
          userAgent: request.headers.get('user-agent'),
        }
      },
      oauth: {
        expectedRedirectUrl: `${request.nextUrl.origin}/auth/callback`,
        expectedSiteUrl: request.nextUrl.origin,
      }
    }

    // Test Supabase connection
    try {
      const cookieStore = cookies()
      const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
          cookies: {
            get(name: string) {
              return cookieStore.get(name)?.value
            },
            set(name: string, value: string, options: Record<string, unknown>) {
              cookieStore.set({ name, value, ...options })
            },
            remove(name: string, options: Record<string, unknown>) {
              cookieStore.set({ name, value: '', ...options })
            },
          },
        }
      )

      // Test a simple query
      const { data, error } = await supabase.from('users').select('id').limit(1)
      
      debug.supabase = {
        connection: error ? 'Failed' : 'Success',
        error: error ? error.message : null,
        data: data ? 'Table accessible' : 'No data'
      }

      // Test OAuth URL generation
      try {
        const { data: oauthData, error: oauthError } = await supabase.auth.signInWithOAuth({
          provider: 'google',
          options: {
            redirectTo: `${request.nextUrl.origin}/auth/callback`,
            skipBrowserRedirect: true
          }
        })
        
        debug.oauthTest = {
          success: !oauthError,
          error: oauthError ? oauthError.message : null,
          url: oauthData?.url ? 'Generated successfully' : 'No URL generated'
        }
      } catch (oauthTestError: any) {
        debug.oauthTest = {
          success: false,
          error: oauthTestError.message
        }
      }
    } catch (supabaseError: any) {
      debug.supabase = {
        connection: 'Failed',
        error: supabaseError.message
      }
    }

    return NextResponse.json({ success: true, debug })
  } catch (error: any) {
    return NextResponse.json({ 
      success: false, 
      error: error.message,
      stack: error.stack 
    }, { status: 500 })
  }
}
