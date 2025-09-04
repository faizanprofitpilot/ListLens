import { NextRequest, NextResponse } from 'next/server'
import { AIClient } from '@/lib/aiClient'
import { UsageService } from '@/lib/usageService'
import { UserService } from '@/lib/userService'
import { authenticateRequest } from '@/lib/authMiddleware'
import { sanitizePromptInput } from '@/lib/inputSanitizer'
import { rateLimit } from '@/lib/rateLimiter'

// Extract room context from filename
function extractRoomContext(filename: string): string {
  const name = filename.toLowerCase()
  
  // Common room types and their variations
  const roomTypes = {
    bedroom: ['bedroom', 'bed', 'master', 'guest', 'kids', 'child'],
    living: ['living', 'lounge', 'family', 'sitting', 'den'],
    kitchen: ['kitchen', 'cook', 'dining', 'eat'],
    bathroom: ['bathroom', 'bath', 'toilet', 'powder', 'ensuite'],
    office: ['office', 'study', 'work', 'desk'],
    outdoor: ['outdoor', 'patio', 'deck', 'garden', 'yard', 'exterior'],
    entry: ['entry', 'foyer', 'hallway', 'hall', 'entrance'],
    basement: ['basement', 'cellar', 'lower'],
    garage: ['garage', 'car', 'parking']
  }

  // Find matching room type
  for (const [roomType, keywords] of Object.entries(roomTypes)) {
    if (keywords.some(keyword => name.includes(keyword))) {
      return roomType
    }
  }

  return 'general' // Default if no specific room type found
}

// Get room-specific context for prompts
function getRoomContext(roomType: string): string {
  const roomContexts = {
    bedroom: 'This is a BEDROOM. Focus on bedroom-appropriate furniture: beds, nightstands, dressers, wardrobes. Add bedroom elements like pillows, blankets, bedside lamps, and bedroom decor. Do NOT add living room furniture like sofas or dining tables.',
    living: 'This is a LIVING ROOM. Focus on living room furniture: sofas, coffee tables, armchairs, entertainment centers. Add living room elements like throw pillows, area rugs, and living room decor.',
    kitchen: 'This is a KITCHEN. Focus on kitchen elements: countertops, cabinets, appliances, dining areas. Add kitchen-appropriate items like cookbooks, fruit bowls, and kitchen decor.',
    bathroom: 'This is a BATHROOM. Focus on bathroom elements: vanities, mirrors, towels, bath accessories. Add bathroom-appropriate items like soap dispensers, plants, and bathroom decor.',
    office: 'This is an OFFICE/STUDY. Focus on office furniture: desks, chairs, bookshelves, filing cabinets. Add office elements like books, desk accessories, and professional decor.',
    outdoor: 'This is an OUTDOOR SPACE. Focus on outdoor furniture: patio sets, outdoor seating, plants, outdoor lighting. Add outdoor elements like potted plants, outdoor cushions, and garden decor.',
    entry: 'This is an ENTRY/FOYER. Focus on entry elements: console tables, mirrors, coat racks, entry lighting. Add entry-appropriate items like decorative bowls, plants, and entry decor.',
    basement: 'This is a BASEMENT. Focus on basement-appropriate furniture and storage solutions. Add basement elements like storage bins, recreational items, and basement decor.',
    garage: 'This is a GARAGE. Focus on garage elements: storage systems, workbenches, garage organization. Add garage-appropriate items like tools, storage bins, and garage decor.',
    general: 'This is a general interior space. Add appropriate furniture and decor that matches the existing room type and style.'
  }

  return roomContexts[roomType as keyof typeof roomContexts] || roomContexts.general
}

