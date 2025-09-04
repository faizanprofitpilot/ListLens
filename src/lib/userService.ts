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
  // Get or create user record from users table only
  static async getUser(userId: string, email: string): Promise<User> {
    try {
      // Get existing user from users table
      const { data: existingUser, error: fetchError } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single()

      if (fetchError && fetchError.code !== 'PGRST116') { // PGRST116 = no rows found
        console.error('Error fetching user:', fetchError)
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
        console.error('Error creating user:', createError)
        throw createError
      }

      return newUser
    } catch (error) {
      console.error('Error getting user:', error)
      console.error('Error details:', {
        message: error instanceof Error ? error.message : 'Unknown error',
        code: (error as Record<string, unknown>)?.code,
        details: (error as Record<string, unknown>)?.details,
        hint: (error as Record<string, unknown>)?.hint
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


  // Update user's Pro status
  static async updateProStatus(userId: string, isPro: boolean, stripeCustomerId?: string): Promise<User> {
    try {
      const updateData: Record<string, unknown> = { is_pro: isPro }
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

  // Increment usage count in users table only
  static async incrementUsage(userId: string): Promise<User> {
    try {
      // Get current user data
      const currentUser = await this.getUser(userId, '')
      
      // Update users table with incremented usage
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
        console.error('Error updating usage in users table:', error)
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
