import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'
import { UserService } from '@/lib/userService'

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const error = requestUrl.searchParams.get('error')
  const errorDescription = requestUrl.searchParams.get('error_description')

  // Handle OAuth errors
  if (error) {
    console.error('OAuth error:', error, errorDescription)
    return NextResponse.redirect(`${requestUrl.origin}/?error=${encodeURIComponent(error)}&error_description=${encodeURIComponent(errorDescription || '')}`)
  }

  try {
    if (code) {
      const cookieStore = await cookies()
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
      
      const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)
      
      if (exchangeError) {
        console.error('Error exchanging code for session:', exchangeError)
        return NextResponse.redirect(`${requestUrl.origin}/?error=auth_failed&error_description=${encodeURIComponent(exchangeError.message)}`)
      }

      console.log('Auth successful for user:', data.user?.email)
      
      // Ensure user record exists in database
      if (data.user?.id && data.user?.email) {
        try {
          await UserService.getUser(data.user.id, data.user.email)
          console.log('User record ensured in database')
        } catch (error) {
          console.error('Error ensuring user record:', error)
          // Continue anyway - the user can still use the app
        }
      }
    }

    // URL to redirect to after sign in process completes
    return NextResponse.redirect(requestUrl.origin)
    } catch (error: unknown) {
    console.error('Auth callback error:', error)
    return NextResponse.redirect(`${requestUrl.origin}/?error=callback_failed&error_description=${encodeURIComponent(error instanceof Error ? error.message : 'Unknown error')}`)
  }
}
