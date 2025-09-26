import { supabase } from './supabaseClient'
import { UserService } from './userService'

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

export class UsageService {
  // Get or create user usage record
  static async getUserUsage(userId: string): Promise<UserUsage> {
    try {
      // Try to get existing usage record
      const { data: existingUsage, error: fetchError } = await supabase
        .from('user_usage')
        .select('*')
        .eq('user_id', userId)
        .single()

      if (fetchError && fetchError.code !== 'PGRST116') { // PGRST116 = no rows found
        throw fetchError
      }

      if (existingUsage) {
        return existingUsage
      }

      // Create new usage record if none exists
      const { data: newUsage, error: createError } = await supabase
        .from('user_usage')
        .insert({
          user_id: userId,
          free_edits_used: 0
        })
        .select()
        .single()

      if (createError) {
        throw createError
      }

      return newUsage
    } catch (error) {
      console.error('Error getting user usage:', error)
      // Return a fallback usage object
      return {
        id: 'fallback',
        user_id: userId,
        free_edits_used: 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
    }
  }

  // Increment usage count
  static async incrementUsage(userId: string): Promise<UserUsage> {
    try {
      const currentUsage = await this.getUserUsage(userId)
      
      const { data: updatedUsage, error } = await supabase
        .from('user_usage')
        .update({
          free_edits_used: currentUsage.free_edits_used + 1,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', userId)
        .select()
        .single()

      if (error) {
        throw error
      }

      return updatedUsage
    } catch (error) {
      console.error('Error incrementing usage:', error)
      // Return fallback with incremented count
      const currentUsage = await this.getUserUsage(userId)
      return {
        ...currentUsage,
        free_edits_used: currentUsage.free_edits_used + 1,
        updated_at: new Date().toISOString()
      }
    }
  }

  // Check if user has free edits remaining
  static async hasFreeEditsRemaining(userId: string): Promise<boolean> {
    try {
      // Use the new UserService for Pro status checking
      return await UserService.hasEditsRemaining(userId)
    } catch (error) {
      console.error('Error checking free edits:', error)
      return true // Allow processing if we can't check
    }
  }

  // Save processed image record
  static async saveProcessedImage(
    userId: string,
    originalUrl: string,
    processedUrl: string,
    style: string
  ): Promise<ProcessedImage> {
    try {
      const { data, error } = await supabase
        .from('processed_images')
        .insert({
          user_id: userId,
          original_url: originalUrl,
          processed_url: processedUrl,
          style: style
        })
        .select()
        .single()

      if (error) {
        throw error
      }

      return data
    } catch (error) {
      console.error('Error saving processed image:', error)
      // Return fallback object
      return {
        id: 'fallback',
        user_id: userId,
        original_url: originalUrl,
        processed_url: processedUrl,
        style: style,
        created_at: new Date().toISOString()
      }
    }
  }

  // Get user's processed images
  static async getUserImages(userId: string): Promise<ProcessedImage[]> {
    try {
      const { data, error } = await supabase
        .from('processed_images')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })

      if (error) {
        throw error
      }

      return data || []
    } catch (error) {
      console.error('Error getting user images:', error)
      return []
    }
  }
}
