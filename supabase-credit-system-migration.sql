-- Credit System Migration
-- Add new columns for proper plan-based credit tracking

-- Add new columns to users table
ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS plan TEXT DEFAULT 'free' CHECK (plan IN ('free', 'pro', 'turbo')),
  ADD COLUMN IF NOT EXISTS monthly_edits_used INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS last_reset_date TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Update existing users to have proper plan values
UPDATE public.users 
SET plan = CASE 
  WHEN is_pro = true THEN 'pro'
  ELSE 'free'
END
WHERE plan IS NULL OR plan = 'free';

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_users_plan ON public.users(plan);
CREATE INDEX IF NOT EXISTS idx_users_last_reset_date ON public.users(last_reset_date);

-- Add comment explaining the credit system
COMMENT ON COLUMN public.users.plan IS 'User plan: free (5 total credits), pro (350 monthly credits), turbo (2000 monthly credits)';
COMMENT ON COLUMN public.users.free_edits_used IS 'Total credits used for free users (lifetime)';
COMMENT ON COLUMN public.users.monthly_edits_used IS 'Monthly credits used for pro/turbo users (resets monthly)';
COMMENT ON COLUMN public.users.last_reset_date IS 'Last time monthly credits were reset for pro/turbo users';
