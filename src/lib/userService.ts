import { supabase } from './supabaseClient'

export interface User {
  id: string
  email: string
  is_pro: boolean
  free_edits_used: number
  stripe_customer_id?: string
  created_at: string
  updated_at: string
}

export class UserService {
  // Get or create user record
  static async getUser(userId: string, email: string): Promise<User> {
    try {
      // Try to get existing user from users table first
      const { data: existingUser, error: fetchError } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single()

      if (fetchError && fetchError.code !== 'PGRST116') { // PGRST116 = no rows found
        // If users table doesn't exist, fall back to user_usage table
        if (fetchError.code === 'PGRST205') {
          console.log('Users table not found, falling back to user_usage table')
          return await this.getUserFromUsageTable(userId, email)
        }
        throw fetchError
      }

      if (existingUser) {
        return existingUser
      }

      // Create new user if none exists
      const { data: newUser, error: createError } = await supabase
        .from('users')
        .insert({
          id: userId,
          email: email,
          is_pro: false,
          free_edits_used: 0
        })
        .select()
        .single()

      if (createError) {
        // Fall back to user_usage table if users table insert fails
        return await this.getUserFromUsageTable(userId, email)
      }

      return newUser
    } catch (error) {
      console.error('Error getting user:', error)
      console.error('Error details:', {
        message: error instanceof Error ? error.message : 'Unknown error',
        code: (error as any)?.code,
        details: (error as any)?.details,
        hint: (error as any)?.hint
      })
      
      // Return a fallback user object
      return {
        id: userId,
        email: email,
        is_pro: false,
        free_edits_used: 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
    }
  }

  // Fallback method to use user_usage table when users table doesn't exist
  static async getUserFromUsageTable(userId: string, email: string): Promise<User> {
    try {
      // Try to get existing user from user_usage table
      const { data: existingUsage, error: fetchError } = await supabase
        .from('user_usage')
        .select('*')
        .eq('user_id', userId)
        .single()

      if (fetchError && fetchError.code !== 'PGRST116') { // PGRST116 = no rows found
        throw fetchError
      }

      if (existingUsage) {
        // Convert user_usage record to User format
        return {
          id: userId,
          email: email,
          is_pro: false, // Default to false since user_usage doesn't have is_pro
          free_edits_used: existingUsage.free_edits_used || 0,
          created_at: existingUsage.created_at,
          updated_at: existingUsage.updated_at
        }
      }

      // Create new user_usage record if none exists
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

      // Convert to User format
      return {
        id: userId,
        email: email,
        is_pro: false,
        free_edits_used: newUsage.free_edits_used,
        created_at: newUsage.created_at,
        updated_at: newUsage.updated_at
      }
    } catch (error) {
      console.error('Error getting user from usage table:', error)
      // Return fallback user object
      return {
        id: userId,
        email: email,
        is_pro: false,
        free_edits_used: 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
    }
  }

  // Update user's Pro status
  static async updateProStatus(userId: string, isPro: boolean, stripeCustomerId?: string): Promise<User> {
    try {
      const updateData: any = { is_pro: isPro }
      if (stripeCustomerId) {
        updateData.stripe_customer_id = stripeCustomerId
      }

      const { data: updatedUser, error } = await supabase
        .from('users')
        .update(updateData)
        .eq('id', userId)
        .select()
        .single()

      if (error) {
        throw error
      }

      return updatedUser
    } catch (error) {
      console.error('Error updating Pro status:', error)
      throw error
    }
  }

  // Increment usage count
  static async incrementUsage(userId: string): Promise<User> {
    try {
      const currentUser = await this.getUser(userId, '') // We'll get the user first
      
      const { data: updatedUser, error } = await supabase
        .from('users')
        .update({
          free_edits_used: currentUser.free_edits_used + 1,
          updated_at: new Date().toISOString()
        })
        .eq('id', userId)
        .select()
        .single()

      if (error) {
        throw error
      }

      return updatedUser
    } catch (error) {
      console.error('Error incrementing usage:', error)
      throw error
    }
  }

  // Check if user has free edits remaining
  static async hasFreeEditsRemaining(userId: string): Promise<boolean> {
    try {
      const user = await this.getUser(userId, '')
      
      // Pro users have unlimited edits
      if (user.is_pro) {
        return true
      }
      
      // Free users have 5 edits limit (total, not per month)
      return user.free_edits_used < 5
    } catch (error) {
      console.error('Error checking free edits:', error)
      return true // Allow processing if we can't check
    }
  }

  // Get user's remaining free edits
  static async getRemainingEdits(userId: string): Promise<number> {
    try {
      const user = await this.getUser(userId, '')
      
      // Pro users have unlimited edits
      if (user.is_pro) {
        return -1 // -1 indicates unlimited
      }
      
      // Free users have 5 edits limit (total, not per month)
      return Math.max(0, 5 - user.free_edits_used)
    } catch (error) {
      console.error('Error getting remaining edits:', error)
      return 5 // Fallback to full limit
    }
  }
}
