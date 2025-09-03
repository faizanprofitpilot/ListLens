import { NextRequest, NextResponse } from 'next/server'

// In-memory storage for mobile upload sessions
// In production, you'd want to use Redis or a database
const mobileSessions = new Map<string, {
  files: {
    name: string
    type: string
    size: number
    data: string // base64 encoded file data
  }[]
  timestamp: number
  status: 'waiting' | 'uploaded' | 'processed'
}>()

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const sessionId = formData.get('sessionId') as string
    const files = formData.getAll('files') as File[]

    if (!sessionId || files.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Session ID and files are required' },
        { status: 400 }
      )
    }

    // Convert files to base64 and store in session
    const fileData = await Promise.all(
      files.map(async (file) => {
        const buffer = await file.arrayBuffer()
        const base64 = Buffer.from(buffer).toString('base64')
        return {
          name: file.name,
          type: file.type,
          size: file.size,
          data: base64
        }
      })
    )

    mobileSessions.set(sessionId, {
      files: fileData,
      timestamp: Date.now(),
      status: 'uploaded'
    })

    // Clean up old sessions (older than 1 hour)
    const oneHourAgo = Date.now() - 60 * 60 * 1000
    for (const [id, session] of mobileSessions.entries()) {
      if (session.timestamp < oneHourAgo) {
        mobileSessions.delete(id)
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Files uploaded successfully',
      fileCount: files.length
    })

  } catch (error) {
    console.error('Mobile upload error:', error)
    return NextResponse.json(
      { success: false, error: 'Upload failed' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const sessionId = searchParams.get('sessionId')

    if (!sessionId) {
      return NextResponse.json(
        { success: false, error: 'Session ID is required' },
        { status: 400 }
      )
    }

    const session = mobileSessions.get(sessionId)
    
    if (!session) {
      return NextResponse.json(
        { success: false, error: 'Session not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      session: {
        fileCount: session.files.length,
        status: session.status,
        timestamp: session.timestamp,
        files: session.files // Include the actual file data
      }
    })

  } catch (error) {
    console.error('Mobile session check error:', error)
    return NextResponse.json(
      { success: false, error: 'Session check failed' },
      { status: 500 }
    )
  }
}
