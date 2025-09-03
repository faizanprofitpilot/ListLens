#!/bin/bash

# Create .env.local file for ListLens
echo "Creating .env.local file..."

cat > .env.local << 'EOF'
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your-supabase-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key

# Google Gemini AI Configuration (Phase 2)
GEMINI_API_KEY=your-gemini-api-key

# Stripe Configuration (for Phase 3)
STRIPE_SECRET_KEY=your-stripe-secret-key
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=your-stripe-publishable-key
STRIPE_WEBHOOK_SECRET=your-stripe-webhook-secret
STRIPE_PRICE_ID=your-stripe-price-id
EOF

echo "✅ .env.local file created!"
echo ""
echo "📝 Next steps:"
echo "1. Edit .env.local and replace the placeholder values with your actual API keys"
echo "2. Get your Gemini API key from: https://makersuite.google.com/app/apikey"
echo "3. Set up your Supabase project and run the SQL schema"
echo ""
echo "🔑 Required API Keys:"
echo "   - GEMINI_API_KEY: Get from Google AI Studio"
echo "   - NEXT_PUBLIC_SUPABASE_URL: Your Supabase project URL"
echo "   - NEXT_PUBLIC_SUPABASE_ANON_KEY: Your Supabase anon key"
echo "   - STRIPE_SECRET_KEY: Your Stripe secret key"
echo "   - NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: Your Stripe publishable key"
echo "   - STRIPE_WEBHOOK_SECRET: Your Stripe webhook secret"
echo "   - STRIPE_PRO_PRICE_ID: Your Stripe price ID for $99/month Professional plan"
echo "   - STRIPE_TURBO_PRICE_ID: Your Stripe price ID for $499/month Turbo plan"
