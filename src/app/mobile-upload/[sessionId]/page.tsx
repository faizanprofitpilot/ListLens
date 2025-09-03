'use client'

import { useState, useRef, useEffect } from 'react'
import { Camera, Image, Upload, ArrowLeft, Check } from 'lucide-react'
import { useParams, useRouter } from 'next/navigation'
import NextImage from 'next/image'

export default function MobileUploadPage() {
  const params = useParams()
  const router = useRouter()
  const sessionId = params.sessionId as string
  const [selectedFiles, setSelectedFiles] = useState<File[]>([])
  const [isUploading, setIsUploading] = useState(false)
  const [uploadComplete, setUploadComplete] = useState(false)
  const [showCameraMessage, setShowCameraMessage] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const cameraInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = (files: FileList | null) => {
    if (!files) return
    
    const newFiles = Array.from(files).filter(file => 
      file.type.startsWith('image/') && file.size <= 10 * 1024 * 1024 // 10MB limit
    )
    
    setSelectedFiles(prev => [...prev, ...newFiles])
  }

  const handleCameraCapture = () => {
    // Check if we're on a mobile device
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
    
    if (isMobile) {
      // On mobile, try to open camera
      cameraInputRef.current?.click()
    } else {
      // On desktop, show a message that camera is not available
      setShowCameraMessage(true)
      setTimeout(() => setShowCameraMessage(false), 3000)
    }
  }

  const handleGallerySelect = () => {
    fileInputRef.current?.click()
  }

  const removeFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index))
  }

  const uploadFiles = async () => {
    if (selectedFiles.length === 0) return

    setIsUploading(true)
    
    try {
      // Send files to the session endpoint
      const formData = new FormData()
      selectedFiles.forEach(file => {
        formData.append('files', file)
      })
      formData.append('sessionId', sessionId)

      // Use absolute URL for dev server compatibility
      const baseUrl = typeof window !== 'undefined' ? window.location.origin : ''
      const response = await fetch(`${baseUrl}/api/mobile-upload`, {
        method: 'POST',
        body: formData
      })

      if (response.ok) {
        setUploadComplete(true)
        
        // Notify the main page that files are ready
        // We'll use a custom event to communicate with the parent window
        if (window.opener) {
          window.opener.postMessage({
            type: 'MOBILE_UPLOAD_COMPLETE',
            sessionId: sessionId,
            fileCount: selectedFiles.length
          }, '*')
        }
        
        // Close the mobile page after a delay
        setTimeout(() => {
          window.close()
        }, 2000)
      } else {
        throw new Error('Upload failed')
      }
    } catch (error) {
      console.error('Upload error:', error)
      alert('Upload failed. Please try again.')
    } finally {
      setIsUploading(false)
    }
  }

  if (uploadComplete) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-50 to-orange-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 text-center max-w-sm w-full">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Check className="w-8 h-8 text-green-600" />
          </div>
          <h2 className="text-xl font-semibold text-stone-800 mb-2">Upload Complete!</h2>
          <p className="text-stone-600 mb-4">
            Your photos have been sent to your desktop. You can close this page now.
          </p>
          <button
            onClick={() => window.close()}
            className="bg-amber-600 text-white px-6 py-2 rounded-lg hover:bg-amber-700 transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 to-orange-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-stone-200 p-4">
        <div className="flex items-center justify-between">
          <button
            onClick={() => router.back()}
            className="p-2 hover:bg-stone-100 rounded-full transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-5 h-5 text-stone-600" />
          </button>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 relative">
              <NextImage
                src="/ListLens Logo.png"
                alt="ListLens Logo"
                fill
                className="object-contain"
              />
            </div>
            <h1 className="text-lg font-semibold text-stone-800">Upload Photos</h1>
          </div>
          <div className="w-9"></div> {/* Spacer */}
        </div>
      </div>

      <div className="p-4">
        {/* Upload Options */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <button
            onClick={handleCameraCapture}
            className="bg-gradient-to-br from-amber-100 to-orange-100 rounded-xl p-6 text-center hover:from-amber-200 hover:to-orange-200 transition-all cursor-pointer"
          >
            <Camera className="w-8 h-8 text-amber-600 mx-auto mb-2" />
            <p className="text-sm font-medium text-stone-800">Take Photo</p>
            <p className="text-xs text-stone-500 mt-1">Mobile only</p>
          </button>
          
          <button
            onClick={handleGallerySelect}
            className="bg-gradient-to-br from-amber-100 to-orange-100 rounded-xl p-6 text-center hover:from-amber-200 hover:to-orange-200 transition-all cursor-pointer"
          >
            <Image className="w-8 h-8 text-amber-600 mx-auto mb-2" />
            <p className="text-sm font-medium text-stone-800">From Gallery</p>
            <p className="text-xs text-stone-500 mt-1">All devices</p>
          </button>
        </div>

        {/* Hidden file inputs */}
        <input
          ref={cameraInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          onChange={(e) => handleFileSelect(e.target.files)}
          className="hidden"
        />
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          onChange={(e) => handleFileSelect(e.target.files)}
          className="hidden"
        />

        {/* Camera Message */}
        {showCameraMessage && (
          <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
            <p className="text-sm text-amber-700">
              📱 Camera access is only available on mobile devices. Please use "From Gallery" to select photos from your computer.
            </p>
          </div>
        )}

        {/* Selected Files */}
        {selectedFiles.length > 0 && (
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-stone-800 mb-3">
              Selected Photos ({selectedFiles.length})
            </h3>
            <div className="grid grid-cols-2 gap-3">
              {selectedFiles.map((file, index) => (
                <div key={index} className="relative">
                  <img
                    src={URL.createObjectURL(file)}
                    alt={`Preview ${index + 1}`}
                    className="w-full h-32 object-cover rounded-lg"
                  />
                  <button
                    onClick={() => removeFile(index)}
                    className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center text-xs hover:bg-red-600 transition-colors cursor-pointer"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Upload Button */}
        {selectedFiles.length > 0 && (
          <button
            onClick={uploadFiles}
            disabled={isUploading}
            className="w-full bg-gradient-to-r from-amber-600 to-orange-600 text-white py-4 rounded-xl font-semibold hover:from-amber-700 hover:to-orange-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 cursor-pointer"
          >
            {isUploading ? (
              <>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                Uploading...
              </>
            ) : (
              <>
                <Upload className="w-5 h-5" />
                Upload {selectedFiles.length} Photo{selectedFiles.length > 1 ? 's' : ''}
              </>
            )}
          </button>
        )}

        {/* Instructions */}
        <div className="mt-8 text-center">
          <p className="text-sm text-stone-600">
            Take or select photos of your property. They will be sent to your desktop for AI enhancement.
          </p>
        </div>
      </div>
    </div>
  )
}
