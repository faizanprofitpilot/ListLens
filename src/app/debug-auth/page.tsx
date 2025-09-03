'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'

export default function DebugAuthPage() {
  const { user, session, loading } = useAuth()
  const [apiTest, setApiTest] = useState<any>(null)
  const [testing, setTesting] = useState(false)

  const testAPI = async () => {
    setTesting(true)
    try {
      const response = await fetch('/api/debug-auth-test', { 
        credentials: 'include' 
      })
      const data = await response.json()
      setApiTest(data)
    } catch (error) {
      setApiTest({ error: error.message })
    } finally {
      setTesting(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Authentication Debug Page</h1>
        
        {/* Frontend Auth Status */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Frontend Authentication Status</h2>
          <div className="space-y-2">
            <p><strong>Loading:</strong> {loading ? 'Yes' : 'No'}</p>
            <p><strong>User:</strong> {user ? 'Authenticated' : 'Not authenticated'}</p>
            {user && (
              <>
                <p><strong>User ID:</strong> {user.id}</p>
                <p><strong>Email:</strong> {user.email}</p>
              </>
            )}
            <p><strong>Session:</strong> {session ? 'Active' : 'No session'}</p>
            {session && (
              <p><strong>Session Expires:</strong> {new Date(session.expires_at! * 1000).toLocaleString()}</p>
            )}
          </div>
        </div>

        {/* API Test */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">API Authentication Test</h2>
          <button
            onClick={testAPI}
            disabled={testing}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
          >
            {testing ? 'Testing...' : 'Test API Authentication'}
          </button>
          
          {apiTest && (
            <div className="mt-4">
              <h3 className="font-semibold mb-2">API Response:</h3>
              <pre className="bg-gray-100 p-4 rounded text-sm overflow-auto">
                {JSON.stringify(apiTest, null, 2)}
              </pre>
            </div>
          )}
        </div>

        {/* Cookies Info */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Browser Cookies</h2>
          <div className="space-y-2">
            <p><strong>All Cookies:</strong></p>
            <pre className="bg-gray-100 p-4 rounded text-sm overflow-auto">
              {document.cookie || 'No cookies found'}
            </pre>
          </div>
        </div>
      </div>
    </div>
  )
}
