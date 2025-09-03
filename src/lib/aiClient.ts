import { GoogleGenerativeAI } from '@google/generative-ai'
import { StyleOption } from '@/components/StyleToggles'

// Initialize Gemini AI client
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '')

// Style-specific prompt templates for real estate photo enhancement
export const STYLE_PROMPTS: Record<StyleOption, string> = {
  airbnb: `Enhance this real estate photo to create a warm, inviting Airbnb-style listing. Apply these specific improvements:

1. **Interior Lighting Enhancement**: Add warm, natural lighting with soft shadows - NO fake outdoor views through windows
2. **Color Enhancement**: Boost warm tones - creams, soft browns, warm grays
3. **Interior Staging**: Add cozy elements like plants, throw pillows, warm textiles, books
4. **Window Treatment**: Keep existing windows as-is, do NOT add fake outdoor scenery
5. **Overall Mood**: Create a welcoming, "home away from home" atmosphere

IMPORTANT: Do NOT add fake outdoor views, landscapes, or scenery through windows. Keep all windows showing the original outdoor view or make them neutral. Focus only on interior enhancements.`,

  luxury: `Transform this real estate photo into a high-end luxury listing. Apply these premium enhancements:

1. **Interior Lighting**: Add sophisticated lighting with perfect exposure and contrast - NO fake outdoor views
2. **Luxury Staging**: Add elegant furniture, premium materials, sophisticated decor
3. **Rich Colors**: Apply deep blues, elegant grays, gold accents, marble whites
4. **Window Treatment**: Keep existing windows as-is, do NOT add fake outdoor scenery
5. **Exclusive Feel**: Create an aspirational, high-end atmosphere

IMPORTANT: Do NOT add fake outdoor views, landscapes, or scenery through windows. Keep all windows showing the original outdoor view or make them neutral. Focus only on interior luxury enhancements.`,

  architectural: `Enhance this real estate photo with a clean, modern architectural focus. Apply these design improvements:

1. **Interior Lighting**: Add even, bright lighting that highlights architectural details - NO fake outdoor views
2. **Minimalist Staging**: Add clean, modern furniture that emphasizes space and light
3. **Neutral Palette**: Apply whites, grays, blacks with subtle accent colors
4. **Window Treatment**: Keep existing windows as-is, do NOT add fake outdoor scenery
5. **Modern Aesthetic**: Create a sense of space, light, and contemporary living

IMPORTANT: Do NOT add fake outdoor views, landscapes, or scenery through windows. Keep all windows showing the original outdoor view or make them neutral. Focus only on interior architectural enhancements.`
}

export interface ProcessingResult {
  success: boolean
  originalUrl?: string
  processedUrl?: string
  style?: string
  processingTime?: string
  error?: string
  note?: string
}

export class AIClient {
  private model: ReturnType<typeof genAI.getGenerativeModel>

  constructor() {
    // Use the correct image generation model (Nano Banana)
    this.model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash-image-preview' })
  }

