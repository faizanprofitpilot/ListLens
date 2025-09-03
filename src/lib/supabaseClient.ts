import { createBrowserClient } from '@supabase/ssr'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://your-project.supabase.co'
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'your-anon-key'

export const supabase = createBrowserClient(supabaseUrl, supabaseAnonKey)

// Types for our database schema (to be implemented in Phase 2)
export interface UserUsage {
  id: string
  user_id: string
  free_edits_used: number
  created_at: string
  updated_at: string
}

export interface ProcessedImage {
  id: string
  user_id: string
  original_url: string
  processed_url: string
  style: string
  created_at: string
}
