import { NextRequest } from 'next/server'
import { createSupabaseServerClient } from './supabaseServer'

export async function authenticateRequest(request: NextRequest) {
  try {
    const supabase = createSupabaseServerClient()

    const { data: { user }, error } = await supabase.auth.getUser()
    
    if (error || !user) {
      return { user: null, error: 'Unauthorized' }
    }

    return { user, error: null }
  } catch (error) {
    return { user: null, error: 'Authentication failed' }
  }
}