  // Extract room context from filename
  private extractRoomContext(filename: string): string {
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
  private getRoomContext(roomType: string): string {
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

  async processImageWithPrompt(
    imageUrl: string, 
    customPrompt: string,
    _userId?: string
  ): Promise<ProcessingResult> {
    try {
      const startTime = Date.now()
      
      // Convert image URL to File object
      const response = await fetch(imageUrl)
      const blob = await response.blob()
      const imageFile = new File([blob], 'image.jpg', { type: 'image/jpeg' })
      
      // Convert file to base64 for Gemini API
      const imageBuffer = await imageFile.arrayBuffer()
      const base64Image = Buffer.from(imageBuffer).toString('base64')
      const mimeType = imageFile.type

      // Prepare the image part for the API
      const imagePart = {
        inlineData: {
          data: base64Image,
          mimeType: mimeType
        }
      }

      // Generate the enhanced image with custom prompt
      const result = await this.model.generateContent([customPrompt, imagePart])
      const response_data = await result.response

      // Log the response to debug the format
      console.log('Gemini API Response:', JSON.stringify(response_data as unknown, null, 2))

      // Extract the generated image from Gemini 2.5 Flash Image model
      const candidate = response_data.candidates?.[0]
      if (!candidate) {
        throw new Error('No response candidates from AI model')
      }

      const content = candidate.content
      if (!content || !content.parts || content.parts.length === 0) {
        throw new Error('No content parts in AI response')
      }

      // Look for image data in the response
      let generatedImage = null
      for (const part of content.parts) {
        if (part.inlineData) {
          generatedImage = part.inlineData
          break
        }
      }

      if (generatedImage) {
        const processingTime = ((Date.now() - startTime) / 1000).toFixed(1) + 's'
        return {
          success: true,
          originalUrl: imageUrl,
          processedUrl: `data:${generatedImage.mimeType};base64,${generatedImage.data}`,
          style: 'custom' as StyleOption,
          processingTime: processingTime
        }
      }

      // If no image found, check if there's text response
      const textPart = content.parts.find(part => part.text)
      if (textPart) {
        console.log('AI Response Text:', textPart.text)
        
        // For now, return the original image with a note
        const processingTime = ((Date.now() - startTime) / 1000).toFixed(1) + 's'
        return {
          success: true,
          originalUrl: imageUrl,
          processedUrl: imageUrl, // Return original for now
          style: 'custom' as StyleOption,
          processingTime: processingTime,
          note: 'AI processing response received but image generation needs adjustment'
        }
      }

      throw new Error('No image or text response from AI model')

    } catch (error) {
      console.error('AI processing error:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      }
    }
  }

  async processImage(
    imageFile: File, 
    style: StyleOption,
    _userId?: string,
    customDescription?: string
  ): Promise<ProcessingResult> {
    try {
      const startTime = Date.now()
      
      // Convert file to base64 for Gemini API
      const imageBuffer = await imageFile.arrayBuffer()
      const base64Image = Buffer.from(imageBuffer).toString('base64')
      const mimeType = imageFile.type

      // Extract room context from filename
      const roomType = this.extractRoomContext(imageFile.name)
      const roomContext = this.getRoomContext(roomType)
      
      // Get the style-specific prompt and add room context and custom description
      let prompt = STYLE_PROMPTS[style]
      
      // Add room-specific context
      prompt += `\n\nROOM CONTEXT: ${roomContext}`
      
      if (customDescription && customDescription.trim()) {
        prompt += `\n\nAdditional Custom Instructions: ${customDescription.trim()}`
      }

      // Prepare the image part for the API
      const imagePart = {
        inlineData: {
          data: base64Image,
          mimeType: mimeType
        }
      }

      // Generate the enhanced image
      const result = await this.model.generateContent([prompt, imagePart])
      const response = await result.response

      // Log the response to debug the format
      console.log('Gemini API Response:', JSON.stringify(response as unknown, null, 2))

      // Extract the generated image from Gemini 2.5 Flash Image model
      const candidate = response.candidates?.[0]
      if (!candidate) {
        throw new Error('No response candidates from AI model')
      }

      const content = candidate.content
      if (!content || !content.parts || content.parts.length === 0) {
        throw new Error('No content parts in AI response')
      }

      // Look for image data in the response
      let generatedImage = null
      for (const part of content.parts) {
        if (part.inlineData) {
          generatedImage = part.inlineData
          break
        }
      }

      if (generatedImage) {
        const processingTime = ((Date.now() - startTime) / 1000).toFixed(1) + 's'
        return {
          success: true,
          originalUrl: URL.createObjectURL(imageFile),
          processedUrl: `data:${generatedImage.mimeType};base64,${generatedImage.data}`,
          style: style,
          processingTime: processingTime
        }
      }

      // If no image found, check if there's text response
      const textPart = content.parts.find(part => part.text)
      if (textPart) {
        console.log('AI Response Text:', textPart.text)
        
        // For now, return the original image with a note
        const processingTime = ((Date.now() - startTime) / 1000).toFixed(1) + 's'
        return {
          success: true,
          originalUrl: URL.createObjectURL(imageFile),
          processedUrl: URL.createObjectURL(imageFile), // Return original for now
          style: style,
          processingTime: processingTime,
          note: 'AI processing response received but image generation needs adjustment'
        }
      }

      throw new Error('No image or text response from AI model')

    } catch (error) {
      console.error('AI processing error:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      }
    }
  }

  // Helper method to validate API key
  static validateConfig(): boolean {
    return !!process.env.GEMINI_API_KEY
  }
}
