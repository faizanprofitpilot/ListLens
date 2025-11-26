-- Day 7 Email Migration
-- Add column for Day 7 email tracking

-- Add new email tracking column
ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS day7_email_sent_at TIMESTAMP WITH TIME ZONE;

-- Add comment
COMMENT ON COLUMN public.users.day7_email_sent_at IS 'When Day 7 email was sent (7 days after signup, free plan)';

