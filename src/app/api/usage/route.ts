import { NextResponse } from 'next/server'
import { getSupabaseServerClient } from '@/lib/supabaseServer'
import { supabaseService } from '@/lib/supabaseService'

export async function GET() {
  const supabase = getSupabaseServerClient()
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data, error: rpcErr } = await supabaseService.rpc('get_usage_summary', { _user_id: user.id })
  if (rpcErr) return NextResponse.json({ error: rpcErr.message }, { status: 400 })

  return NextResponse.json(data?.[0] ?? { used: 0, quota: 5, remaining: 5, plan: 'free' })
}
