-- Pricing Update Migration - PART 2
-- Migrate existing 'turbo' users to 'team'
-- 
-- Run this AFTER part 1 has been committed

-- Migrate existing 'turbo' users to 'team'
UPDATE public.users 
SET plan = 'team'::plan_t
WHERE plan = 'turbo'::plan_t;

-- Update comments to reflect new plans
COMMENT ON COLUMN public.users.plan IS 'User plan: free (5 total credits), starter (50 monthly credits), pro (350 monthly credits), team (2000 monthly credits, up to 5 users)';

