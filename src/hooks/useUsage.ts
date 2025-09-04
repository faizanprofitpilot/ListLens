import { useState, useEffect } from 'react'

interface UsageData {
  used: number
  quota: number
  remaining: number
  plan: 'free' | 'pro' | 'turbo'
  resets_at?: string
}

export function useUsage() {
  const [usage, setUsage] = useState<UsageData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchUsage = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/simple-usage', { credentials: 'include' })
      const data = await response.json()
      
      if (response.ok) {
        setUsage(data)
        setError(null)
      } else {
        setError(data.error || 'Failed to fetch usage')
      }
    } catch (err) {
      setError('Network error')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchUsage()
  }, [])

  return { usage, loading, error, refetch: fetchUsage }
}
