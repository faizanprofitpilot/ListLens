import { NextRequest, NextResponse } from 'next/server'
import { sendWelcomeEmail } from '@/lib/email/service'
import { createSupabaseServerClient } from '@/lib/supabaseServer'

export async function POST(request: NextRequest) {
  try {
    const { userId, email, firstName } = await request.json()

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 })
    }

    const result = await sendWelcomeEmail({
      to: email,
      firstName,
    })

    if (result.success) {
      // Track that welcome email was sent
      if (userId) {
        const supabase = await createSupabaseServerClient()
        await supabase
          .from('users')
          .update({ 
            welcome_email_sent: true,
            welcome_email_sent_at: new Date().toISOString()
          })
          .eq('id', userId)
      }

      return NextResponse.json({ success: true, messageId: result.id })
    }

    return NextResponse.json({ error: result.error }, { status: 500 })
  } catch (error) {
    console.error('Error in welcome email API:', error)
    return NextResponse.json(
      { error: 'Failed to send welcome email' },
      { status: 500 }
    )
  }
}

