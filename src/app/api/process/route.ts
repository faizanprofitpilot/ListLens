import { NextRequest, NextResponse } from 'next/server'
import { AIClient } from '@/lib/aiClient'
import { UsageService } from '@/lib/usageService'
import { StyleOption } from '@/components/StyleToggles'
import { authenticateRequest } from '@/lib/authMiddleware'
import { sanitizePromptInput, validateFileType, validateFileSize } from '@/lib/inputSanitizer'
import { rateLimit } from '@/lib/rateLimiter'
import { supabaseService } from '@/lib/supabaseService'
import crypto from 'crypto'

export async function POST(request: NextRequest) {
  try {
    // Authenticate user
    const { user, error: authError } = await authenticateRequest(request)
    if (authError || !user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    // Rate limiting
    const rateLimitResult = rateLimit(user.id, 10, 60000) // 10 requests per minute
    if (!rateLimitResult.allowed) {
      return NextResponse.json({ 
        error: 'Rate limit exceeded. Please try again later.',
        retryAfter: Math.ceil((rateLimitResult.resetTime - Date.now()) / 1000)
      }, { status: 429 })
    }

    const formData = await request.formData()
    const file = formData.get('file') as File
    const style = formData.get('style') as StyleOption
    const customDescription = formData.get('customDescription') as string || ''

    // Validate inputs
    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    if (!style || !['airbnb', 'luxury', 'architectural'].includes(style)) {
      return NextResponse.json({ error: 'Invalid style provided' }, { status: 400 })
    }

    // Validate file type and size using security utilities
    if (!validateFileType(file)) {
      return NextResponse.json({ error: 'Invalid file type. Only JPEG, PNG, and WebP images are allowed.' }, { status: 400 })
    }

    if (!validateFileSize(file, 10)) {
      return NextResponse.json({ error: 'File size must be less than 10MB' }, { status: 400 })
    }

    // Check usage limits before processing
    const { data: usageData, error: usageError } = await supabaseService.rpc('get_usage_summary', { 
      _user_id: user.id 
    })
    
    if (usageError) {
      return NextResponse.json({ error: 'Failed to check usage limits' }, { status: 500 })
    }
    
    const usage = usageData?.[0]
    if (!usage) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }
    
    // Check if user has remaining edits
    if (usage.remaining <= 0) {
      return NextResponse.json({ 
        error: `Usage limit reached for ${usage.plan} plan (${usage.quota} edits per month). Please upgrade to continue.`,
        upgradeRequired: true 
      }, { status: 402 })
    }

    // Validate AI configuration
    if (!AIClient.validateConfig()) {
      console.error('Gemini API key not configured')
      return NextResponse.json({ 
        error: 'AI service temporarily unavailable. Please try again later.' 
      }, { status: 503 })
    }

    // Sanitize custom description
    const sanitizedDescription = sanitizePromptInput(customDescription)

    // Process image with AI
    const aiClient = new AIClient()
    const result = await aiClient.processImage(file, style, user.id, sanitizedDescription)

    if (!result.success) {
      return NextResponse.json({ 
        error: result.error || 'Failed to process image' 
      }, { status: 500 })
    }

    // Generate stable job ID for idempotency
    const jobId = crypto.createHash('sha256')
      .update(`${user.id}:${file.name}:${Date.now()}`)
      .digest('hex')
      .slice(0, 32)

    // Atomically increment usage after successful processing
    const { data: updatedUsage, error: incrementError } = await supabaseService.rpc('increment_usage', {
      _user_id: user.id,
      _job_id: jobId,
      _delta: 1
    })

    if (incrementError) {
      console.error('Usage increment failed:', incrementError)
      // Continue processing even if usage tracking fails
    } else {
      console.log(`Usage incremented: ${usage.used} -> ${updatedUsage?.[0]?.used}, remaining: ${updatedUsage?.[0]?.remaining}`)
    }

    // Save processed image record
    await UsageService.saveProcessedImage(
      user.id,
      result.originalUrl!,
      result.processedUrl!,
      style
    )

    // Get final usage state
    const finalUsage = updatedUsage?.[0] || usage

    return NextResponse.json({
      success: true,
      originalUrl: result.originalUrl,
      processedUrl: result.processedUrl,
      style: result.style,
      processingTime: result.processingTime,
      usage: {
        used: finalUsage.used,
        quota: finalUsage.quota,
        remaining: finalUsage.remaining,
        plan: finalUsage.plan
      }
    })

  } catch (error) {
    console.error('Processing error:', error)
    
    // Handle specific error types
    if (error instanceof Error) {
      if (error.message.includes('API key')) {
        return NextResponse.json({ 
          error: 'AI service configuration error' 
        }, { status: 503 })
      }
      
      if (error.message.includes('timeout')) {
        return NextResponse.json({ 
          error: 'Processing timeout. Please try again with a smaller image.' 
        }, { status: 408 })
      }
    }

    return NextResponse.json(
      { error: 'Failed to process image. Please try again.' },
      { status: 500 }
    )
  }
}
