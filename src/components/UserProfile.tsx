'use client'

import { useState, useRef, useEffect } from 'react'
import { LogOut, CreditCard, Crown, Zap } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { UsageService } from '@/lib/usageService'
import { UserService } from '@/lib/userService'

interface UserProfileProps {
  onUsageUpdate?: () => void
  onUpgrade?: (plan: 'pro' | 'turbo') => void
}

export default function UserProfile({ onUsageUpdate, onUpgrade }: UserProfileProps = {}) {
  const { user, signOut } = useAuth()
  const [isOpen, setIsOpen] = useState(false)
  const [freeEditsRemaining, setFreeEditsRemaining] = useState<number | null>(null)
  const [isLoadingUsage, setIsLoadingUsage] = useState(true)
  const [isPro, setIsPro] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Fetch user usage data
  useEffect(() => {
    if (!user?.id) return
    const fetchUsage = async () => {
      if (!user?.id) return
      
      try {
        setIsLoadingUsage(true)
        const userData = await UserService.getUser(user.id, user.email || '')
        setIsPro(userData.is_pro)
        
        if (userData.is_pro) {
          setFreeEditsRemaining(-1) // -1 indicates unlimited
        } else {
          const remaining = Math.max(0, 5 - userData.free_edits_used) // 5 is the free limit
          setFreeEditsRemaining(remaining)
        }
      } catch (error) {
        console.error('Error fetching usage:', error)
        setFreeEditsRemaining(5) // Fallback to full limit
      } finally {
        setIsLoadingUsage(false)
      }
    }

    fetchUsage()
  }, [user?.id, user?.email])

  // Listen for usage updates from parent component
  useEffect(() => {
    if (onUsageUpdate) {
      const fetchUsage = async () => {
        if (!user?.id) return
        
        try {
          const usage = await UsageService.getUserUsage(user.id)
          const remaining = Math.max(0, 5 - usage.free_edits_used)
          setFreeEditsRemaining(remaining)
        } catch (error) {
          console.error('Error fetching usage:', error)
        }
      }
      
      fetchUsage()
    }
  }, [onUsageUpdate, user?.id])

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen])

  if (!user) return null

  const handleSignOut = async () => {
    try {
      await signOut()
      setIsOpen(false)
    } catch (error) {
      console.error('Sign out failed:', error)
    }
  }

  const handleManageSubscription = async () => {
    if (!user?.id) return

    try {
      const response = await fetch('/api/stripe/manage-subscription', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: user.id,
          action: 'create_portal_session'
        }),
      })

      const data = await response.json()

      if (data.success && data.url) {
        // Open Stripe Customer Portal
        window.open(data.url, '_blank')
        setIsOpen(false)
      } else {
        alert('Failed to open subscription management. Please try again.')
      }
    } catch (error) {
      console.error('Error managing subscription:', error)
      alert('Failed to open subscription management. Please try again.')
    }
  }

  // Generate user initials for avatar fallback
  const getUserInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  const displayName = user.user_metadata?.full_name || user.email?.split('@')[0] || 'User'
  const userInitials = getUserInitials(displayName)

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Profile Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 bg-white/90 hover:bg-white text-stone-700 px-3 py-2 rounded-lg transition-all duration-200 shadow-sm border border-stone-200 cursor-pointer hover:shadow-md"
      >
        <div className="w-8 h-8 bg-gradient-to-br from-amber-100 to-orange-100 rounded-full flex items-center justify-center overflow-hidden">
          {user.user_metadata?.avatar_url ? (
            <img
              src={user.user_metadata.avatar_url}
              alt="Profile"
              className="w-8 h-8 rounded-full object-cover"
              onError={(e) => {
                // Fallback to initials if image fails to load
                const target = e.target as HTMLImageElement
                target.style.display = 'none'
                const parent = target.parentElement
                if (parent) {
                  parent.innerHTML = `<span class="text-xs font-semibold text-amber-600">${userInitials}</span>`
                }
              }}
            />
          ) : (
            <span className="text-xs font-semibold text-amber-600">
              {userInitials}
            </span>
          )}
        </div>
        <div className="hidden sm:block">
          <span className="text-sm font-medium">
            {displayName}
          </span>
          {!isLoadingUsage && freeEditsRemaining !== null && (
            <div className="flex items-center gap-1 mt-0.5">
              {isPro ? (
                <>
                  <div className="w-2 h-2 bg-amber-500 rounded-full"></div>
                  <span className="text-xs text-amber-600 font-medium">
                    Pro - Unlimited
                  </span>
                </>
              ) : (
                <>
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="text-xs text-stone-500">
                    {freeEditsRemaining} edits left
                  </span>
                </>
              )}
            </div>
          )}
        </div>
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-72 bg-white rounded-xl shadow-xl border border-stone-200 z-[60] overflow-hidden">
          {/* User Info Header */}
          <div className="p-4 bg-gradient-to-br from-amber-50 to-orange-50 border-b border-stone-100">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-br from-amber-100 to-orange-100 rounded-full flex items-center justify-center overflow-hidden">
                {user.user_metadata?.avatar_url ? (
                  <img
                    src={user.user_metadata.avatar_url}
                    alt="Profile"
                    className="w-12 h-12 rounded-full object-cover"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement
                      target.style.display = 'none'
                      const parent = target.parentElement
                      if (parent) {
                        parent.innerHTML = `<span class="text-sm font-semibold text-amber-600">${userInitials}</span>`
                      }
                    }}
                  />
                ) : (
                  <span className="text-sm font-semibold text-amber-600">
                    {userInitials}
                  </span>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-stone-800 truncate">
                  {user.user_metadata?.full_name || 'User'}
                </p>
                <p className="text-xs text-stone-500 truncate">
                  {user.email}
                </p>
                <div className="flex items-center gap-2 mt-1">
                  <Crown className="w-3 h-3 text-amber-500" />
                  <span className="text-xs text-amber-600 font-medium">
                    {isPro ? 'Pro Plan' : 'Free Plan'}
                  </span>
                  {!isLoadingUsage && freeEditsRemaining !== null && !isPro && (
                    <>
                      <span className="text-xs text-stone-400">•</span>
                      <span className="text-xs text-stone-600">
                        {freeEditsRemaining} edits left
                      </span>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Menu Items */}
          <div className="py-2">
            {!isPro && (
              <button
                onClick={() => {
                  setIsOpen(false)
                  if (onUpgrade) {
                    onUpgrade('pro')
                  } else {
                    // Fallback: redirect to pricing section
                    const pricingSection = document.getElementById('pricing')
                    if (pricingSection) {
                      pricingSection.scrollIntoView({ behavior: 'smooth' })
                    }
                  }
                }}
                className="w-full flex items-center gap-3 px-4 py-3 text-sm text-amber-600 hover:bg-amber-50 transition-colors cursor-pointer font-medium"
              >
                <Zap className="w-4 h-4" />
                <span>Upgrade to Pro</span>
              </button>
            )}
            
            {isPro && (
              <button
                onClick={handleManageSubscription}
                className="w-full flex items-center gap-3 px-4 py-3 text-sm text-stone-700 hover:bg-stone-50 transition-colors cursor-pointer"
              >
                <CreditCard className="w-4 h-4" />
                <span>Manage Subscription</span>
              </button>
            )}
          </div>

          {/* Sign Out */}
          <div className="border-t border-stone-100 p-2">
            <button
              onClick={handleSignOut}
              className="w-full flex items-center gap-3 px-4 py-3 text-sm text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
