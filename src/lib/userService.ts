import { supabase } from './supabaseClient'

export interface User {
  id: string
  email: string
  is_pro: boolean
  plan: 'free' | 'pro' | 'turbo'
  free_edits_used: number
  monthly_edits_used: number
  last_reset_date: string
  stripe_customer_id?: string
  created_at: string
  updated_at: string
}

export class UserService {
  // Get plan quota based on plan type
  static getPlanQuota(plan: 'free' | 'pro' | 'turbo'): number {
    switch (plan) {
      case 'free': return 5
      case 'pro': return 350
      case 'turbo': return 2000
      default: return 5
    }
  }

  // Check if monthly reset is needed
  static needsMonthlyReset(lastResetDate: string): boolean {
    const lastReset = new Date(lastResetDate)
    const now = new Date()
    const currentMonth = now.getMonth()
    const currentYear = now.getFullYear()
    const lastResetMonth = lastReset.getMonth()
    const lastResetYear = lastReset.getFullYear()
    
    return currentMonth !== lastResetMonth || currentYear !== lastResetYear
  }

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
          plan: 'free',
          free_edits_used: 0,
          monthly_edits_used: 0,
          last_reset_date: new Date().toISOString()
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
        plan: 'free',
        free_edits_used: 0,
        monthly_edits_used: 0,
        last_reset_date: new Date().toISOString(),
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
      
      // Check if monthly reset is needed for Pro/Turbo users
      if (currentUser.plan !== 'free' && this.needsMonthlyReset(currentUser.last_reset_date)) {
        // Reset monthly usage first
        const { error: resetError } = await supabase
          .from('users')
          .update({
            monthly_edits_used: 0,
            last_reset_date: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
          .eq('id', userId)
          .select()
          .single()

        if (resetError) {
          console.error('Error resetting monthly usage:', resetError)
          throw resetError
        }
        
        currentUser.monthly_edits_used = 0
      }
      
      // Update usage based on plan
      const updateData: Record<string, unknown> = {
        updated_at: new Date().toISOString()
      }
      
      if (currentUser.plan === 'free') {
        updateData.free_edits_used = currentUser.free_edits_used + 1
      } else {
        updateData.monthly_edits_used = currentUser.monthly_edits_used + 1
      }
      
      const { data: updatedUser, error } = await supabase
        .from('users')
        .update(updateData)
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

  // Check if user has edits remaining
  static async hasEditsRemaining(userId: string): Promise<boolean> {
    try {
      const remaining = await this.getRemainingEdits(userId)
      return remaining > 0
    } catch (error) {
      console.error('Error checking edits remaining:', error)
      return true // Allow processing if we can't check
    }
  }

  // Get user's remaining edits
  static async getRemainingEdits(userId: string): Promise<number> {
    try {
      const user = await this.getUser(userId, '')
      
      // Check if monthly reset is needed for Pro/Turbo users
      if (user.plan !== 'free' && this.needsMonthlyReset(user.last_reset_date)) {
        // Reset monthly usage
        await supabase
          .from('users')
          .update({ 
            monthly_edits_used: 0,
            last_reset_date: new Date().toISOString()
          })
          .eq('id', userId)
        
        user.monthly_edits_used = 0
      }
      
      const quota = this.getPlanQuota(user.plan)
      const used = user.plan === 'free' ? user.free_edits_used : user.monthly_edits_used
      
      return Math.max(0, quota - used)
    } catch (error) {
      console.error('Error getting remaining edits:', error)
      return 5 // Fallback to free limit
    }
  }
}
