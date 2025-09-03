'use client'

import { useState, useRef, useEffect } from 'react'
import { Send, X, Sparkles, Bot } from 'lucide-react'

interface ChatMessage {
  id: string
  type: 'user' | 'ai'
  content: string
  timestamp: Date
  isProcessing?: boolean
}

interface ChatFeedbackProps {
  isOpen: boolean
  onClose: () => void
  originalImage: string | null
  processedImage: string | null
  style: string | null
  userId: string
  fileName?: string
  onImageUpdate: (newImage: string) => void
  onCreditUpdate: (remaining: number) => void
}

export default function ChatFeedback({
  isOpen,
  onClose,
  originalImage,
  processedImage,
  style,
  userId,
  fileName,
  onImageUpdate,
  onCreditUpdate
}: ChatFeedbackProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [inputMessage, setInputMessage] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  useEffect(() => {
    if (isOpen && messages.length === 0) {
      // Add welcome message when chat opens
      setMessages([{
        id: '1',
        type: 'ai',
        content: "Hi! I'm your AI photo editor. What would you like me to adjust about your image? I can help with lighting, colors, composition, or any other improvements you have in mind!",
        timestamp: new Date()
      }])
    } else if (!isOpen) {
      // Clear chat history when chat is closed
      setMessages([])
    }
  }, [isOpen, messages.length])

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || isLoading) return

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      type: 'user',
      content: inputMessage.trim(),
      timestamp: new Date()
    }

    const aiMessage: ChatMessage = {
      id: (Date.now() + 1).toString(),
      type: 'ai',
      content: '',
      timestamp: new Date(),
      isProcessing: true
    }

    setMessages(prev => [...prev, userMessage, aiMessage])
    setInputMessage('')
    setIsLoading(true)

    try {
      const response = await fetch('/api/chat-refine', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: userMessage.content,
          originalImage,
          processedImage,
          style,
          userId,
          fileName: fileName || 'image.jpg',
          conversationHistory: messages
        })
      })

      const data = await response.json()

      if (data.success) {
        // Update the AI message with response
        setMessages(prev => prev.map(msg => 
          msg.id === aiMessage.id 
            ? { ...msg, content: data.response, isProcessing: false }
            : msg
        ))

        // Update the image if a new one was generated
        if (data.newImage) {
          onImageUpdate(data.newImage)
        }

        // Update credits
        if (data.freeEditsRemaining !== undefined) {
          onCreditUpdate(data.freeEditsRemaining)
        }
      } else {
        // Handle error
        setMessages(prev => prev.map(msg => 
          msg.id === aiMessage.id 
            ? { ...msg, content: data.error || 'Sorry, I encountered an error. Please try again.', isProcessing: false }
            : msg
        ))
      }
    } catch {
      setMessages(prev => prev.map(msg => 
        msg.id === aiMessage.id 
          ? { ...msg, content: 'Sorry, I encountered an error. Please try again.', isProcessing: false }
          : msg
      ))
    } finally {
      setIsLoading(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed bottom-6 right-6 z-50">
      <div className="bg-gradient-to-br from-white to-stone-50 rounded-2xl shadow-2xl w-96 h-[500px] flex flex-col border border-stone-200">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-stone-200 bg-gradient-to-r from-amber-600 to-orange-600 rounded-t-2xl">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
              <Bot className="w-4 h-4 text-white" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-white">AI Editor</h3>
              <p className="text-xs text-amber-100">Ask for refinements</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-white hover:bg-opacity-20 rounded-full transition-colors cursor-pointer"
          >
            <X className="w-4 h-4 text-white" />
          </button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[85%] rounded-2xl px-3 py-2 ${
                  message.type === 'user'
                    ? 'bg-amber-600 text-white'
                    : 'bg-stone-100 text-stone-900'
                }`}
              >
                {message.isProcessing ? (
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 border-2 border-stone-400 border-t-transparent rounded-full animate-spin"></div>
                    <span className="text-xs">AI is thinking...</span>
                  </div>
                ) : (
                  <p className="text-xs whitespace-pre-wrap text-left">{message.content}</p>
                )}
                <div className={`text-xs mt-1 ${
                  message.type === 'user' ? 'text-amber-100' : 'text-stone-500'
                }`}>
                  {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="p-4 border-t border-stone-200">
          <div className="flex gap-2">
            <div className="flex-1 relative">
              <textarea
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Ask for adjustments..."
                className="w-full px-3 py-2 text-sm border border-stone-300 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent bg-white text-stone-900 placeholder:text-stone-500 placeholder:opacity-100"
                rows={2}
                disabled={isLoading}
              />
            </div>
            <button
              onClick={handleSendMessage}
              disabled={!inputMessage.trim() || isLoading}
              className="px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-1 cursor-pointer"
            >
              <Send className="w-3 h-3" />
            </button>
          </div>
          <p className="text-xs text-stone-500 mt-1">
            💡 Each refinement uses 1 credit
          </p>
        </div>
      </div>
    </div>
  )
}
