import { NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabaseServer'
import { supabaseService } from '@/lib/supabaseService'

export async function POST(req: Request) {
  const supabase = createSupabaseServerClient()
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { jobId, delta = 1 } = await req.json()
  if (!jobId || typeof jobId !== 'string') {
    return NextResponse.json({ error: 'jobId required' }, { status: 400 })
  }

  const { data, error: rpcErr } = await supabaseService.rpc('increment_usage', {
    _user_id: user.id,
    _job_id: jobId,
    _delta: delta
  })

  if (rpcErr) return NextResponse.json({ error: rpcErr.message }, { status: 400 })
  return NextResponse.json(data?.[0])
}
