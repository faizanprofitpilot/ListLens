'use client'

import { useState, useEffect, useCallback } from 'react'
import Navigation from '@/components/Navigation'
import Hero from '@/components/Hero'
import UploadBox from '@/components/UploadBox'
import StyleToggles, { StyleOption } from '@/components/StyleToggles'
// import PreviewSlider from '@/components/PreviewSlider'
import ChatFeedback from '@/components/ChatFeedback'
import Pricing from '@/components/Pricing'
import MobileUploadModal from '@/components/MobileUploadModal'
import SignInModal from '@/components/SignInModal'
import { Zap, Star, Users, Eye, Download, MessageCircle, X, ChevronLeft, ChevronRight, Smartphone, Upload } from 'lucide-react'
import Image from 'next/image'
import { useAuth } from '@/contexts/AuthContext'
import { useUsage } from '@/hooks/useUsage'
import { UserService } from '@/lib/userService'

// Global type declaration for refresh function
declare global {
  interface Window {
    refreshUserProfile?: () => void
  }
}

interface ProcessedImage {
  originalUrl: string
  processedUrl: string
  fileName: string
  style: StyleOption
}

export default function Home() {
  const { user, loading: authLoading } = useAuth()
  const { usage, refetch: refetchUsage } = useUsage()
  const [selectedFiles, setSelectedFiles] = useState<File[]>([])
  const [selectedStyle, setSelectedStyle] = useState<StyleOption | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [processedImages, setProcessedImages] = useState<ProcessedImage[]>([])
  const [error, setError] = useState<string | null>(null)
  const [isChatOpen, setIsChatOpen] = useState(false)
  const [chatTargetImage, setChatTargetImage] = useState<ProcessedImage | null>(null)
  const [isSlideshowPaused, setIsSlideshowPaused] = useState(false)
  const [batchProgress, setBatchProgress] = useState<{ current: number; total: number } | null>(null)
  const [previewImage, setPreviewImage] = useState<string | null>(null)
  const [previewTitle, setPreviewTitle] = useState('')
  const [currentImageIndex, setCurrentImageIndex] = useState(0)
  const [customDescription, setCustomDescription] = useState('')
  const [isMobileUploadOpen, setIsMobileUploadOpen] = useState(false)
  const [isSignInModalOpen, setIsSignInModalOpen] = useState(false)
  // const [isUpgrading, setIsUpgrading] = useState(false)

  // Ensure user record exists in database when user is authenticated
  useEffect(() => {
    const ensureUserRecord = async () => {
      if (user?.id && user?.email) {
        try {
          await UserService.getUser(user.id, user.email)
          console.log('User record ensured in database')
        } catch (error) {
          console.error('Error ensuring user record:', error)
          // If there's an error, the user might need to sign in again
          // This will be handled by the usage hook which will show an error
        }
      }
    }

    if (!authLoading && user) {
      ensureUserRecord()
    }
  }, [user, authLoading])

  const handleFileSelect = useCallback((files: File[]) => {
    setSelectedFiles(files)
    setProcessedImages([]) // Reset processed images when new files are selected
    setCustomDescription('') // Clear custom description when new files are selected
    setError(null) // Clear any previous errors
  }, [])

  const handleRemoveFile = (index: number) => {
    const newFiles = selectedFiles.filter((_, i) => i !== index)
    setSelectedFiles(newFiles)
    if (newFiles.length === 0) {
      setProcessedImages([])
      setSelectedStyle(null)
      setError(null)
      setIsChatOpen(false)
      setChatTargetImage(null)
    }
  }

  const handleRemoveAllFiles = () => {
    setSelectedFiles([])
    setProcessedImages([])
    setSelectedStyle(null)
    setCustomDescription('')
    setError(null)
    setIsChatOpen(false)
    setChatTargetImage(null)
  }

  const handleImageUpdate = (newImage: string) => {
    // For chat refinements, update the specific target image
    if (chatTargetImage && processedImages.length > 0) {
      const updatedImages = processedImages.map(img => 
        img.originalUrl === chatTargetImage.originalUrl && img.processedUrl === chatTargetImage.processedUrl
          ? { ...img, processedUrl: newImage }
          : img
      )
      setProcessedImages(updatedImages)
      // Update the chat target image reference
      setChatTargetImage({ ...chatTargetImage, processedUrl: newImage })
    }
  }

  const handleCreditUpdate = () => {
    // Refetch usage data from server
    refetchUsage()
    // Trigger profile refresh
    if (window.refreshUserProfile) {
      window.refreshUserProfile()
    }
  }

  const handleUpgrade = async (plan: 'pro' | 'turbo' = 'pro') => {
    if (!user) {
      setIsSignInModalOpen(true)
      return
    }

    try {
      const response = await fetch('/api/stripe/create-checkout-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: user.id,
          userEmail: user.email,
          plan: plan,
        }),
      })

      const data = await response.json()

      if (data.url) {
        window.location.href = data.url
      } else {
        throw new Error(data.error || 'Failed to create checkout session')
      }
    } catch (error) {
      console.error('Error creating checkout session:', error)
      alert('Failed to start upgrade process. Please try again.')
    } finally {
      // Upgrade process completed
    }
  }

  const handleStyleSelect = (style: StyleOption) => {
    setSelectedStyle(style)
  }

  const handlePreview = (imageUrl: string, title: string) => {
    setPreviewImage(imageUrl)
    setPreviewTitle(title)
    // Find the index of the current image for gallery navigation
    const index = processedImages.findIndex(img => img.processedUrl === imageUrl)
    setCurrentImageIndex(index >= 0 ? index : 0)
  }

  const handleDownload = async (imageUrl: string, filename: string) => {
    try {
      console.log('Attempting to download:', imageUrl, filename)
      
      // Handle data URLs differently - don't fetch them, convert directly
      if (imageUrl.startsWith('data:')) {
        // For data URLs, convert base64 to blob directly without fetch
        const base64Data = imageUrl.split(',')[1]
        const byteCharacters = atob(base64Data)
        const byteNumbers = new Array(byteCharacters.length)
        for (let i = 0; i < byteCharacters.length; i++) {
          byteNumbers[i] = byteCharacters.charCodeAt(i)
        }
        const byteArray = new Uint8Array(byteNumbers)
        const blob = new Blob([byteArray], { type: 'image/png' })
        
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = filename
        a.style.display = 'none'
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        window.URL.revokeObjectURL(url)
        console.log('Download completed for data URL')
        return
      }
      
      // For regular URLs, fetch and download
      const response = await fetch(imageUrl, {
        mode: 'cors',
        credentials: 'omit'
      })
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = filename
      a.style.display = 'none'
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      window.URL.revokeObjectURL(url)
      console.log('Download completed for regular URL')
      
    } catch (error) {
      console.error('Download failed:', error)
      // Fallback: try opening in new tab
      try {
        window.open(imageUrl, '_blank')
        console.log('Opened image in new tab as fallback')
      } catch (fallbackError) {
        console.error('Fallback also failed:', fallbackError)
        alert('Download failed. Please try right-clicking on the image and selecting "Save image as..."')
      }
    }
  }

  const handleDownloadAll = async () => {
    try {
      console.log('Starting bulk download of', processedImages.length, 'images')
      
      for (let i = 0; i < processedImages.length; i++) {
        const image = processedImages[i]
        console.log(`Downloading ${i + 1}/${processedImages.length}:`, image.fileName)
        
        // Use the improved handleDownload function
        await handleDownload(image.processedUrl, `enhanced-${image.fileName}`)
        
        // Small delay between downloads to avoid overwhelming the browser
        if (i < processedImages.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 500))
        }
      }
      
      console.log('Bulk download completed')
    } catch (error) {
      console.error('Download all failed:', error)
      setError('Failed to download some images. Please try downloading individually.')
    }
  }

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (!previewImage) return
    
    if (e.key === 'ArrowRight' && currentImageIndex < processedImages.length - 1) {
      const nextImage = processedImages[currentImageIndex + 1]
      setPreviewImage(nextImage.processedUrl)
      setPreviewTitle(`Enhanced ${nextImage.fileName}`)
      setCurrentImageIndex(currentImageIndex + 1)
    } else if (e.key === 'ArrowLeft' && currentImageIndex > 0) {
      const prevImage = processedImages[currentImageIndex - 1]
      setPreviewImage(prevImage.processedUrl)
      setPreviewTitle(`Enhanced ${prevImage.fileName}`)
      setCurrentImageIndex(currentImageIndex - 1)
    } else if (e.key === 'Escape') {
      setPreviewImage(null)
    }
  }, [previewImage, currentImageIndex, processedImages])

  const handleProcessImages = async () => {
    if (selectedFiles.length === 0 || !selectedStyle) return

    setIsProcessing(true)
    setError(null)
    setBatchProgress({ current: 0, total: selectedFiles.length })
    
    const newProcessedImages: ProcessedImage[] = []
    
    try {
      for (let i = 0; i < selectedFiles.length; i++) {
        const file = selectedFiles[i]
        setBatchProgress({ current: i + 1, total: selectedFiles.length })
        
        const formData = new FormData()
        formData.append('file', file)
        formData.append('style', selectedStyle)
        // User data is now obtained from JWT token in the API
        if (customDescription.trim()) {
          formData.append('customDescription', customDescription.trim())
        }

        // Create an AbortController for timeout
        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), 60000) // 60 second timeout
        
        const response = await fetch('/api/process', {
          method: 'POST',
          credentials: 'include',
          body: formData,
          signal: controller.signal,
        })
        
        clearTimeout(timeoutId)

        const result = await response.json()
        
        if (result.success) {
          newProcessedImages.push({
            originalUrl: URL.createObjectURL(file),
            processedUrl: result.processedUrl,
            fileName: file.name,
            style: selectedStyle
          })
          // Refresh usage data after successful processing
          handleCreditUpdate()
        } else {
          setError(result.error || `Failed to process ${file.name}`)
          if (result.upgradeRequired) {
            break // Stop processing if upgrade required
          }
        }
      }
      
      setProcessedImages(newProcessedImages)
    } catch (error) {
      console.error('Error processing images:', error)
      
      // Provide more specific error messages based on error type
      if (error instanceof TypeError && error.message.includes('fetch')) {
        setError('Connection failed. Please check your internet connection and try again.')
      } else if (error instanceof Error && (error.message.includes('timeout') || error.name === 'AbortError')) {
        setError('Request timed out. Please try with a smaller image or try again later.')
      } else if (error instanceof Error && error.message.includes('API')) {
        setError('AI service temporarily unavailable. Please try again in a few minutes.')
      } else {
        setError('Network error. Please check your connection and try again.')
      }
    } finally {
      setIsProcessing(false)
      setBatchProgress(null)
    }
  }

  const handleUploadClick = () => {
    // Scroll to upload section
    const uploadSection = document.getElementById('upload')
    uploadSection?.scrollIntoView({ behavior: 'smooth' })
  }

  // Add keyboard event listener for gallery navigation
  useEffect(() => {
    const handleKeyDownEvent = (e: KeyboardEvent) => handleKeyDown(e)
    if (previewImage) {
      document.addEventListener('keydown', handleKeyDownEvent)
    }
    return () => {
      document.removeEventListener('keydown', handleKeyDownEvent)
    }
  }, [previewImage, currentImageIndex, processedImages, handleKeyDown])

  // Poll for mobile upload completion
  useEffect(() => {
    let pollInterval: NodeJS.Timeout | null = null
    
    const pollForMobileUploads = async () => {
      if (!isMobileUploadOpen) return
      
      try {
        // Get the current session ID from localStorage
        const currentSessionId = localStorage.getItem('currentMobileSessionId')
        if (!currentSessionId) return
        
        const response = await fetch(`/api/mobile-upload?sessionId=${currentSessionId}`)
        const data = await response.json()
        
        if (data.success && data.session.files && data.session.files.length > 0) {
          // Convert base64 data back to File objects
          const files = data.session.files.map((fileData: { name: string; data: string; type: string }) => {
            const byteCharacters = atob(fileData.data)
            const byteNumbers = new Array(byteCharacters.length)
            for (let i = 0; i < byteCharacters.length; i++) {
              byteNumbers[i] = byteCharacters.charCodeAt(i)
            }
            const byteArray = new Uint8Array(byteNumbers)
            const blob = new Blob([byteArray], { type: fileData.type })
            return new File([blob], fileData.name, { type: fileData.type })
          })
          
          // Add the files to the main upload interface
          handleFileSelect(files)
          
          // Close the mobile upload modal
          setIsMobileUploadOpen(false)
          
          // Clear the session ID
          localStorage.removeItem('currentMobileSessionId')
          
          // Clear the polling interval
          if (pollInterval) {
            clearInterval(pollInterval)
            pollInterval = null
          }
          
          // Show success message
          alert(`Mobile upload successful! ${files.length} photos added to your upload.`)
        }
      } catch (error) {
        console.error('Error polling for mobile upload:', error)
      }
    }
    
    // Start polling when mobile upload modal is open
    if (isMobileUploadOpen) {
      pollInterval = setInterval(pollForMobileUploads, 2000) // Poll every 2 seconds
    }
    
    return () => {
      if (pollInterval) {
        clearInterval(pollInterval)
      }
    }
  }, [isMobileUploadOpen, handleFileSelect])

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-stone-50 to-orange-50">
      <Navigation onUpgrade={handleUpgrade} />
      <div className="pt-16">
        {/* Hero Section */}
        <Hero onUploadClick={handleUploadClick} />
      </div>

      {/* AI Output Illustration Section */}
      <section className="relative py-16 px-4 bg-white overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-20">
          <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="xMidYMid slice">
            <defs>
              <pattern id="illustration-pattern" x="0" y="0" width="30" height="30" patternUnits="userSpaceOnUse">
                <circle cx="15" cy="15" r="2" fill="currentColor" className="text-amber-200"/>
                <rect x="10" y="10" width="10" height="10" fill="currentColor" className="text-orange-100" opacity="0.5"/>
                <polygon points="15,5 25,10 20,20 10,15" fill="currentColor" className="text-stone-200" opacity="0.3"/>
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#illustration-pattern)"/>
          </svg>
          <div className="absolute top-20 right-10 w-20 h-20 bg-gradient-to-br from-amber-100 to-orange-100 rounded-full opacity-30 animate-pulse"></div>
          <div className="absolute bottom-20 left-10 w-16 h-16 bg-gradient-to-br from-orange-100 to-stone-100 transform rotate-45 opacity-25 animate-bounce" style={{animationDelay: '1s'}}></div>
        </div>
        
        <div className="relative z-10 max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-stone-800 mb-4">
              See the Magic in Action
            </h2>
            <p className="text-xl text-stone-600 max-w-3xl mx-auto">
              Watch how our AI transforms ordinary property photos into stunning, professional listings that sell faster
            </p>
          </div>
          
                              <div className="flex justify-center">
            <div className="max-w-7xl w-full relative">
              {/* Animated Container */}
              <div className="relative overflow-hidden rounded-3xl shadow-2xl border border-stone-200 bg-gradient-to-br from-amber-50 to-orange-50 p-8">
                {/* Glow Effect */}
                <div className="absolute inset-0 bg-gradient-to-r from-amber-400 via-orange-400 to-amber-400 opacity-20 rounded-3xl animate-pulse"></div>
                
                {/* Slideshow Container */}
                <div className="relative z-10 transform transition-all duration-1000 ease-out animate-slideInUp">
                  <div className="relative w-full h-auto rounded-2xl shadow-xl overflow-hidden group">
                    {/* Image 1 */}
                    <div className="slideshow-slide active">
        <Image
                        src="/Listlens landing 1.png"
                        alt="AI Real Estate Photo Enhancement - Before and After Comparison"
                        width={1200}
                        height={900}
                        className="w-full h-auto hover:scale-105 transition-transform duration-500"
          priority
        />
                    </div>
                    
                    {/* Image 2 */}
                    <div className="slideshow-slide">
                      <Image
                        src="/Mock2.png"
                        alt="AI Real Estate Photo Enhancement - Professional Staging"
                        width={1200}
                        height={900}
                        className="w-full h-auto hover:scale-105 transition-transform duration-500"
                      />
                    </div>
                    
                    {/* Image 3 */}
                    <div className="slideshow-slide">
                      <Image
                        src="/Mock3.png"
                        alt="AI Real Estate Photo Enhancement - Luxury Interior"
                        width={1200}
                        height={900}
                        className="w-full h-auto hover:scale-105 transition-transform duration-500"
                      />
                    </div>
                    
                    {/* Image 4 */}
                    <div className="slideshow-slide">
            <Image
                        src="/Mock4.png"
                        alt="AI Real Estate Photo Enhancement - Modern Living"
                        width={1200}
                        height={900}
                        className="w-full h-auto hover:scale-105 transition-transform duration-500"
                      />
                    </div>
                    
                    {/* Pause/Play Button */}
                    <button
                      onClick={() => {
                        const slides = document.querySelectorAll('.slideshow-slide');
                        const newPausedState = !isSlideshowPaused;
                        setIsSlideshowPaused(newPausedState);
                        
                        slides.forEach(slide => {
                          (slide as HTMLElement).style.animationPlayState = newPausedState ? 'paused' : 'running';
                        });
                      }}
                      className="absolute top-4 right-4 bg-white/90 hover:bg-white text-stone-700 p-2 rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-20 cursor-pointer"
                      title={isSlideshowPaused ? "Resume slideshow" : "Pause slideshow"}
                    >
                      {isSlideshowPaused ? (
                        // Play icon
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                        </svg>
                      ) : (
                        // Pause icon
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM7 8a1 1 0 012 0v4a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v4a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                        </svg>
                      )}
                    </button>
                  </div>
                </div>
                
                {/* Floating Elements - Bigger */}
                <div className="absolute top-8 right-8 w-16 h-16 bg-gradient-to-br from-amber-400 to-orange-500 rounded-full opacity-80 animate-bounce" style={{animationDelay: '0.5s'}}></div>
                <div className="absolute bottom-8 left-8 w-12 h-12 bg-gradient-to-br from-orange-400 to-amber-500 rounded-full opacity-70 animate-pulse" style={{animationDelay: '1s'}}></div>
                <div className="absolute top-1/2 left-4 w-8 h-8 bg-gradient-to-br from-stone-400 to-amber-400 rounded-full opacity-60 animate-bounce" style={{animationDelay: '1.5s'}}></div>
                <div className="absolute top-1/4 right-1/4 w-10 h-10 bg-gradient-to-br from-amber-300 to-orange-400 rounded-full opacity-75 animate-pulse" style={{animationDelay: '2s'}}></div>
                
                {/* Sparkle Effects - Bigger */}
                <div className="absolute top-16 left-16 text-2xl text-amber-400 animate-ping" style={{animationDelay: '2s'}}>✨</div>
                <div className="absolute bottom-16 right-16 text-2xl text-orange-400 animate-ping" style={{animationDelay: '2.5s'}}>✨</div>
                <div className="absolute top-1/3 right-16 text-2xl text-amber-500 animate-ping" style={{animationDelay: '3s'}}>✨</div>
                <div className="absolute bottom-1/3 left-16 text-2xl text-orange-500 animate-ping" style={{animationDelay: '3.5s'}}>✨</div>
              </div>
              
              {/* Animated Border */}
              <div className="absolute inset-0 rounded-3xl border-4 border-transparent bg-gradient-to-r from-amber-400 via-orange-400 to-amber-400 opacity-0 animate-borderGlow" style={{animationDelay: '1s'}}></div>
            </div>
          </div>
          
          {/* Feature highlights */}
          <div className="grid md:grid-cols-3 gap-8 mt-12">
            <div className="text-center">
              <div className="w-12 h-12 bg-gradient-to-br from-amber-100 to-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">⚡</span>
              </div>
              <h3 className="text-lg font-semibold text-stone-800 mb-2">Lightning Fast</h3>
              <p className="text-stone-600">
                Get professional results in seconds, not hours
              </p>
            </div>
            
            <div className="text-center">
              <div className="w-12 h-12 bg-gradient-to-br from-amber-100 to-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">🎨</span>
              </div>
              <h3 className="text-lg font-semibold text-stone-800 mb-2">Multiple Styles</h3>
              <p className="text-stone-600">
                Choose from Airbnb, Luxury, or Architectural styles
              </p>
            </div>
            
            <div className="text-center">
              <div className="w-12 h-12 bg-gradient-to-br from-amber-100 to-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">📱</span>
              </div>
              <h3 className="text-lg font-semibold text-stone-800 mb-2">Mobile Upload</h3>
              <p className="text-stone-600">
                Upload photos directly from your phone on-site
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Upload Section */}
      <section id="upload" className="relative py-16 px-4 overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-15">
          <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="xMidYMid slice">
            <defs>
              <pattern id="upload-pattern" x="0" y="0" width="40" height="40" patternUnits="userSpaceOnUse">
                <rect x="0" y="0" width="40" height="40" fill="currentColor" className="text-amber-50" opacity="0.3"/>
                <circle cx="20" cy="20" r="8" fill="currentColor" className="text-orange-100" opacity="0.4"/>
                <polygon points="20,5 35,15 30,30 15,25 10,15" fill="currentColor" className="text-stone-100" opacity="0.2"/>
                <rect x="15" y="15" width="10" height="10" fill="currentColor" className="text-amber-100" opacity="0.3"/>
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#upload-pattern)"/>
          </svg>
          <div className="absolute top-16 left-16 w-24 h-24 bg-gradient-to-br from-amber-100 to-orange-100 rounded-full opacity-20 animate-pulse"></div>
          <div className="absolute top-32 right-20 w-18 h-18 bg-gradient-to-br from-orange-100 to-stone-100 transform rotate-12 opacity-25 animate-bounce" style={{animationDelay: '1.5s'}}></div>
          <div className="absolute bottom-24 left-20 w-20 h-20 bg-gradient-to-br from-stone-100 to-amber-100 rounded-full opacity-15 animate-pulse" style={{animationDelay: '2s'}}></div>
        </div>
        
        <div className="relative z-10 max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Upload & Transform in 3 Simple Steps
            </h2>
            <p className="text-xl text-gray-600">
              Get professional real estate photos in seconds
            </p>
          </div>

          {/* Authentication Guard */}
          {!user && !authLoading && (
            <div className="text-center mb-8">
              <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-2xl p-8 border border-amber-200">
                <div className="w-16 h-16 bg-gradient-to-br from-amber-100 to-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Upload className="w-8 h-8 text-amber-600" />
                </div>
                <h3 className="text-xl font-semibold text-stone-800 mb-2">
                  Sign in to start transforming your photos
                </h3>
                <p className="text-stone-600 mb-6">
                  Get 5 free edits and access to all our AI-powered features
                </p>
                <button
                  onClick={() => setIsSignInModalOpen(true)}
                  className="bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 text-white font-semibold py-3 px-8 rounded-xl transition-all duration-200 transform hover:scale-105 shadow-lg hover:shadow-xl cursor-pointer"
                >
                  Sign in with Google
                </button>
              </div>
            </div>
          )}

          {user && (
            <div className="space-y-12">
              {/* Step 1: Upload */}
              <div className="text-center">
                <div className="inline-flex items-center justify-center w-12 h-12 bg-gradient-to-br from-amber-100 to-orange-100 text-amber-600 rounded-full text-xl font-bold mb-4 shadow-md">
                  1
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-6">
                  Upload Your Property Photos
                </h3>
                <UploadBox
                  onFileSelect={handleFileSelect}
                  selectedFiles={selectedFiles}
                  onRemoveFile={handleRemoveFile}
                  onRemoveAllFiles={handleRemoveAllFiles}
                />
              
              {/* Mobile Upload Option */}
              <div className="mt-6">
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-stone-300" />
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="px-2 bg-gradient-to-br from-amber-50 via-stone-50 to-orange-50 text-stone-500">
                      Or
                    </span>
                  </div>
                </div>
                
                <button
                  onClick={() => setIsMobileUploadOpen(true)}
                  className="mt-4 w-full bg-gradient-to-r from-stone-100 to-amber-100 hover:from-stone-200 hover:to-amber-200 text-stone-700 py-3 px-6 rounded-lg font-medium transition-all duration-200 flex items-center justify-center gap-2 border border-stone-300 cursor-pointer"
                >
                  <Smartphone className="w-5 h-5" />
                  Upload from Phone
                </button>
              </div>
            </div>

            {/* Step 2: Choose Style */}
            {selectedFiles.length > 0 && (
              <div className="text-center">
                <div className="inline-flex items-center justify-center w-12 h-12 bg-gradient-to-br from-orange-100 to-red-100 text-orange-600 rounded-full text-xl font-bold mb-4 shadow-md">
                  2
                </div>
                <StyleToggles
                  selectedStyle={selectedStyle}
                  onStyleSelect={handleStyleSelect}
                />
                
                {/* Custom Description Input */}
                <div className="mt-8 max-w-2xl mx-auto">
                  <label htmlFor="custom-description" className="block text-sm font-medium text-stone-700 mb-2">
                    Add Custom Instructions (Optional)
                  </label>
                  <textarea
                    id="custom-description"
                    value={customDescription}
                    onChange={(e) => setCustomDescription(e.target.value)}
                    placeholder="e.g., 'Make the lighting warmer', 'Add more plants', 'Focus on the kitchen island'"
                    className="w-full px-4 py-3 border border-stone-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 resize-none transition-colors bg-white text-stone-900 placeholder:text-stone-500 placeholder:opacity-100"
                    rows={3}
                    maxLength={500}
                  />
                  <div className="flex justify-between items-center mt-2">
                    <p className="text-xs text-stone-500">
                      💡 Be specific about what you want to enhance or change
                    </p>
                    <span className="text-xs text-stone-400">
                      {customDescription.length}/500
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Step 3: Process */}
            {selectedFiles.length > 0 && selectedStyle && (
              <div className="text-center">
                <div className="inline-flex items-center justify-center w-12 h-12 bg-gradient-to-br from-red-100 to-pink-100 text-red-600 rounded-full text-xl font-bold mb-4 shadow-md">
                  3
                </div>
                <div className="space-y-4">
                  <button
                    onClick={handleProcessImages}
                    disabled={isProcessing}
                    className="bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 disabled:from-gray-400 disabled:to-gray-500 text-white font-semibold py-4 px-8 rounded-xl text-lg transition-all duration-200 transform hover:scale-105 shadow-lg hover:shadow-xl disabled:transform-none disabled:cursor-not-allowed cursor-pointer"
                  >
                    {isProcessing ? 'Processing...' : `Transform ${selectedFiles.length} Photo${selectedFiles.length === 1 ? '' : 's'}`}
                  </button>
                  
                  {batchProgress && (
                    <div className="bg-gradient-to-br from-white to-stone-50 rounded-lg p-4 shadow-lg max-w-md mx-auto border border-stone-200">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-stone-700">Processing Images</span>
                        <span className="text-sm text-amber-600">{batchProgress.current} of {batchProgress.total}</span>
                      </div>
                      <div className="w-full bg-stone-200 rounded-full h-2">
                        <div 
                          className="bg-gradient-to-r from-amber-500 to-orange-500 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${(batchProgress.current / batchProgress.total) * 100}%` }}
                        ></div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Preview Section */}
            {(processedImages.length > 0 || isProcessing || error) && (
              <div className="text-center">
                <div className="flex items-center justify-between mb-8">
                  <h3 className="text-2xl font-bold text-gray-900">
                    {processedImages.length > 1 ? 'Your Enhanced Photos' : 'Your Enhanced Photo'}
                  </h3>
                  {processedImages.length > 1 && (
                    <button
                      onClick={handleDownloadAll}
                      className="flex items-center gap-2 px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg transition-colors shadow-md cursor-pointer"
                    >
                      <Download className="w-4 h-4" />
                      Download All
                    </button>
                  )}
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {processedImages.map((image, index) => (
                    <div key={index} className="bg-gradient-to-br from-white to-stone-50 rounded-2xl shadow-xl border border-stone-200 overflow-hidden">
                      <div className="p-4 border-b border-stone-200 bg-gradient-to-r from-amber-50 to-orange-50">
                        <h4 className="font-semibold text-stone-800 truncate">{image.fileName}</h4>
                        <p className="text-sm text-amber-700 capitalize font-medium">{image.style} Style</p>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4 p-6">
                        <div className="relative group">
                          <div className="aspect-[4/3] bg-stone-100 rounded-lg overflow-hidden shadow-md">
                            <img
                              src={image.originalUrl}
                              alt="Original"
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <div className="absolute top-3 left-3 bg-stone-800 bg-opacity-90 text-white px-3 py-1 rounded-full text-sm font-medium shadow-lg">
                            Before
                          </div>
                        </div>
                        
                        <div className="relative group">
                          <div className="aspect-[4/3] bg-stone-100 rounded-lg overflow-hidden shadow-md">
                            <img
                              src={image.processedUrl}
                              alt="Enhanced"
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <div className="absolute top-3 left-3 bg-amber-600 bg-opacity-90 text-white px-3 py-1 rounded-full text-sm font-medium shadow-lg">
                            After
                          </div>
                          
                          {/* Action buttons */}
                          <div className="absolute top-3 right-3 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                              onClick={() => handlePreview(image.processedUrl, `Enhanced ${image.fileName}`)}
                              className="bg-white bg-opacity-95 hover:bg-opacity-100 text-stone-700 p-2 rounded-full shadow-lg transition-all border border-stone-200 cursor-pointer"
                              title="Preview"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDownload(image.processedUrl, `enhanced-${image.fileName}`)}
                              className="bg-amber-500 hover:bg-amber-600 text-white p-2 rounded-full shadow-lg transition-all cursor-pointer"
                              title="Download"
                            >
                              <Download className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => {
                                setChatTargetImage(image)
                                setIsChatOpen(true)
                              }}
                              className="bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700 text-white p-2 rounded-full shadow-lg transition-all cursor-pointer"
                              title="Ask for Refinements"
                            >
                              <MessageCircle className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                
                {error && (
                  <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                    <p className="text-red-700">{error}</p>
                  </div>
                )}

                {/* Usage Counter */}
                {usage && (
                  <div className="mt-8 text-center">
                    <div className={`inline-flex items-center gap-2 px-6 py-3 rounded-full shadow-md ${
                      usage.remaining > 10 
                        ? 'bg-gradient-to-r from-amber-100 to-orange-100 text-amber-800 border border-amber-200' 
                        : usage.remaining > 5 
                          ? 'bg-gradient-to-r from-orange-100 to-red-100 text-orange-800 border border-orange-200' 
                          : 'bg-gradient-to-r from-red-100 to-pink-100 text-red-800 border border-red-200'
                    }`}>
                      <Zap className="w-4 h-4" />
                      <span className="text-sm font-medium">
                        {usage.plan === 'free' ? (
                          <>You have <span className="font-semibold">{usage.remaining}</span> of {usage.quota} free edits left</>
                        ) : (
                          <>{usage.plan.toUpperCase()} Plan: <span className="font-semibold">{usage.remaining}</span> of {usage.quota} edits left</>
                        )}
                      </span>
                    </div>
                    <p className="text-xs text-stone-600 mt-2">
                      💬 Click the chat button on any enhanced image to ask for refinements
                    </p>
                  </div>
                )}

                <ChatFeedback
                  isOpen={isChatOpen}
                  onClose={() => {
                    setIsChatOpen(false)
                    setChatTargetImage(null)
                  }}
                  originalImage={chatTargetImage?.originalUrl || null}
                  processedImage={chatTargetImage?.processedUrl || null}
                  style={chatTargetImage?.style || selectedStyle}
                  fileName={chatTargetImage?.fileName}
                  onImageUpdate={handleImageUpdate}
                  onCreditUpdate={handleCreditUpdate}
                />

                {/* Preview Modal with Gallery Navigation */}
                {previewImage && (
                  <div className="fixed inset-0 backdrop-blur-lg z-50">
                    <div className="absolute inset-0 flex items-center justify-center p-4">
                      {/* Close button - floating */}
                      <div className="absolute top-4 right-4 z-20">
                        <button
                          onClick={() => setPreviewImage(null)}
                          className="p-3 bg-white bg-opacity-90 hover:bg-opacity-100 text-stone-700 rounded-full transition-colors shadow-lg border border-stone-200 cursor-pointer"
                        >
                          <X className="w-6 h-6" />
                        </button>
                      </div>
                      
                      {/* Navigation Arrows */}
                      {processedImages.length > 1 && (
                        <>
                          {currentImageIndex > 0 && (
                            <button
                              onClick={() => {
                                const prevImage = processedImages[currentImageIndex - 1]
                                setPreviewImage(prevImage.processedUrl)
                                setPreviewTitle(`Enhanced ${prevImage.fileName}`)
                                setCurrentImageIndex(currentImageIndex - 1)
                              }}
                              className="absolute left-4 top-1/2 transform -translate-y-1/2 z-20 bg-white bg-opacity-90 hover:bg-opacity-100 text-stone-700 p-3 rounded-full transition-colors shadow-lg border border-stone-200 cursor-pointer"
                            >
                              <ChevronLeft className="w-6 h-6" />
                            </button>
                          )}
                          {currentImageIndex < processedImages.length - 1 && (
                            <button
                              onClick={() => {
                                const nextImage = processedImages[currentImageIndex + 1]
                                setPreviewImage(nextImage.processedUrl)
                                setPreviewTitle(`Enhanced ${nextImage.fileName}`)
                                setCurrentImageIndex(currentImageIndex + 1)
                              }}
                              className="absolute right-4 top-1/2 transform -translate-y-1/2 z-20 bg-white bg-opacity-90 hover:bg-opacity-100 text-stone-700 p-3 rounded-full transition-colors shadow-lg border border-stone-200 cursor-pointer"
                            >
                              <ChevronRight className="w-6 h-6" />
                            </button>
                          )}
                        </>
                      )}
                      
                      {/* Centered Image */}
                      <img
                        src={previewImage}
                        alt={previewTitle}
                        className="max-w-full max-h-full object-contain"
                        style={{ 
                          maxWidth: 'calc(100vw - 2rem)', 
                          maxHeight: 'calc(100vh - 2rem)' 
                        }}
                      />
                      
                      {/* Download button - floating */}
                      <div className="absolute bottom-4 right-4 z-20">
                        <button
                          onClick={() => handleDownload(previewImage, `enhanced-${processedImages[currentImageIndex]?.fileName || 'image'}.jpg`)}
                          className="flex items-center gap-2 px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg transition-colors shadow-lg cursor-pointer"
                        >
                          <Download className="w-4 h-4" />
                          Download
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
            </div>
          )}
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="relative py-16 px-4 bg-gradient-to-br from-stone-50 to-amber-50 overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-25">
          <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="xMidYMid slice">
            <defs>
              <pattern id="features-pattern" x="0" y="0" width="35" height="35" patternUnits="userSpaceOnUse">
                <polygon points="17.5,2 32.5,10 32.5,25 17.5,33 2.5,25 2.5,10" fill="currentColor" className="text-amber-200" opacity="0.4"/>
                <circle cx="17.5" cy="17.5" r="6" fill="currentColor" className="text-orange-200" opacity="0.5"/>
                <rect x="12" y="12" width="11" height="11" fill="currentColor" className="text-stone-200" opacity="0.3"/>
                <polygon points="17.5,8 25,12 22,20 15,18 12,12" fill="currentColor" className="text-amber-300" opacity="0.2"/>
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#features-pattern)"/>
          </svg>
          <div className="absolute top-20 left-12 w-28 h-28 bg-gradient-to-br from-amber-200 to-orange-200 rounded-full opacity-30 animate-pulse"></div>
          <div className="absolute top-40 right-16 w-20 h-20 bg-gradient-to-br from-orange-200 to-stone-200 transform rotate-45 opacity-25 animate-bounce" style={{animationDelay: '1s'}}></div>
          <div className="absolute bottom-20 left-20 w-24 h-24 bg-gradient-to-br from-stone-200 to-amber-200 rounded-full opacity-20 animate-pulse" style={{animationDelay: '2s'}}></div>
          <div className="absolute bottom-32 right-12 w-16 h-16 bg-gradient-to-br from-amber-200 to-orange-300 transform rotate-12 opacity-35 animate-bounce" style={{animationDelay: '0.5s'}}></div>
        </div>
        
        <div className="relative z-10 max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-stone-800 mb-4">
              Why Choose ListLens?
            </h2>
            <p className="text-xl text-stone-600">
              Professional results in seconds, not hours
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center p-6 bg-gradient-to-br from-white to-stone-50 rounded-2xl shadow-lg border border-stone-200">
              <div className="w-16 h-16 bg-gradient-to-br from-amber-100 to-orange-100 rounded-full flex items-center justify-center mx-auto mb-4 shadow-md">
                <Zap className="w-8 h-8 text-amber-600" />
              </div>
              <h3 className="text-xl font-semibold text-stone-800 mb-2">
                Lightning Fast
              </h3>
              <p className="text-stone-600">
                Get professional results in under 30 seconds with our advanced AI processing.
              </p>
            </div>

            <div className="text-center p-6 bg-gradient-to-br from-white to-stone-50 rounded-2xl shadow-lg border border-stone-200">
              <div className="w-16 h-16 bg-gradient-to-br from-orange-100 to-red-100 rounded-full flex items-center justify-center mx-auto mb-4 shadow-md">
                <Star className="w-8 h-8 text-orange-600" />
              </div>
              <h3 className="text-xl font-semibold text-stone-800 mb-2">
                Professional Quality
              </h3>
              <p className="text-stone-600">
                HDR enhancement, sky replacement, and style filters create stunning listing photos.
              </p>
            </div>

            <div className="text-center p-6 bg-gradient-to-br from-white to-stone-50 rounded-2xl shadow-lg border border-stone-200">
              <div className="w-16 h-16 bg-gradient-to-br from-stone-100 to-amber-100 rounded-full flex items-center justify-center mx-auto mb-4 shadow-md">
                <Users className="w-8 h-8 text-stone-600" />
              </div>
              <h3 className="text-xl font-semibold text-stone-800 mb-2">
                Trusted by Agents
              </h3>
              <p className="text-stone-600">
                Join thousands of real estate professionals who trust ListLens for their listings.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="relative py-16 px-4 bg-white overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-20">
          <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="xMidYMid slice">
            <defs>
              <pattern id="how-it-works-pattern" x="0" y="0" width="50" height="50" patternUnits="userSpaceOnUse">
                <rect x="0" y="0" width="50" height="50" fill="currentColor" className="text-amber-50" opacity="0.2"/>
                <circle cx="25" cy="25" r="12" fill="currentColor" className="text-orange-100" opacity="0.3"/>
                <polygon points="25,8 42,18 37,35 20,30 13,18" fill="currentColor" className="text-stone-100" opacity="0.25"/>
                <rect x="18" y="18" width="14" height="14" fill="currentColor" className="text-amber-100" opacity="0.2"/>
                <circle cx="25" cy="25" r="4" fill="currentColor" className="text-orange-200" opacity="0.4"/>
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#how-it-works-pattern)"/>
          </svg>
          <div className="absolute top-24 left-16 w-32 h-32 bg-gradient-to-br from-amber-100 to-orange-100 rounded-full opacity-25 animate-pulse"></div>
          <div className="absolute top-16 right-20 w-24 h-24 bg-gradient-to-br from-orange-100 to-stone-100 transform rotate-45 opacity-20 animate-bounce" style={{animationDelay: '1.5s'}}></div>
          <div className="absolute bottom-24 left-20 w-20 h-20 bg-gradient-to-br from-stone-100 to-amber-100 rounded-full opacity-30 animate-pulse" style={{animationDelay: '2.5s'}}></div>
        </div>
        
        <div className="relative z-10 max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-stone-800 mb-4">
              How It Works
            </h2>
            <p className="text-xl text-stone-600">
              Transform your real estate photos in just 3 simple steps
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-amber-100 to-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-amber-600">1</span>
              </div>
              <h3 className="text-xl font-semibold text-stone-800 mb-2">Upload Photos</h3>
              <p className="text-stone-600">
                Drag and drop your property photos or click to browse. Support for multiple images at once.
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-amber-100 to-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-amber-600">2</span>
              </div>
              <h3 className="text-xl font-semibold text-stone-800 mb-2">Choose Style</h3>
              <p className="text-stone-600">
                Select from Airbnb Cozy, Luxury Listing, or Architectural Digest styles. Add custom instructions if needed.
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-amber-100 to-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-amber-600">3</span>
              </div>
              <h3 className="text-xl font-semibold text-stone-800 mb-2">Get Results</h3>
              <p className="text-stone-600">
                Download your enhanced photos instantly. Use chat refinements to perfect your images.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <Pricing onUpgrade={handleUpgrade} />

      {/* CTA Section */}
      <section className="relative py-16 px-4 bg-gradient-to-r from-amber-600 to-orange-600 overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-30">
          <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="xMidYMid slice">
            <defs>
              <pattern id="cta-pattern" x="0" y="0" width="60" height="60" patternUnits="userSpaceOnUse">
                <circle cx="30" cy="30" r="15" fill="currentColor" className="text-white" opacity="0.1"/>
                <polygon points="30,10 50,20 45,40 25,35 15,20" fill="currentColor" className="text-white" opacity="0.08"/>
                <rect x="20" y="20" width="20" height="20" fill="currentColor" className="text-white" opacity="0.06"/>
                <circle cx="30" cy="30" r="6" fill="currentColor" className="text-white" opacity="0.12"/>
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#cta-pattern)"/>
          </svg>
          <div className="absolute top-20 left-20 w-40 h-40 bg-white rounded-full opacity-10 animate-pulse"></div>
          <div className="absolute top-32 right-24 w-32 h-32 bg-white transform rotate-45 opacity-8 animate-bounce" style={{animationDelay: '2s'}}></div>
          <div className="absolute bottom-20 left-24 w-36 h-36 bg-white rounded-full opacity-12 animate-pulse" style={{animationDelay: '1s'}}></div>
        </div>
        
        <div className="relative z-10 max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-white mb-4">
            Ready to Transform Your Listings?
          </h2>
          <p className="text-xl text-amber-100 mb-8">
            Start with 5 free edits, no credit card required
          </p>
          <button
            onClick={handleUploadClick}
            className="bg-white hover:bg-stone-50 text-amber-600 font-semibold py-4 px-8 rounded-xl text-lg transition-all duration-200 transform hover:scale-105 shadow-lg hover:shadow-xl cursor-pointer"
          >
            Get Started Free
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-4 bg-stone-800 text-stone-100">
        <div className="max-w-6xl mx-auto text-center">
          <div className="flex justify-center items-center gap-3 mb-4">
            <div className="w-8 h-8 relative">
          <Image
                src="/ListLens Logo.png"
                alt="ListLens Logo"
                fill
                className="object-contain"
              />
            </div>
            <h3 className="text-2xl font-bold">ListLens</h3>
          </div>
          <p className="text-stone-400 mb-4">
            AI-powered real estate photo enhancement
          </p>
          <div className="text-sm text-stone-500 mb-2">
            Need help? Contact us at <a href="mailto:listlens2025@gmail.com" className="text-blue-400 hover:text-blue-300 underline">listlens2025@gmail.com</a>
          </div>
          <div className="text-sm text-stone-500">
            © 2024 ListLens. All rights reserved.
          </div>
        </div>
      </footer>

      {/* Mobile Upload Modal */}
      <MobileUploadModal
        isOpen={isMobileUploadOpen}
        onClose={() => setIsMobileUploadOpen(false)}
      />

      {/* Sign In Modal */}
      <SignInModal
        isOpen={isSignInModalOpen}
        onClose={() => setIsSignInModalOpen(false)}
      />
    </div>
  )
}