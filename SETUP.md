# ListLens Setup Instructions

## Environment Variables

Create a `.env.local` file in the root directory with the following variables:

```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your-supabase-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key

# Google Gemini AI Configuration (Phase 2)
GEMINI_API_KEY=your-gemini-api-key

# Stripe Configuration (for Phase 3)
STRIPE_SECRET_KEY=your-stripe-secret-key
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=your-stripe-publishable-key
STRIPE_WEBHOOK_SECRET=your-stripe-webhook-secret
```

## Getting Started

1. Install dependencies:
   ```bash
   npm install
   ```

2. Set up your environment variables (see above)

3. Run the development server:
   ```bash
   npm run dev
   ```

4. Open [http://localhost:3000](http://localhost:3000) in your browser

## Phase 1 Features (Completed)

- ✅ Next.js 14 with TypeScript and Tailwind CSS
- ✅ Responsive landing page with modern SaaS design
- ✅ File upload with drag-and-drop functionality
- ✅ Style selection (Airbnb Cozy, Luxury Listing, Architectural Digest)
- ✅ Before/after preview slider with placeholder images
- ✅ Usage counter (20 free edits)
- ✅ Supabase client setup

## Phase 2 Features (Completed)

- ✅ Real AI photo processing with Google Gemini 2.5 Flash Image (Nano Banana)
- ✅ Style-specific prompt engineering for each toggle
- ✅ Comprehensive error handling and fallbacks
- ✅ Usage tracking with Supabase
- ✅ Free edit limit enforcement
- ✅ Real-time processing status updates
- ✅ Upgrade prompts when limit reached

## Phase 3 Features (Coming Next)

- 🔄 User authentication system
- 🔄 Stripe payment integration
- 🔄 Watermark removal for paid users
- 🔄 User dashboard and image history
- 🔄 Advanced AI features and custom styles

## Project Structure

```
src/
├── app/
│   ├── api/process/route.ts    # AI photo processing API
│   ├── globals.css            # Global styles + animations
│   ├── layout.tsx             # SEO-optimized layout
│   └── page.tsx               # Main landing page
├── components/
│   ├── Hero.tsx               # Hero section with CTA
│   ├── UploadBox.tsx          # File upload component
│   ├── StyleToggles.tsx       # Style selection buttons
│   └── PreviewSlider.tsx      # Before/after comparison
└── lib/
    ├── supabaseClient.ts      # Database configuration
    ├── aiClient.ts            # Google Gemini AI integration
    └── usageService.ts        # Usage tracking service
```

## Tech Stack

- **Frontend:** Next.js 14 (App Router), TypeScript, Tailwind CSS
- **Backend:** Next.js API Routes
- **Database:** Supabase (PostgreSQL)
- **AI Processing:** Google Gemini 2.5 Flash Image (Nano Banana)
- **Payments:** Stripe (Phase 3)
- **Icons:** Lucide React

## Supabase Database Schema

You'll need to create these tables in your Supabase project:

```sql
-- User usage tracking
CREATE TABLE user_usage (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id TEXT NOT NULL,
  free_edits_used INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Processed images history
CREATE TABLE processed_images (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id TEXT NOT NULL,
  original_url TEXT NOT NULL,
  processed_url TEXT NOT NULL,
  style TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_user_usage_user_id ON user_usage(user_id);
CREATE INDEX idx_processed_images_user_id ON processed_images(user_id);
CREATE INDEX idx_processed_images_created_at ON processed_images(created_at DESC);
```
