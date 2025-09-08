'use client'

import { useState, useEffect } from 'react'
import { X, Copy, Check } from 'lucide-react'
import QRCode from 'qrcode'
import Image from 'next/image'

interface MobileUploadModalProps {
  isOpen: boolean
  onClose: () => void
}

export default function MobileUploadModal({ isOpen, onClose }: MobileUploadModalProps) {
  const [sessionId, setSessionId] = useState<string>('')
  const [qrCodeUrl, setQrCodeUrl] = useState<string>('')
  const [mobileUrl, setMobileUrl] = useState<string>('')
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    if (isOpen) {
      // Generate unique session ID
      const newSessionId = `mobile-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
      setSessionId(newSessionId)
      
      // Create mobile URL
      const baseUrl = typeof window !== 'undefined' ? window.location.origin : ''
      const newMobileUrl = `${baseUrl}/mobile-upload/${newSessionId}`
      setMobileUrl(newMobileUrl)
      
      // Generate QR code
      QRCode.toDataURL(newMobileUrl, {
        width: 256,
        margin: 2,
        color: {
          dark: '#92400e', // amber-800
          light: '#ffffff'
        }
      }).then(setQrCodeUrl)
    }
  }, [isOpen])

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(mobileUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Failed to copy:', err)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 backdrop-blur-lg z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 relative">
              <Image
                src="/ListLens Logo.png"
                alt="ListLens Logo"
                fill
                className="object-contain"
              />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-stone-800">Upload from Phone</h3>
              <p className="text-sm text-stone-600">Scan QR code with your phone</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-stone-100 rounded-full transition-colors cursor-pointer"
          >
            <X className="w-5 h-5 text-stone-600" />
          </button>
        </div>

        {/* QR Code */}
        <div className="text-center mb-6">
          <div className="bg-white p-4 rounded-xl border-2 border-stone-200 inline-block mb-4">
            {qrCodeUrl && (
              <img src={qrCodeUrl} alt="QR Code" className="w-48 h-48" />
            )}
          </div>
          <p className="text-sm text-stone-600 mb-2">
            Scan this QR code with your phone&apos;s camera
          </p>
        </div>

        {/* Alternative: Copy Link */}
        <div className="bg-stone-50 rounded-lg p-4 mb-6">
          <p className="text-sm text-stone-700 mb-2">Or copy this link to your phone:</p>
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={mobileUrl}
              readOnly
              className="flex-1 px-3 py-2 text-sm border border-stone-300 rounded-lg bg-white text-stone-700"
            />
            <button
              onClick={copyToClipboard}
              className="px-3 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors flex items-center gap-1 cursor-pointer"
            >
              {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Instructions */}
        <div className="space-y-3 text-sm text-stone-600">
          <div className="flex items-start gap-3">
            <div className="w-6 h-6 bg-amber-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
              <span className="text-xs font-semibold text-amber-600">1</span>
            </div>
            <p>Open your phone&apos;s camera and scan the QR code</p>
          </div>
          <div className="flex items-start gap-3">
            <div className="w-6 h-6 bg-amber-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
              <span className="text-xs font-semibold text-amber-600">2</span>
            </div>
            <p>Take photos or select from your gallery</p>
          </div>
          <div className="flex items-start gap-3">
            <div className="w-6 h-6 bg-amber-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
              <span className="text-xs font-semibold text-amber-600">3</span>
            </div>
            <p>Photos will appear here automatically</p>
          </div>
        </div>

        {/* Session ID for debugging */}
        <div className="mt-4 pt-4 border-t border-stone-200">
          <p className="text-xs text-stone-400">Session: {sessionId}</p>
        </div>
      </div>
    </div>
  )
}
