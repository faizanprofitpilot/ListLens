import * as React from 'react'

interface EmailProps {
  firstName?: string
  ctaUrl?: string
  ctaText?: string
}

export const WelcomeEmail = ({ firstName, ctaUrl = 'https://listlens.app' }: EmailProps) => (
  <div style={{ fontFamily: 'system-ui, -apple-system, sans-serif', maxWidth: '600px', margin: '0 auto' }}>
    <div style={{ backgroundColor: '#f59e0b', padding: '32px', textAlign: 'center', borderRadius: '8px 8px 0 0' }}>
      <h1 style={{ color: '#ffffff', margin: 0, fontSize: '28px', fontWeight: 'bold' }}>
        🎨 Welcome to ListLens!
      </h1>
    </div>
    
    <div style={{ backgroundColor: '#ffffff', padding: '40px', borderRadius: '0 0 8px 8px', border: '1px solid #e5e7eb', borderTop: 'none' }}>
      <p style={{ fontSize: '18px', color: '#1f2937', marginTop: 0, lineHeight: '1.6' }}>
        {firstName ? `Hi ${firstName},` : 'Hi there,'}
      </p>
      
      <p style={{ fontSize: '16px', color: '#4b5563', lineHeight: '1.6' }}>
        Welcome to ListLens! Your account is ready and you have <strong style={{ color: '#f59e0b' }}>5 free edits</strong> waiting for you.
      </p>
      
      <p style={{ fontSize: '16px', color: '#4b5563', lineHeight: '1.6' }}>
        Transform your real estate photos with AI-powered enhancements. Upload your first photo and watch it come to life with our professional styling options.
      </p>
      
      <div style={{ textAlign: 'center', margin: '32px 0' }}>
        <a
          href={ctaUrl}
          style={{
            display: 'inline-block',
            backgroundColor: '#f59e0b',
            color: '#ffffff',
            padding: '14px 32px',
            textDecoration: 'none',
            borderRadius: '8px',
            fontWeight: '600',
            fontSize: '16px',
          }}
        >
          Upload Your First Photo →
        </a>
      </div>
      
      <p style={{ fontSize: '14px', color: '#6b7280', lineHeight: '1.6', marginTop: '32px' }}>
        Need help? Reply to this email or visit our help center.
      </p>
    </div>
  </div>
)

export const LowCreditsEmail = ({ firstName, remainingCredits, ctaUrl = 'https://listlens.app' }: EmailProps & { remainingCredits: number }) => (
  <div style={{ fontFamily: 'system-ui, -apple-system, sans-serif', maxWidth: '600px', margin: '0 auto' }}>
    <div style={{ backgroundColor: '#f59e0b', padding: '32px', textAlign: 'center', borderRadius: '8px 8px 0 0' }}>
      <h1 style={{ color: '#ffffff', margin: 0, fontSize: '28px', fontWeight: 'bold' }}>
        👀 Don't Let Your Free Edits Expire!
      </h1>
    </div>
    
    <div style={{ backgroundColor: '#ffffff', padding: '40px', borderRadius: '0 0 8px 8px', border: '1px solid #e5e7eb', borderTop: 'none' }}>
      <p style={{ fontSize: '18px', color: '#1f2937', marginTop: 0, lineHeight: '1.6' }}>
        {firstName ? `Hi ${firstName},` : 'Hi there,'}
      </p>
      
      <p style={{ fontSize: '16px', color: '#4b5563', lineHeight: '1.6' }}>
        You still have <strong style={{ color: '#f59e0b' }}>{remainingCredits} free edit{remainingCredits > 1 ? 's' : ''}</strong> waiting for you!
      </p>
      
      <p style={{ fontSize: '16px', color: '#4b5563', lineHeight: '1.6' }}>
        Don't let them go to waste. Upload your photos now and experience the magic of AI-powered real estate photography.
      </p>
      
      <div style={{ textAlign: 'center', margin: '32px 0' }}>
        <a
          href={ctaUrl}
          style={{
            display: 'inline-block',
            backgroundColor: '#f59e0b',
            color: '#ffffff',
            padding: '14px 32px',
            textDecoration: 'none',
            borderRadius: '8px',
            fontWeight: '600',
            fontSize: '16px',
          }}
        >
          Use My Remaining Edits
        </a>
      </div>
      
      <p style={{ fontSize: '14px', color: '#6b7280', lineHeight: '1.6', marginTop: '32px' }}>
        Your free edits are yours to keep — use them anytime!
      </p>
    </div>
  </div>
)

export const StarterUpsellEmail = ({ firstName, ctaUrl = 'https://listlens.app' }: EmailProps) => (
  <div style={{ fontFamily: 'system-ui, -apple-system, sans-serif', maxWidth: '600px', margin: '0 auto' }}>
    <div style={{ backgroundColor: '#f59e0b', padding: '32px', textAlign: 'center', borderRadius: '8px 8px 0 0' }}>
      <h1 style={{ color: '#ffffff', margin: 0, fontSize: '28px', fontWeight: 'bold' }}>
        🚀 Unlock More with ListLens Pro
      </h1>
    </div>
    
    <div style={{ backgroundColor: '#ffffff', padding: '40px', borderRadius: '0 0 8px 8px', border: '1px solid #e5e7eb', borderTop: 'none' }}>
      <p style={{ fontSize: '18px', color: '#1f2937', marginTop: 0, lineHeight: '1.6' }}>
        {firstName ? `Hi ${firstName},` : 'Hi there,'}
      </p>
      
      <p style={{ fontSize: '16px', color: '#4b5563', lineHeight: '1.6' }}>
        You've been using ListLens Starter for 21 days — that's awesome! 🎉
      </p>
      
      <p style={{ fontSize: '16px', color: '#4b5563', lineHeight: '1.6' }}>
        Ready to take your real estate photography to the next level? Upgrade to <strong style={{ color: '#f59e0b' }}>Professional</strong> and get:
      </p>
      
      <ul style={{ fontSize: '16px', color: '#4b5563', lineHeight: '1.8', paddingLeft: '20px' }}>
        <li>350 photo edits per month (vs 50 with Starter)</li>
        <li>Priority processing — faster results</li>
        <li>Batch uploads — process multiple photos at once</li>
        <li>Email support — we've got your back</li>
      </ul>
      
      <div style={{ textAlign: 'center', margin: '32px 0' }}>
        <a
          href={ctaUrl}
          style={{
            display: 'inline-block',
            backgroundColor: '#f59e0b',
            color: '#ffffff',
            padding: '14px 32px',
            textDecoration: 'none',
            borderRadius: '8px',
            fontWeight: '600',
            fontSize: '16px',
          }}
        >
          Upgrade to Pro →
        </a>
      </div>
      
      <p style={{ fontSize: '14px', color: '#6b7280', lineHeight: '1.6', marginTop: '32px' }}>
        Questions? Reply to this email — we're here to help!
      </p>
    </div>
  </div>
)

