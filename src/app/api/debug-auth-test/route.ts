import { NextRequest, NextResponse } from 'next/server'
import { authenticateRequest } from '@/lib/authMiddleware'

export async function GET(request: NextRequest) {
  try {
    // Test authentication
    const { user, error } = await authenticateRequest(request)
    
    return NextResponse.json({
      success: true,
      authenticated: !!user,
      user: user ? {
        id: user.id,
        email: user.email,
        // Don't expose sensitive data
      } : null,
      error: error || null,
      headers: {
        cookie: request.headers.get('cookie') ? 'Present' : 'Missing',
        authorization: request.headers.get('authorization') ? 'Present' : 'Missing',
      }
    })
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: error.message,
      stack: error.stack
    }, { status: 500 })
  }
}
