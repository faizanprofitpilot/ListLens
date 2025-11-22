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

export const LowCreditsEmail = ({ firstName, ctaUrl = 'https://listlens.app' }: EmailProps) => (
  <div style={{ fontFamily: 'system-ui, -apple-system, sans-serif', maxWidth: '600px', margin: '0 auto' }}>
    <div style={{ backgroundColor: '#f59e0b', padding: '32px', textAlign: 'center', borderRadius: '8px 8px 0 0' }}>
      <h1 style={{ color: '#ffffff', margin: 0, fontSize: '28px', fontWeight: 'bold' }}>
        🚀 Only 2 Edits Left — Upgrade to Keep Going!
      </h1>
    </div>
    
    <div style={{ backgroundColor: '#ffffff', padding: '40px', borderRadius: '0 0 8px 8px', border: '1px solid #e5e7eb', borderTop: 'none' }}>
      <p style={{ fontSize: '18px', color: '#1f2937', marginTop: 0, lineHeight: '1.6' }}>
        {firstName ? `Hi ${firstName},` : 'Hi there,'}
      </p>
      
      <p style={{ fontSize: '16px', color: '#4b5563', lineHeight: '1.6' }}>
        You&apos;ve used 3 of your 5 free edits — great work! You have <strong style={{ color: '#f59e0b' }}>2 edits remaining</strong>.
      </p>
      
      <p style={{ fontSize: '16px', color: '#4b5563', lineHeight: '1.6' }}>
        Ready for more? Upgrade to <strong style={{ color: '#f59e0b' }}>Starter Plan</strong> and get <strong>50 edits per month</strong> for just $29/month. Perfect for real estate professionals who need consistent, high-quality photo transformations.
      </p>
      
      <ul style={{ fontSize: '16px', color: '#4b5563', lineHeight: '1.8', paddingLeft: '20px' }}>
        <li>50 photo edits per month</li>
        <li>All AI styling options</li>
        <li>Chat refinements included</li>
        <li>Cancel anytime</li>
      </ul>
      
      <div style={{ textAlign: 'center', margin: '32px 0' }}>
        <a
          href={`${ctaUrl}?upgrade=starter`}
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
          Upgrade to Starter Plan →
        </a>
      </div>
      
      <p style={{ fontSize: '14px', color: '#6b7280', lineHeight: '1.6', marginTop: '32px' }}>
        Or continue with your remaining 2 free edits — they&apos;re yours to use anytime!
      </p>
    </div>
  </div>
)

export const BehaviorEmail = ({ firstName, ctaUrl = 'https://listlens.app' }: EmailProps) => (
  <div style={{ fontFamily: 'system-ui, -apple-system, sans-serif', maxWidth: '600px', margin: '0 auto' }}>
    <div style={{ backgroundColor: '#f59e0b', padding: '32px', textAlign: 'center', borderRadius: '8px 8px 0 0' }}>
      <h1 style={{ color: '#ffffff', margin: 0, fontSize: '28px', fontWeight: 'bold' }}>
        🎉 Great Start! Keep Going
      </h1>
    </div>
    
    <div style={{ backgroundColor: '#ffffff', padding: '40px', borderRadius: '0 0 8px 8px', border: '1px solid #e5e7eb', borderTop: 'none' }}>
      <p style={{ fontSize: '18px', color: '#1f2937', marginTop: 0, lineHeight: '1.6' }}>
        {firstName ? `Hi ${firstName},` : 'Hi there,'}
      </p>
      
      <p style={{ fontSize: '16px', color: '#4b5563', lineHeight: '1.6' }}>
        Awesome! You&apos;ve made your first edit with ListLens. How did it turn out? ✨
      </p>
      
      <p style={{ fontSize: '16px', color: '#4b5563', lineHeight: '1.6' }}>
        You still have <strong style={{ color: '#f59e0b' }}>4 free edits</strong> waiting for you. Don&apos;t stop now — upload more photos and see how AI can transform your real estate listings!
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
          Continue Editing →
        </a>
      </div>
      
      <p style={{ fontSize: '14px', color: '#6b7280', lineHeight: '1.6', marginTop: '32px' }}>
        Pro tip: Try different styling options to see which works best for your photos!
      </p>
    </div>
  </div>
)

export const ReactivationEmail = ({ firstName, ctaUrl = 'https://listlens.app' }: EmailProps) => (
  <div style={{ fontFamily: 'system-ui, -apple-system, sans-serif', maxWidth: '600px', margin: '0 auto' }}>
    <div style={{ backgroundColor: '#f59e0b', padding: '32px', textAlign: 'center', borderRadius: '8px 8px 0 0' }}>
      <h1 style={{ color: '#ffffff', margin: 0, fontSize: '28px', fontWeight: 'bold' }}>
        👋 We Miss You!
      </h1>
    </div>
    
    <div style={{ backgroundColor: '#ffffff', padding: '40px', borderRadius: '0 0 8px 8px', border: '1px solid #e5e7eb', borderTop: 'none' }}>
      <p style={{ fontSize: '18px', color: '#1f2937', marginTop: 0, lineHeight: '1.6' }}>
        {firstName ? `Hi ${firstName},` : 'Hi there,'}
      </p>
      
      <p style={{ fontSize: '16px', color: '#4b5563', lineHeight: '1.6' }}>
        It&apos;s been a few days since you signed up for ListLens. Your <strong style={{ color: '#f59e0b' }}>5 free edits</strong> are still waiting for you!
      </p>
      
      <p style={{ fontSize: '16px', color: '#4b5563', lineHeight: '1.6' }}>
        Transform your real estate photos with AI-powered enhancements. Upload your first photo and see the magic happen — it only takes a few seconds.
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
          Get Started Now →
        </a>
      </div>
      
      <p style={{ fontSize: '14px', color: '#6b7280', lineHeight: '1.6', marginTop: '32px' }}>
        Your free edits never expire — use them whenever you&apos;re ready!
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
        You&apos;ve been using ListLens Starter for 21 days — that&apos;s awesome! 🎉
      </p>
      
      <p style={{ fontSize: '16px', color: '#4b5563', lineHeight: '1.6' }}>
        Ready to take your real estate photography to the next level? Upgrade to <strong style={{ color: '#f59e0b' }}>Professional</strong> and get:
      </p>
      
      <ul style={{ fontSize: '16px', color: '#4b5563', lineHeight: '1.8', paddingLeft: '20px' }}>
        <li>350 photo edits per month (vs 50 with Starter)</li>
        <li>Priority processing — faster results</li>
        <li>Batch uploads — process multiple photos at once</li>
        <li>Email support — we&apos;ve got your back</li>
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
        Questions? Reply to this email — we&apos;re here to help!
      </p>
    </div>
  </div>
)

