'use client'

import { useState, useRef } from 'react'
import { Upload, X } from 'lucide-react'

interface UploadBoxProps {
  onFileSelect: (files: File[]) => void
  selectedFiles: File[]
  onRemoveFile: (index: number) => void
  onRemoveAllFiles: () => void
}

export default function UploadBox({ onFileSelect, selectedFiles, onRemoveFile, onRemoveAllFiles }: UploadBoxProps) {
  const [isDragOver, setIsDragOver] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
    
    const files = Array.from(e.dataTransfer.files).filter(file => file.type.startsWith('image/'))
    if (files.length > 0) {
      onFileSelect(files)
    }
  }

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (files && files.length > 0) {
      const imageFiles = Array.from(files).filter(file => file.type.startsWith('image/'))
      onFileSelect(imageFiles)
    }
  }

  const handleClick = () => {
    fileInputRef.current?.click()
  }

  return (
    <div className="w-full max-w-2xl mx-auto">
      {selectedFiles.length === 0 ? (
        <div
          className={`relative border-2 border-dashed rounded-2xl p-12 text-center cursor-pointer transition-all duration-200 ${
            isDragOver
              ? 'border-amber-500 bg-amber-50'
              : 'border-stone-300 hover:border-amber-400 hover:bg-stone-50'
          }`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={handleClick}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            onChange={handleFileInput}
            className="hidden"
          />
          
          <div className="flex flex-col items-center gap-4">
            <div className="w-16 h-16 bg-gradient-to-br from-amber-100 to-orange-100 rounded-full flex items-center justify-center shadow-md">
              <Upload className="w-8 h-8 text-amber-600" />
            </div>
            
            <div>
              <h3 className="text-xl font-semibold text-stone-800 mb-2">
                Drop your property photos here
              </h3>
              <p className="text-stone-600 mb-4">
                or click to browse your files
              </p>
              <p className="text-sm text-amber-600">
                Supports JPG, PNG, WebP up to 10MB each • Select multiple images for batch processing
              </p>
            </div>
          </div>
        </div>
      ) : (
        <div className="relative border-2 border-stone-200 rounded-2xl p-6 bg-gradient-to-br from-white to-stone-50 shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-stone-800">
              {selectedFiles.length} {selectedFiles.length === 1 ? 'Photo' : 'Photos'} Selected
            </h3>
            <button
              onClick={onRemoveAllFiles}
              className="text-sm text-amber-600 hover:text-amber-700 font-medium cursor-pointer"
            >
              Remove All
            </button>
          </div>
          
          <div className="space-y-3 max-h-60 overflow-y-auto">
            {selectedFiles.map((file, index) => (
              <div key={index} className="flex items-center gap-4 p-3 bg-gradient-to-r from-amber-50 to-orange-50 rounded-lg border border-amber-100">
                <div className="w-16 h-16 bg-stone-200 rounded-lg flex items-center justify-center flex-shrink-0 overflow-hidden shadow-sm">
                  <img
                    src={URL.createObjectURL(file)}
                    alt={file.name}
                    className="w-full h-full object-cover"
                  />
                </div>
                
                <div className="flex-1 min-w-0">
                  <h4 className="font-medium text-stone-800 truncate">{file.name}</h4>
                  <p className="text-sm text-amber-600">
                    {(file.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                </div>
                
                <button
                  onClick={() => onRemoveFile(index)}
                  className="p-1 hover:bg-amber-100 rounded-lg transition-colors flex-shrink-0 cursor-pointer"
                >
                  <X className="w-4 h-4 text-amber-600" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
