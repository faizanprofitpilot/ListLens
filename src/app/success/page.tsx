'use client'

import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { CheckCircle, Loader2 } from 'lucide-react'
import { useUsage } from '@/hooks/useUsage'

export default function SuccessPage() {
  const searchParams = useSearchParams()
  const sessionId = searchParams.get('session_id')
  const { usage, refetch: refetchUsage } = useUsage()
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const checkSubscriptionStatus = async () => {
      if (!sessionId) {
        setError('No session ID provided')
        setIsLoading(false)
        return
      }

      try {
        // Wait a moment for webhook to process
        await new Promise(resolve => setTimeout(resolve, 2000))
        
        // Refetch usage data to get updated Pro status
        await refetchUsage()
        
        setIsLoading(false)
      } catch (err) {
        console.error('Error checking subscription status:', err)
        setError('Failed to verify subscription status')
        setIsLoading(false)
      }
    }

    checkSubscriptionStatus()
  }, [sessionId, refetchUsage])

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-50 to-orange-100 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-amber-600 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Processing your subscription...</h2>
          <p className="text-gray-600">Please wait while we activate your Pro account.</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-50 to-orange-100 flex items-center justify-center">
        <div className="text-center">
          <div className="bg-red-100 rounded-full p-4 w-16 h-16 mx-auto mb-4 flex items-center justify-center">
            <span className="text-red-600 text-2xl">⚠️</span>
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Subscription Error</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <Link
            href="/"
            className="inline-flex items-center px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors"
          >
            Return to Home
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 to-orange-100 flex items-center justify-center">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center">
        <div className="bg-green-100 rounded-full p-4 w-16 h-16 mx-auto mb-6 flex items-center justify-center">
          <CheckCircle className="h-8 w-8 text-green-600" />
        </div>
        
        <h1 className="text-2xl font-bold text-gray-900 mb-4">
          Welcome to Pro! 🎉
        </h1>
        
        <p className="text-gray-600 mb-6">
          Your subscription has been successfully activated. You now have unlimited image processing credits.
        </p>

        {usage && (
          <div className="bg-amber-50 rounded-lg p-4 mb-6">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700">Your Plan:</span>
              <span className="text-sm font-bold text-amber-700 uppercase">{usage.plan}</span>
            </div>
            <div className="flex items-center justify-between mt-2">
              <span className="text-sm font-medium text-gray-700">Credits:</span>
              <span className="text-sm font-bold text-amber-700">
                {usage.plan !== 'free' ? 'Unlimited' : `${usage.remaining} remaining`}
              </span>
            </div>
          </div>
        )}

        <div className="space-y-3">
          <Link
            href="/"
            className="w-full inline-flex items-center justify-center px-4 py-3 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors font-medium"
          >
            Start Processing Images
          </Link>
          
          <Link
            href="/?manage=true"
            className="w-full inline-flex items-center justify-center px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
          >
            Manage Subscription
          </Link>
        </div>

        <p className="text-xs text-gray-500 mt-6">
          Session ID: {sessionId}
        </p>
      </div>
    </div>
  )
}
