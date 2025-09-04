import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabaseServer'
import { authenticateRequest } from '@/lib/authMiddleware'
import { AIClient } from '@/lib/aiClient'

export async function POST(request: NextRequest) {
  try {
    console.log('=== DEBUG PROCESS START ===')
    
    // Test 1: Authentication
    console.log('1. Testing authentication...')
    const { user, error: authError } = await authenticateRequest(request)
    if (authError || !user) {
      console.log('❌ Auth failed:', authError)
      return NextResponse.json({ error: 'Auth failed', details: authError }, { status: 401 })
    }
    console.log('✅ Auth success:', user.id)

    // Test 2: Supabase connection
    console.log('2. Testing Supabase connection...')
    const supabase = createSupabaseServerClient()
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('free_edits_used, is_pro')
      .eq('id', user.id)
      .single()
    
    if (userError) {
      console.log('❌ Supabase query failed:', userError)
      return NextResponse.json({ error: 'Supabase failed', details: userError }, { status: 500 })
    }
    console.log('✅ Supabase success:', userData)

    // Test 3: AI Client config
    console.log('3. Testing AI Client config...')
    if (!AIClient.validateConfig()) {
      console.log('❌ AI config invalid')
      return NextResponse.json({ error: 'AI config invalid' }, { status: 500 })
    }
    console.log('✅ AI config valid')

    // Test 4: File validation
    console.log('4. Testing file from request...')
    const formData = await request.formData()
    const file = formData.get('file') as File
    const style = formData.get('style') as string
    
    if (!file) {
      console.log('❌ No file in request')
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }
    console.log('✅ File found:', file.name, file.size, file.type)

    // Test 5: AI processing
    console.log('5. Testing AI processing...')
    try {
      const result = await AIClient.processImage(file, style as any)
      console.log('✅ AI processing result:', result)
      return NextResponse.json({ 
        success: true, 
        message: 'All tests passed',
        result: {
          hasOriginalUrl: !!result.originalUrl,
          hasProcessedUrl: !!result.processedUrl,
          error: result.error
        }
      })
    } catch (aiError) {
      console.log('❌ AI processing failed:', aiError)
      return NextResponse.json({ 
        error: 'AI processing failed', 
        details: aiError instanceof Error ? aiError.message : 'Unknown error'
      }, { status: 500 })
    }

  } catch (error) {
    console.log('❌ Debug failed:', error)
    return NextResponse.json({ 
      error: 'Debug failed', 
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
