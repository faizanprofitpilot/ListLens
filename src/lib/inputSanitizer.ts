// Input sanitization utilities for security

export function sanitizeTextInput(input: string): string {
  if (!input) return ''
  
  return input
    .trim()
    .slice(0, 500) // Limit length
    .replace(/[<>]/g, '') // Remove potential HTML tags
    .replace(/javascript:/gi, '') // Remove javascript: protocol
    .replace(/on\w+=/gi, '') // Remove event handlers
}

export function sanitizePromptInput(input: string): string {
  if (!input) return ''
  
  return input
    .trim()
    .slice(0, 1000) // Limit prompt length
    .replace(/[<>]/g, '') // Remove potential HTML tags
    .replace(/javascript:/gi, '') // Remove javascript: protocol
    .replace(/on\w+=/gi, '') // Remove event handlers
    .replace(/ignore\s+previous\s+instructions/gi, '') // Remove prompt injection attempts
    .replace(/system\s*:/gi, '') // Remove system prompt attempts
    .replace(/assistant\s*:/gi, '') // Remove assistant prompt attempts
}

export function validateFileType(file: File): boolean {
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
  return allowedTypes.includes(file.type)
}

export function validateFileSize(file: File, maxSizeMB: number = 10): boolean {
  return file.size <= maxSizeMB * 1024 * 1024
}
