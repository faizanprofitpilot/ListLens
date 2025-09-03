'use client'

import { useState } from 'react'
import { Menu, X } from 'lucide-react'
import Image from 'next/image'
import { useAuth } from '@/contexts/AuthContext'
import UserProfile from './UserProfile'

interface NavigationProps {
  onUpgrade?: (plan: 'pro' | 'turbo') => void
}

export default function Navigation({ onUpgrade }: NavigationProps = {}) {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const { user } = useAuth()

  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId)
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' })
    }
    setIsMenuOpen(false)
  }

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-md border-b border-stone-200 relative">
      {/* Subtle Background Pattern */}
      <div className="absolute inset-0 opacity-5">
        <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="xMidYMid slice">
          <defs>
            <pattern id="nav-pattern" x="0" y="0" width="20" height="20" patternUnits="userSpaceOnUse">
              <circle cx="10" cy="10" r="1" fill="currentColor" className="text-amber-400"/>
              <rect x="8" y="8" width="4" height="4" fill="currentColor" className="text-orange-300" opacity="0.5"/>
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#nav-pattern)"/>
        </svg>
      </div>
      
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 relative">
              <Image
                src="/ListLens Logo.png"
                alt="ListLens Logo"
                fill
                className="object-contain"
              />
            </div>
            <span className="text-xl font-bold text-stone-800">ListLens</span>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            <button
              onClick={() => scrollToSection('features')}
              className="text-stone-600 hover:text-amber-600 transition-colors font-medium cursor-pointer"
            >
              Features
            </button>
            <button
              onClick={() => scrollToSection('pricing')}
              className="text-stone-600 hover:text-amber-600 transition-colors font-medium cursor-pointer"
            >
              Pricing
            </button>
            <button
              onClick={() => scrollToSection('how-it-works')}
              className="text-stone-600 hover:text-amber-600 transition-colors font-medium cursor-pointer"
            >
              How It Works
            </button>
            {user ? (
              <UserProfile onUpgrade={onUpgrade} />
            ) : (
              <button
                onClick={() => scrollToSection('upload')}
                className="bg-gradient-to-r from-amber-600 to-orange-600 text-white px-6 py-2 rounded-lg hover:from-amber-700 hover:to-orange-700 transition-all font-medium shadow-lg cursor-pointer"
              >
                Get Started
              </button>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="text-stone-600 hover:text-amber-600 transition-colors cursor-pointer"
            >
              {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className="md:hidden">
            <div className="px-2 pt-2 pb-3 space-y-1 bg-white border-t border-stone-200">
              <button
                onClick={() => scrollToSection('features')}
                className="block w-full text-left px-3 py-2 text-stone-600 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors font-medium cursor-pointer"
              >
                Features
              </button>
              <button
                onClick={() => scrollToSection('pricing')}
                className="block w-full text-left px-3 py-2 text-stone-600 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors font-medium cursor-pointer"
              >
                Pricing
              </button>
              <button
                onClick={() => scrollToSection('how-it-works')}
                className="block w-full text-left px-3 py-2 text-stone-600 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors font-medium cursor-pointer"
              >
                How It Works
              </button>
              <button
                onClick={() => scrollToSection('upload')}
                className="block w-full text-left px-3 py-2 bg-gradient-to-r from-amber-600 to-orange-600 text-white rounded-lg hover:from-amber-700 hover:to-orange-700 transition-all font-medium mx-3 mt-2 cursor-pointer"
              >
                Get Started
              </button>
            </div>
          </div>
        )}
      </div>
    </nav>
  )
}
