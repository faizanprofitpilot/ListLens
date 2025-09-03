'use client'

import { Check, Star, Zap } from 'lucide-react'

interface PricingProps {
  onUpgrade?: (plan: 'pro' | 'turbo') => void
}

export default function Pricing({ onUpgrade }: PricingProps = {}) {
  const scrollToUpload = () => {
    const element = document.getElementById('upload')
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' })
    }
  }

  return (
    <section id="pricing" className="relative py-20 bg-gradient-to-br from-stone-50 to-amber-50 overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-20">
        <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="xMidYMid slice">
          <defs>
            <pattern id="pricing-pattern" x="0" y="0" width="45" height="45" patternUnits="userSpaceOnUse">
              <polygon points="22.5,3 37.5,12 37.5,27 22.5,36 7.5,27 7.5,12" fill="currentColor" className="text-amber-200" opacity="0.3"/>
              <circle cx="22.5" cy="22.5" r="10" fill="currentColor" className="text-orange-200" opacity="0.4"/>
              <rect x="15" y="15" width="15" height="15" fill="currentColor" className="text-stone-200" opacity="0.25"/>
              <polygon points="22.5,10 30,15 27,25 20,22 17,15" fill="currentColor" className="text-amber-300" opacity="0.2"/>
              <circle cx="22.5" cy="22.5" r="3" fill="currentColor" className="text-orange-300" opacity="0.5"/>
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#pricing-pattern)"/>
        </svg>
        <div className="absolute top-24 left-16 w-36 h-36 bg-gradient-to-br from-amber-200 to-orange-200 rounded-full opacity-25 animate-pulse"></div>
        <div className="absolute top-16 right-20 w-28 h-28 bg-gradient-to-br from-orange-200 to-stone-200 transform rotate-45 opacity-20 animate-bounce" style={{animationDelay: '1.5s'}}></div>
        <div className="absolute bottom-24 left-20 w-32 h-32 bg-gradient-to-br from-stone-200 to-amber-200 rounded-full opacity-15 animate-pulse" style={{animationDelay: '2.5s'}}></div>
        <div className="absolute bottom-32 right-16 w-24 h-24 bg-gradient-to-br from-amber-200 to-orange-300 transform rotate-12 opacity-30 animate-bounce" style={{animationDelay: '0.5s'}}></div>
      </div>
      
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-stone-800 mb-4">
            Simple, Transparent Pricing
          </h2>
          <p className="text-xl text-stone-600 max-w-3xl mx-auto">
            Start with 5 free edits, then choose the plan that fits your real estate business needs
          </p>
        </div>

        {/* Pricing Cards */}
        <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {/* Free Plan */}
          <div className="bg-white rounded-2xl shadow-lg border border-stone-200 p-8 relative">
            <div className="text-center mb-8">
              <h3 className="text-2xl font-bold text-stone-800 mb-2">Free</h3>
              <div className="text-4xl font-bold text-stone-600 mb-2">$0</div>
              <p className="text-stone-500">Perfect for trying out our service</p>
            </div>
            
            <ul className="space-y-4 mb-8">
              <li className="flex items-center gap-3">
                <Check className="w-5 h-5 text-green-500 flex-shrink-0" />
                <span className="text-stone-700">5 photo edits (total)</span>
              </li>
              <li className="flex items-center gap-3">
                <Check className="w-5 h-5 text-green-500 flex-shrink-0" />
                <span className="text-stone-700">All 3 style options</span>
              </li>
              <li className="flex items-center gap-3">
                <Check className="w-5 h-5 text-green-500 flex-shrink-0" />
                <span className="text-stone-700">Chat refinements</span>
              </li>
              <li className="flex items-center gap-3">
                <Check className="w-5 h-5 text-green-500 flex-shrink-0" />
                <span className="text-stone-700">High-quality downloads</span>
              </li>
            </ul>

            <button
              onClick={scrollToUpload}
              className="w-full bg-stone-100 text-stone-700 py-3 rounded-lg font-medium hover:bg-stone-200 transition-colors cursor-pointer"
            >
              Get Started Free
            </button>
          </div>

          {/* Professional Plan */}
          <div className="bg-white rounded-2xl shadow-xl border-2 border-amber-500 p-8 relative transform scale-105">
            {/* Popular Badge */}
            <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
              <div className="bg-gradient-to-r from-amber-500 to-orange-600 text-white px-4 py-1 rounded-full text-sm font-medium flex items-center gap-1">
                <Star className="w-4 h-4" />
                Most Popular
              </div>
            </div>

            <div className="text-center mb-8">
              <h3 className="text-2xl font-bold text-stone-800 mb-2">Professional</h3>
              <div className="text-4xl font-bold text-amber-600 mb-2">$99</div>
              <p className="text-stone-500">per month</p>
            </div>
            
            <ul className="space-y-4 mb-8">
              <li className="flex items-center gap-3">
                <Check className="w-5 h-5 text-green-500 flex-shrink-0" />
                <span className="text-stone-700">350 photo edits per month</span>
              </li>
              <li className="flex items-center gap-3">
                <Check className="w-5 h-5 text-green-500 flex-shrink-0" />
                <span className="text-stone-700">All style options</span>
              </li>
              <li className="flex items-center gap-3">
                <Check className="w-5 h-5 text-green-500 flex-shrink-0" />
                <span className="text-stone-700">Unlimited chat refinements</span>
              </li>
              <li className="flex items-center gap-3">
                <Check className="w-5 h-5 text-green-500 flex-shrink-0" />
                <span className="text-stone-700">Priority processing</span>
              </li>
              <li className="flex items-center gap-3">
                <Check className="w-5 h-5 text-green-500 flex-shrink-0" />
                <span className="text-stone-700">Batch processing</span>
              </li>
              <li className="flex items-center gap-3">
                <Check className="w-5 h-5 text-green-500 flex-shrink-0" />
                <span className="text-stone-700">Email support</span>
              </li>
            </ul>

            <button
              onClick={() => onUpgrade ? onUpgrade('pro') : scrollToUpload()}
              className="w-full bg-gradient-to-r from-amber-600 to-orange-600 text-white py-3 rounded-lg font-medium hover:from-amber-700 hover:to-orange-700 transition-all shadow-lg cursor-pointer"
            >
              {onUpgrade ? 'Upgrade to Pro' : 'Start Professional'}
            </button>
          </div>

          {/* Enterprise Plan */}
          <div className="bg-white rounded-2xl shadow-lg border border-stone-200 p-8 relative">
            <div className="text-center mb-8">
              <h3 className="text-2xl font-bold text-stone-800 mb-2">Turbo</h3>
              <div className="text-4xl font-bold text-stone-600 mb-2">$499</div>
              <p className="text-stone-500">per month</p>
            </div>
            
            <ul className="space-y-4 mb-8">
              <li className="flex items-center gap-3">
                <Check className="w-5 h-5 text-green-500 flex-shrink-0" />
                <span className="text-stone-700">2000 photo edits per month</span>
              </li>
              <li className="flex items-center gap-3">
                <Check className="w-5 h-5 text-green-500 flex-shrink-0" />
                <span className="text-stone-700">All style options</span>
              </li>
              <li className="flex items-center gap-3">
                <Check className="w-5 h-5 text-green-500 flex-shrink-0" />
                <span className="text-stone-700">Unlimited chat refinements</span>
              </li>
              <li className="flex items-center gap-3">
                <Check className="w-5 h-5 text-green-500 flex-shrink-0" />
                <span className="text-stone-700">Fastest processing</span>
              </li>
              <li className="flex items-center gap-3">
                <Check className="w-5 h-5 text-green-500 flex-shrink-0" />
                <span className="text-stone-700">API access</span>
              </li>
              <li className="flex items-center gap-3">
                <Check className="w-5 h-5 text-green-500 flex-shrink-0" />
                <span className="text-stone-700">White-label options</span>
              </li>
              <li className="flex items-center gap-3">
                <Check className="w-5 h-5 text-green-500 flex-shrink-0" />
                <span className="text-stone-700">Priority support</span>
              </li>
            </ul>

            <button
              onClick={() => onUpgrade ? onUpgrade('turbo') : scrollToUpload()}
              className="w-full bg-stone-100 text-stone-700 py-3 rounded-lg font-medium hover:bg-stone-200 transition-colors cursor-pointer"
            >
              {onUpgrade ? 'Upgrade to Turbo' : 'Start Turbo'}
            </button>
          </div>
        </div>

        {/* Additional Info */}
        <div className="text-center mt-12">
          <p className="text-stone-600 mb-4">
            All plans include high-resolution downloads and commercial usage rights
          </p>
          <div className="flex items-center justify-center gap-6 text-sm text-stone-500">
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-amber-500" />
              <span>Cancel anytime</span>
            </div>
            <div className="flex items-center gap-2">
              <Check className="w-4 h-4 text-green-500" />
              <span>No setup fees</span>
            </div>
            <div className="flex items-center gap-2">
              <Star className="w-4 h-4 text-amber-500" />
              <span>30-day money back</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
