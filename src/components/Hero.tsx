'use client'

import { Upload, Sparkles } from 'lucide-react'

interface HeroProps {
  onUploadClick: () => void
}

export default function Hero({ onUploadClick }: HeroProps) {
  return (
    <div className="relative text-center py-16 px-4 sm:py-24 overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-gradient-to-br from-amber-50 via-orange-50 to-stone-50"></div>
        {/* Hexagonal Pattern */}
        <svg className="absolute inset-0 w-full h-full opacity-30" viewBox="0 0 100 100" preserveAspectRatio="xMidYMid slice">
          <defs>
            <pattern id="hero-hex-pattern" x="0" y="0" width="25" height="25" patternUnits="userSpaceOnUse">
              <polygon points="12.5,2 22.5,7 22.5,17 12.5,22 2.5,17 2.5,7" 
                       fill="currentColor" 
                       className="text-amber-300" 
                       opacity="0.4"/>
              <circle cx="12.5" cy="12" r="3" fill="currentColor" className="text-orange-400" opacity="0.6"/>
              <polygon points="12.5,5 17,7.5 17,12.5 12.5,15 8,12.5 8,7.5" 
                       fill="currentColor" 
                       className="text-stone-300" 
                       opacity="0.3"/>
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#hero-hex-pattern)"/>
        </svg>
        {/* Large Geometric Shapes */}
        <div className="absolute top-10 left-10 w-32 h-32 bg-gradient-to-br from-amber-200 to-orange-300 rounded-full opacity-40 animate-pulse"></div>
        <div className="absolute top-20 right-20 w-24 h-24 bg-gradient-to-br from-orange-300 to-stone-300 transform rotate-45 opacity-35 animate-bounce" style={{animationDelay: '1s'}}></div>
        <div className="absolute bottom-16 left-16 w-20 h-20 bg-gradient-to-br from-stone-300 to-amber-300 rounded-full opacity-45 animate-pulse" style={{animationDelay: '2s'}}></div>
        <div className="absolute bottom-24 right-12 w-28 h-28 bg-gradient-to-br from-amber-300 to-orange-400 transform rotate-12 opacity-30 animate-bounce" style={{animationDelay: '0.5s'}}></div>
        <div className="absolute top-1/2 left-1/4 w-16 h-16 bg-gradient-to-br from-orange-200 to-amber-400 rounded-full opacity-50 animate-pulse" style={{animationDelay: '1.5s'}}></div>
        <div className="absolute top-1/3 right-1/3 w-12 h-12 bg-gradient-to-br from-stone-200 to-orange-300 transform rotate-45 opacity-40 animate-bounce" style={{animationDelay: '2.5s'}}></div>
      </div>
      
      <div className="relative z-10 max-w-4xl mx-auto">
        {/* Main Headline */}
        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-stone-800 mb-6">
          Transform Your Real Estate Photos with{' '}
          <span className="bg-gradient-to-r from-amber-600 to-orange-600 bg-clip-text text-transparent">AI Magic</span>
        </h1>
        
        {/* Subheadline */}
        <p className="text-xl sm:text-2xl text-stone-600 mb-8 max-w-3xl mx-auto leading-relaxed">
          Upload any property photo and watch it transform into stunning, 
          professional listing images with HDR lighting, sky replacement, 
          and style filters.
        </p>
        
        {/* CTA Button */}
        <button
          onClick={onUploadClick}
          className="inline-flex items-center gap-3 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 text-white font-semibold py-4 px-8 rounded-xl text-lg transition-all duration-200 transform hover:scale-105 shadow-lg hover:shadow-xl cursor-pointer"
        >
          <Upload className="w-6 h-6" />
          Upload Your Free Photos
          <Sparkles className="w-5 h-5" />
        </button>
        
        {/* Trust Indicators */}
        <div className="mt-12 flex flex-col sm:flex-row items-center justify-center gap-8 text-sm text-stone-600">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-amber-500 rounded-full"></div>
            <span>5 Free Edits</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
            <span>No Credit Card Required</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-stone-500 rounded-full"></div>
            <span>Instant Results</span>
          </div>
        </div>
      </div>
    </div>
  )
}
