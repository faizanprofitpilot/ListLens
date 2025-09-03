'use client'

import { useState } from 'react'
import { Home, Crown, Building } from 'lucide-react'

export type StyleOption = 'airbnb' | 'luxury' | 'architectural'

interface StyleTogglesProps {
  selectedStyle: StyleOption | null
  onStyleSelect: (style: StyleOption) => void
}

const styleOptions = [
  {
    id: 'airbnb' as StyleOption,
    name: 'Airbnb Cozy',
    description: 'Warm, inviting atmosphere',
    icon: Home,
    emoji: '🌿',
    selectedBg: 'bg-gradient-to-br from-amber-50 to-orange-50',
    selectedBorder: 'border-amber-500',
    selectedText: 'text-amber-800',
    selectedDesc: 'text-amber-700',
    selectedIcon: 'text-amber-600',
    selectedDot: 'bg-amber-500'
  },
  {
    id: 'luxury' as StyleOption,
    name: 'Luxury Listing',
    description: 'High-end, sophisticated look',
    icon: Crown,
    emoji: '✨',
    selectedBg: 'bg-gradient-to-br from-stone-50 to-amber-50',
    selectedBorder: 'border-stone-600',
    selectedText: 'text-stone-800',
    selectedDesc: 'text-stone-700',
    selectedIcon: 'text-stone-600',
    selectedDot: 'bg-stone-600'
  },
  {
    id: 'architectural' as StyleOption,
    name: 'Architectural Digest',
    description: 'Clean, modern design focus',
    icon: Building,
    emoji: '📰',
    selectedBg: 'bg-gradient-to-br from-orange-50 to-red-50',
    selectedBorder: 'border-orange-500',
    selectedText: 'text-orange-800',
    selectedDesc: 'text-orange-700',
    selectedIcon: 'text-orange-600',
    selectedDot: 'bg-orange-500'
  }
]

export default function StyleToggles({ selectedStyle, onStyleSelect }: StyleTogglesProps) {
  return (
    <div className="w-full max-w-4xl mx-auto">
      <h3 className="text-2xl font-bold text-stone-800 text-center mb-8">
        Choose Your Style
      </h3>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {styleOptions.map((option) => {
          const Icon = option.icon
          const isSelected = selectedStyle === option.id
          
          return (
            <button
              key={option.id}
              onClick={() => onStyleSelect(option.id)}
              className={`relative p-6 rounded-2xl border-2 transition-all duration-200 transform hover:scale-105 ${
                isSelected
                  ? `${option.selectedBg} ${option.selectedBorder} shadow-xl`
                  : 'border-stone-200 hover:border-amber-300 bg-gradient-to-br from-white to-stone-50 hover:shadow-lg'
              }`}
            >
              <div className="text-center">
                <div className="text-4xl mb-3">{option.emoji}</div>
                <Icon className={`w-8 h-8 mx-auto mb-3 ${
                  isSelected ? option.selectedIcon : 'text-stone-600'
                }`} />
                <h4 className={`font-semibold text-lg mb-2 ${
                  isSelected ? option.selectedText : 'text-stone-800'
                }`}>
                  {option.name}
                </h4>
                <p className={`text-sm ${
                  isSelected ? option.selectedDesc : 'text-stone-600'
                }`}>
                  {option.description}
                </p>
              </div>
              
              {isSelected && (
                <div className={`absolute top-3 right-3 w-6 h-6 ${option.selectedDot} rounded-full flex items-center justify-center shadow-md`}>
                  <div className="w-2 h-2 bg-white rounded-full"></div>
                </div>
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}
