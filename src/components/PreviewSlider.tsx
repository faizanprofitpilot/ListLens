'use client'

import { Download, MessageCircle, Eye, X } from 'lucide-react'
import { useState } from 'react'

interface PreviewSliderProps {
  originalImage: string | null
  processedImage: string | null
  style: string | null
  isProcessing: boolean
  freeEditsRemaining: number
  error: string | null
  upgradeRequired: boolean
  onChatOpen: () => void
}

export default function PreviewSlider({ 
  originalImage, 
  processedImage, 
  style, 
  isProcessing,
  freeEditsRemaining,
  error,
  upgradeRequired,
  onChatOpen
}: PreviewSliderProps) {
  const [previewImage, setPreviewImage] = useState<string | null>(null)
  const [previewTitle, setPreviewTitle] = useState('')

  const handlePreview = (imageUrl: string, title: string) => {
    setPreviewImage(imageUrl)
    setPreviewTitle(title)
  }

  const handleDownload = async (imageUrl: string, filename: string) => {
    try {
      const response = await fetch(imageUrl)
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = filename
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)
    } catch (error) {
      console.error('Download failed:', error)
    }
  }

  if (!originalImage && !processedImage && !error) {
    return null
  }

  return (
    <div className="w-full max-w-4xl mx-auto">
      <div className="text-center mb-8">
        <h3 className="text-2xl font-bold text-gray-900 mb-2">
          {isProcessing ? 'Processing Your Image...' : error ? 'Processing Error' : 'Before & After'}
        </h3>
        {style && !isProcessing && !error && (
          <p className="text-gray-600">
            Style: <span className="font-semibold capitalize">{style.replace('_', ' ')}</span>
          </p>
        )}
      </div>

      <div className="relative bg-white rounded-2xl shadow-xl overflow-hidden">
        {isProcessing ? (
          <div className="aspect-video bg-gray-100 flex items-center justify-center">
            <div className="text-center">
              <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-gray-600 font-medium">AI is working its magic...</p>
              <p className="text-sm text-gray-500 mt-2">This usually takes 10-30 seconds</p>
            </div>
          </div>
        ) : error ? (
          <div className="aspect-video bg-red-50 flex items-center justify-center">
            <div className="text-center p-8">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <h4 className="text-lg font-semibold text-red-900 mb-2">Processing Failed</h4>
              <p className="text-red-700 mb-4">{error}</p>
              {upgradeRequired && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <p className="text-yellow-800 font-medium">Free edit limit reached!</p>
                  <p className="text-yellow-700 text-sm mt-1">Upgrade to Pro for unlimited edits</p>
                </div>
              )}
              {!upgradeRequired && processedImage && (
                <p className="text-gray-600 text-sm mt-2">💬 Click &quot;Ask for Refinements&quot; to chat with AI for more edits</p>
              )}
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Original Image */}
            <div className="relative group">
              <div className="aspect-[4/3] bg-gray-100 rounded-lg overflow-hidden">
                <img
                  src={originalImage || '/placeholder-before.jpg'}
                  alt="Original"
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="absolute top-3 left-3 bg-black bg-opacity-70 text-white px-3 py-1 rounded-full text-sm font-medium">
                Before
              </div>
              <div className="absolute top-3 right-3 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={() => handlePreview(originalImage || '/placeholder-before.jpg', 'Original Image')}
                  className="bg-white bg-opacity-90 hover:bg-opacity-100 text-gray-800 p-2 rounded-full shadow-lg transition-all"
                  title="Preview"
                >
                  <Eye className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleDownload(originalImage || '/placeholder-before.jpg', 'original-image.jpg')}
                  className="bg-white bg-opacity-90 hover:bg-opacity-100 text-gray-800 p-2 rounded-full shadow-lg transition-all"
                  title="Download"
                >
                  <Download className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Processed Image */}
            <div className="relative group">
              <div className="aspect-[4/3] bg-gray-100 rounded-lg overflow-hidden">
                <img
                  src={processedImage || '/placeholder-after.jpg'}
                  alt="Processed"
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="absolute top-3 left-3 bg-black bg-opacity-70 text-white px-3 py-1 rounded-full text-sm font-medium">
                After
              </div>
              <div className="absolute top-3 right-3 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={() => handlePreview(processedImage || '/placeholder-after.jpg', 'Enhanced Image')}
                  className="bg-white bg-opacity-90 hover:bg-opacity-100 text-gray-800 p-2 rounded-full shadow-lg transition-all"
                  title="Preview"
                >
                  <Eye className="w-4 h-4" />
                </button>
                <button
                  onClick={onChatOpen}
                  className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white p-2 rounded-full shadow-lg transition-all"
                  title="Ask for Refinements"
                >
                  <MessageCircle className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleDownload(processedImage || '/placeholder-after.jpg', 'enhanced-image.jpg')}
                  className="bg-white bg-opacity-90 hover:bg-opacity-100 text-gray-800 p-2 rounded-full shadow-lg transition-all"
                  title="Download"
                >
                  <Download className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        )}


      </div>

      {/* Usage Counter */}
      <div className="mt-6 text-center">
        <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full ${
          freeEditsRemaining === 0 
            ? 'bg-yellow-100 border border-yellow-200' 
            : freeEditsRemaining <= 2 
            ? 'bg-orange-100 border border-orange-200'
            : 'bg-gray-100'
        }`}>
          <div className={`w-2 h-2 rounded-full ${
            freeEditsRemaining === 0 
              ? 'bg-yellow-500' 
              : freeEditsRemaining <= 2 
              ? 'bg-orange-500'
              : 'bg-blue-500'
          }`}></div>
          <span className={`text-sm ${
            freeEditsRemaining === 0 
              ? 'text-yellow-800' 
              : freeEditsRemaining <= 2 
              ? 'text-orange-800'
              : 'text-gray-700'
          }`}>
            {freeEditsRemaining === 0 ? (
              <span className="font-semibold">No free edits remaining</span>
            ) : (
              <>
                You have <span className="font-semibold">{freeEditsRemaining} of 20</span> free edits left
              </>
            )}
          </span>
        </div>
        
        {upgradeRequired && (
          <div className="mt-4">
            <button className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold py-3 px-6 rounded-xl transition-all duration-200 transform hover:scale-105 shadow-lg">
              Upgrade to Pro - $29/mo
            </button>
          </div>
        )}
      </div>

      {/* Preview Modal */}
      {previewImage && (
        <div className="fixed inset-0 backdrop-blur-lg flex items-center justify-center z-50">
          <div className="relative w-full h-full flex flex-col">
            {/* Header - Close button only */}
            <div className="absolute top-0 right-0 z-10 p-4">
              <button
                onClick={() => setPreviewImage(null)}
                className="p-2 bg-black bg-opacity-50 hover:bg-opacity-70 rounded-full transition-colors"
              >
                <X className="w-6 h-6 text-white" />
              </button>
            </div>
            
            {/* Full-size Image */}
            <div className="absolute inset-0 flex items-center justify-center p-8">
              <img
                src={previewImage}
                alt={previewTitle}
                className="w-auto h-auto max-w-none max-h-none object-contain"
                style={{ maxWidth: '100vw', maxHeight: '100vh' }}
              />
            </div>
            
            {/* Download button - floating */}
            <div className="absolute bottom-6 right-6 z-10">
              <button
                onClick={() => handleDownload(previewImage, previewTitle.toLowerCase().replace(' ', '-') + '.jpg')}
                className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-lg font-medium shadow-lg"
              >
                <Download className="w-5 h-5" />
                Download Full Size
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
