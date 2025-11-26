-- Email Refactor Migration
-- Add columns for behavior-based and reactivation emails

-- Add new email tracking columns
ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS behavior_email_sent_at TIMESTAMP WITH TIME ZONE,
  ADD COLUMN IF NOT EXISTS reactivation_email_sent_at TIMESTAMP WITH TIME ZONE;

-- Create index for reactivation queries
CREATE INDEX IF NOT EXISTS idx_users_created_at_plan ON public.users(created_at, plan) WHERE plan = 'free';

-- Add comments
COMMENT ON COLUMN public.users.behavior_email_sent_at IS 'When behavior-based email was sent (after 1 edit)';
COMMENT ON COLUMN public.users.reactivation_email_sent_at IS 'When reactivation email was sent (Day 3, free plan)';

