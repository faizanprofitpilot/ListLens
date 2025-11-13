'use client'

import Link from 'next/link'
import { CheckCircle } from 'lucide-react'

export default function AuthSuccessPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 to-orange-100 flex items-center justify-center">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center">
        <div className="bg-green-100 rounded-full p-4 w-16 h-16 mx-auto mb-6 flex items-center justify-center">
          <CheckCircle className="h-8 w-8 text-green-600" />
        </div>
        
        <h1 className="text-2xl font-bold text-gray-900 mb-4">
          Signup Successful! 🎉
        </h1>
        
        <p className="text-gray-600 mb-6">
          Your account has been created successfully. You can now start transforming your real estate photos with AI.
        </p>

        <div className="space-y-3">
          <Link
            href="/"
            className="w-full inline-flex items-center justify-center px-4 py-3 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors font-medium"
          >
            Get Started
          </Link>
        </div>
      </div>
    </div>
  )
}