export async function POST(request: NextRequest) {
  try {
    // Authenticate user
    const { user, error: authError } = await authenticateRequest(request)
    if (authError || !user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    // Rate limiting
    const rateLimitResult = rateLimit(user.id, 20, 60000) // 20 requests per minute for chat
    if (!rateLimitResult.allowed) {
      return NextResponse.json({ 
        error: 'Rate limit exceeded. Please try again later.',
        retryAfter: Math.ceil((rateLimitResult.resetTime - Date.now()) / 1000)
      }, { status: 429 })
    }

    const body = await request.json()
    const { message, originalImage, processedImage, style, conversationHistory, fileName } = body

    // Validate required fields
    if (!message) {
      return NextResponse.json(
        { success: false, error: 'Message is required' },
        { status: 400 }
      )
    }

    // Check if user has free edits remaining
    const hasEditsRemaining = await UsageService.hasFreeEditsRemaining(user.id)
    if (!hasEditsRemaining) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'No free edits remaining. Please upgrade to continue.',
          upgradeRequired: true
        },
        { status: 402 }
      )
    }

    // Initialize AI client
    const aiClient = new AIClient()
    const configValid = AIClient.validateConfig()
    if (!configValid) {
      return NextResponse.json(
        { success: false, error: 'AI service configuration error' },
        { status: 503 }
      )
    }

    // Sanitize user message
    const sanitizedMessage = sanitizePromptInput(message)
    
    // Create a refined prompt based on the user's feedback
    const refinedPrompt = createRefinedPrompt(sanitizedMessage, style, conversationHistory, fileName)

    // Process the image with the refined prompt
    const result = await aiClient.processImageWithPrompt(processedImage, refinedPrompt, user.id)

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error || 'Failed to process image' },
        { status: 500 }
      )
    }

    // Increment usage
    let updatedUser
    try {
      updatedUser = await UserService.incrementUsage(user.id)
    } catch (error) {
      console.error('Error incrementing usage:', error)
      // Get current user data as fallback
      updatedUser = await UserService.getUser(user.id, user.email!)
    }
    
    // Save the processed image
    if (result.processedUrl) {
      await UsageService.saveProcessedImage(
        user.id,
        originalImage || '',
        result.processedUrl,
        `refined-${style}`
      )
    }

    // Calculate remaining edits from the updated user data
    const freeEditsRemaining = Math.max(0, 5 - updatedUser.free_edits_used)

    // Generate a friendly AI response
    const aiResponse = generateAIResponse(sanitizedMessage, result.processingTime || '0s')

    return NextResponse.json({
      success: true,
      response: aiResponse,
      newImage: result.processedUrl,
      freeEditsRemaining,
      upgradeRequired: freeEditsRemaining === 0
    })

  } catch (error) {
    console.error('Chat refine error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}

function createRefinedPrompt(userMessage: string, style: string, _conversationHistory: unknown[], fileName?: string): string {
  const baseStylePrompts = {
    airbnb: 'warm, inviting Airbnb-style listing with cozy atmosphere',
    luxury: 'high-end luxury real estate listing with sophisticated elegance',
    architectural: 'clean, modern architectural showcase with minimalist design'
  }

  const baseStyle = baseStylePrompts[style as keyof typeof baseStylePrompts] || 'professional real estate photo'

  // Extract room context from filename
  let roomContext = ''
  if (fileName) {
    const roomType = extractRoomContext(fileName)
    roomContext = getRoomContext(roomType)
  }

  // Analyze the user's request and create a refined prompt
  const userRequest = userMessage.toLowerCase()
  
  // Note: conversationHistory is available for future context-aware prompts
  
  let refinementInstructions = ''
  
  if (userRequest.includes('warmer') || userRequest.includes('warm')) {
    refinementInstructions += 'Make the lighting warmer and more golden. '
  }
  if (userRequest.includes('cooler') || userRequest.includes('cool')) {
    refinementInstructions += 'Make the lighting cooler and more blue-toned. '
  }
  if (userRequest.includes('brighter') || userRequest.includes('bright')) {
    refinementInstructions += 'Increase the brightness and exposure. '
  }
  if (userRequest.includes('darker') || userRequest.includes('dark')) {
    refinementInstructions += 'Reduce the brightness and add more dramatic shadows. '
  }
  if (userRequest.includes('contrast') || userRequest.includes('more contrast')) {
    refinementInstructions += 'Increase the contrast and make colors more vibrant. '
  }
  if (userRequest.includes('softer') || userRequest.includes('soft')) {
    refinementInstructions += 'Make the lighting softer and more diffused. '
  }
  if (userRequest.includes('remove') || userRequest.includes('delete')) {
    refinementInstructions += 'Remove any unwanted objects or distractions. '
  }
  if (userRequest.includes('add') || userRequest.includes('include')) {
    // Be more explicit about specific object types
    if (userRequest.includes('speaker') || userRequest.includes('speakers')) {
      refinementInstructions += 'Add audio speakers or sound system equipment as specifically requested. '
    } else if (userRequest.includes('lamp') || userRequest.includes('lamps') || userRequest.includes('lighting')) {
      refinementInstructions += 'Add lighting fixtures or lamps as specifically requested. '
    } else if (userRequest.includes('plant') || userRequest.includes('plants') || userRequest.includes('tree')) {
      refinementInstructions += 'Add plants or greenery as specifically requested. '
    } else if (userRequest.includes('chair') || userRequest.includes('chairs') || userRequest.includes('seat')) {
      refinementInstructions += 'Add seating furniture as specifically requested. '
    } else if (userRequest.includes('table') || userRequest.includes('desk') || userRequest.includes('counter')) {
      refinementInstructions += 'Add table or surface furniture as specifically requested. '
    } else if (userRequest.includes('art') || userRequest.includes('painting') || userRequest.includes('picture')) {
      refinementInstructions += 'Add artwork or decorative pieces as specifically requested. '
    } else if (userRequest.includes('pillow') || userRequest.includes('cushion') || userRequest.includes('throw')) {
      refinementInstructions += 'Add soft furnishings like pillows or throws as specifically requested. '
    } else if (userRequest.includes('book') || userRequest.includes('books') || userRequest.includes('magazine')) {
      refinementInstructions += 'Add books or reading materials as specifically requested. '
    } else if (userRequest.includes('tv') || userRequest.includes('television') || userRequest.includes('screen')) {
      refinementInstructions += 'Add television or display screen as specifically requested. '
    } else if (userRequest.includes('rug') || userRequest.includes('carpet') || userRequest.includes('mat')) {
      refinementInstructions += 'Add floor covering like rugs or carpets as specifically requested. '
    } else {
      // For any other "add" requests, be more explicit
      refinementInstructions += `Add the specific elements mentioned in the request: "${userMessage}". `
    }
  }
  if (userRequest.includes('color') || userRequest.includes('colours')) {
    refinementInstructions += 'Enhance and adjust the color palette. '
  }
  if (userRequest.includes('sky') || userRequest.includes('clouds')) {
    refinementInstructions += 'Improve the sky if visible, but do NOT add fake outdoor views through windows. '
  }
  if (userRequest.includes('staging') || userRequest.includes('furniture')) {
    refinementInstructions += 'Enhance the staging and furniture arrangement. '
  }

  // If no specific instructions were detected, use the user's message directly
  if (!refinementInstructions) {
    refinementInstructions = userMessage + '. '
  }

  let finalPrompt = `Refine this real estate photo to create a ${baseStyle}. ${refinementInstructions}Maintain professional quality while implementing these specific improvements.`

  if (roomContext) {
    finalPrompt += `\n\nROOM CONTEXT: ${roomContext}`
  }

  finalPrompt += `\n\nCRITICAL INSTRUCTIONS:
- Follow the user's specific requests exactly as stated
- If the user asks to add specific objects (like speakers, lamps, plants, etc.), add exactly those objects
- Do NOT substitute requested objects with different items
- Do NOT add fake outdoor views, landscapes, or scenery through windows
- Keep all windows showing the original outdoor view or make them neutral
- Focus only on interior enhancements

The result should look like a premium real estate listing that would attract potential buyers.`

  return finalPrompt
}

function generateAIResponse(userMessage: string, processingTime: string): string {
  const responses = [
    `Perfect! I've made those adjustments to your image. The processing took ${processingTime} and I think you'll love the results! ✨`,
    `Great suggestion! I've refined the image based on your feedback. The enhanced version should look much better now! 🎨`,
    `Excellent idea! I've implemented those changes and the image now has a more professional look. Check out the improvements! 🌟`,
    `I've applied your requested modifications! The image should now have the exact look you were going for. 📸`,
    `Wonderful feedback! I've made those refinements and the result is a much more polished real estate photo. 🏡`
  ]

  // Add specific responses based on the type of request
  if (userMessage.toLowerCase().includes('warmer')) {
    return `I've warmed up the lighting to create a more inviting atmosphere! The golden tones should make the space feel cozy and welcoming. ✨`
  }
  if (userMessage.toLowerCase().includes('brighter')) {
    return `Perfect! I've brightened the image to make it more vibrant and eye-catching. The enhanced lighting really makes the space pop! 💡`
  }
  if (userMessage.toLowerCase().includes('contrast')) {
    return `Excellent! I've increased the contrast to make the colors more vibrant and the details more defined. The image now has much more visual impact! 🎨`
  }

  // Return a random general response
  return responses[Math.floor(Math.random() * responses.length)]
}
