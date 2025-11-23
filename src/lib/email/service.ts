import { Resend } from 'resend'
import { WelcomeEmail, LowCreditsEmail, StarterUpsellEmail, BehaviorEmail, ReactivationEmail, Day7Email } from './templates'
import React from 'react'
import { render } from '@react-email/render'

if (!process.env.RESEND_API_KEY) {
  console.warn('RESEND_API_KEY is not set. Email functionality will be disabled.')
}

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null

const FROM_EMAIL = process.env.RESEND_FROM_EMAIL || 'ListLens <onboarding@listlens.app>'

export interface SendWelcomeEmailParams {
  to: string
  firstName?: string
}

export interface SendLowCreditsEmailParams {
  to: string
  firstName?: string
}

export interface SendStarterUpsellEmailParams {
  to: string
  firstName?: string
}

export interface SendBehaviorEmailParams {
  to: string
  firstName?: string
}

export interface SendReactivationEmailParams {
  to: string
  firstName?: string
}

export interface SendDay7EmailParams {
  to: string
  firstName?: string
}

export async function sendWelcomeEmail({ to, firstName }: SendWelcomeEmailParams) {
  if (!resend) {
    console.warn('Resend not configured. Skipping welcome email.')
    return { success: false, error: 'Email service not configured' }
  }

  try {
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://listlens.app'
    const emailHtml = await render(React.createElement(WelcomeEmail, { firstName, ctaUrl: appUrl }))
    
    const { data, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to,
      subject: 'Welcome to ListLens — your 5 free edits are ready 🎨',
      html: emailHtml,
    })

    if (error) {
      console.error('Error sending welcome email:', error)
      return { success: false, error }
    }

    console.log('Welcome email sent successfully:', data?.id)
    return { success: true, id: data?.id }
  } catch (error) {
    console.error('Error sending welcome email:', error)
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
  }
}

export async function sendLowCreditsEmail({ to, firstName }: SendLowCreditsEmailParams) {
  if (!resend) {
    console.warn('Resend not configured. Skipping low credits email.')
    return { success: false, error: 'Email service not configured' }
  }

  try {
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://listlens.app'
    const emailHtml = await render(React.createElement(LowCreditsEmail, { firstName, ctaUrl: appUrl }))
    
    const { data, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to,
      subject: 'You still have free edits waiting — don\'t let them expire 👀',
      html: emailHtml,
    })

    if (error) {
      console.error('Error sending low credits email:', error)
      return { success: false, error }
    }

    console.log('Low credits email sent successfully:', data?.id)
    return { success: true, id: data?.id }
  } catch (error) {
    console.error('Error sending low credits email:', error)
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
  }
}

export async function sendStarterUpsellEmail({ to, firstName }: SendStarterUpsellEmailParams) {
  if (!resend) {
    console.warn('Resend not configured. Skipping starter upsell email.')
    return { success: false, error: 'Email service not configured' }
  }

  try {
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://listlens.app'
    const emailHtml = await render(React.createElement(StarterUpsellEmail, { firstName, ctaUrl: appUrl }))
    
    const { data, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to,
      subject: 'Getting the most out of ListLens? Here\'s how to unlock more 🚀',
      html: emailHtml,
    })

    if (error) {
      console.error('Error sending starter upsell email:', error)
      return { success: false, error }
    }

    console.log('Starter upsell email sent successfully:', data?.id)
    return { success: true, id: data?.id }
  } catch (error) {
    console.error('Error sending starter upsell email:', error)
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
  }
}

export async function sendBehaviorEmail({ to, firstName }: SendBehaviorEmailParams) {
  if (!resend) {
    console.warn('Resend not configured. Skipping behavior email.')
    return { success: false, error: 'Email service not configured' }
  }

  try {
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://listlens.app'
    const emailHtml = await render(React.createElement(BehaviorEmail, { firstName, ctaUrl: appUrl }))
    
    const { data, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to,
      subject: 'Great start! Keep going with your free edits 🎉',
      html: emailHtml,
    })

    if (error) {
      console.error('Error sending behavior email:', error)
      return { success: false, error }
    }

    console.log('Behavior email sent successfully:', data?.id)
    return { success: true, id: data?.id }
  } catch (error) {
    console.error('Error sending behavior email:', error)
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
  }
}

export async function sendReactivationEmail({ to, firstName }: SendReactivationEmailParams) {
  if (!resend) {
    console.warn('Resend not configured. Skipping reactivation email.')
    return { success: false, error: 'Email service not configured' }
  }

  try {
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://listlens.app'
    const emailHtml = await render(React.createElement(ReactivationEmail, { firstName, ctaUrl: appUrl }))
    
    const { data, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to,
      subject: 'We miss you! Your 5 free edits are waiting 👋',
      html: emailHtml,
    })

    if (error) {
      console.error('Error sending reactivation email:', error)
      return { success: false, error }
    }

    console.log('Reactivation email sent successfully:', data?.id)
    return { success: true, id: data?.id }
  } catch (error) {
    console.error('Error sending reactivation email:', error)
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
  }
}

export async function sendDay7Email({ to, firstName }: SendDay7EmailParams) {
  if (!resend) {
    console.warn('Resend not configured. Skipping Day 7 email.')
    return { success: false, error: 'Email service not configured' }
  }

  try {
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://listlens.app'
    const emailHtml = await render(React.createElement(Day7Email, { firstName, ctaUrl: appUrl }))
    
    const { data, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to,
      subject: '⏰ Your Free Edits Are Still Waiting!',
      html: emailHtml,
    })

    if (error) {
      console.error('Error sending Day 7 email:', error)
      return { success: false, error }
    }

    console.log('Day 7 email sent successfully:', data?.id)
    return { success: true, id: data?.id }
  } catch (error) {
    console.error('Error sending Day 7 email:', error)
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
  }
}

