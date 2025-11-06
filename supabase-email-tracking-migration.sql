-- Email Tracking Migration
-- Add columns to track email sends and user activity

-- Add email tracking columns
ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS welcome_email_sent BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS welcome_email_sent_at TIMESTAMP WITH TIME ZONE,
  ADD COLUMN IF NOT EXISTS low_credits_email_sent_at TIMESTAMP WITH TIME ZONE,
  ADD COLUMN IF NOT EXISTS starter_upsell_email_sent_at TIMESTAMP WITH TIME ZONE,
  ADD COLUMN IF NOT EXISTS last_activity_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Create index for activity queries
CREATE INDEX IF NOT EXISTS idx_users_last_activity_at ON public.users(last_activity_at);
CREATE INDEX IF NOT EXISTS idx_users_plan_created_at ON public.users(plan, created_at) WHERE plan = 'starter';

-- Add comments
COMMENT ON COLUMN public.users.welcome_email_sent IS 'Whether welcome email has been sent';
COMMENT ON COLUMN public.users.welcome_email_sent_at IS 'When welcome email was sent';
COMMENT ON COLUMN public.users.low_credits_email_sent_at IS 'When low credits reminder email was sent';
COMMENT ON COLUMN public.users.starter_upsell_email_sent_at IS 'When 21-day upsell email was sent to Starter users';
COMMENT ON COLUMN public.users.last_activity_at IS 'Last time user performed an action (upload, process, etc.)';

