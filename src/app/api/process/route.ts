import { NextRequest, NextResponse } from 'next/server'
import { AIClient } from '@/lib/aiClient'
import { UsageService } from '@/lib/usageService'
import { UserService } from '@/lib/userService'
import { StyleOption } from '@/components/StyleToggles'

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File
    const style = formData.get('style') as StyleOption
    const userId = formData.get('userId') as string || 'anonymous'
    const userEmail = formData.get('userEmail') as string || ''
    const customDescription = formData.get('customDescription') as string || ''

    // Validate inputs
    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    if (!style || !['airbnb', 'luxury', 'architectural'].includes(style)) {
      return NextResponse.json({ error: 'Invalid style provided' }, { status: 400 })
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      return NextResponse.json({ error: 'File must be an image' }, { status: 400 })
    }

    // Validate file size (10MB limit)
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json({ error: 'File size must be less than 10MB' }, { status: 400 })
    }

    // Ensure user exists in database
    if (userId !== 'anonymous' && userEmail) {
      await UserService.getUser(userId, userEmail)
    }

    // Check if user has free edits remaining
    const hasFreeEdits = await UsageService.hasFreeEditsRemaining(userId)
    if (!hasFreeEdits) {
      return NextResponse.json({ 
        error: 'Free edit limit reached. Please upgrade to continue.',
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

    // Process image with AI
    const aiClient = new AIClient()
    const result = await aiClient.processImage(file, style, userId, customDescription)

    if (!result.success) {
      return NextResponse.json({ 
        error: result.error || 'Failed to process image' 
      }, { status: 500 })
    }

    // Increment usage count (only for non-Pro users)
    if (userId !== 'anonymous') {
      try {
        await UserService.incrementUsage(userId)
      } catch (error) {
        console.error('Error incrementing usage:', error)
        // Continue processing even if usage tracking fails
      }
    }

    // Save processed image record
    await UsageService.saveProcessedImage(
      userId,
      result.originalUrl!,
      result.processedUrl!,
      style
    )

    // Get updated usage info
    const updatedUsage = await UsageService.getUserUsage(userId)
    const freeEditsRemaining = 20 - updatedUsage.free_edits_used

    return NextResponse.json({
      success: true,
      originalUrl: result.originalUrl,
      processedUrl: result.processedUrl,
      style: result.style,
      processingTime: result.processingTime,
      freeEditsRemaining: freeEditsRemaining,
      upgradeRequired: freeEditsRemaining === 0
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
