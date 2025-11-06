-- Pricing Update Migration
-- Add Starter plan and rename Turbo to Team
-- 
-- IMPORTANT: PostgreSQL requires enum values to be committed before use.
-- Run this migration in TWO PARTS:
-- 
-- STEP 1: Run supabase-pricing-update-migration-part1.sql
--         This adds 'starter' and 'team' to the enum
-- 
-- STEP 2: After Step 1 completes, run supabase-pricing-update-migration-part2.sql
--         This migrates existing 'turbo' users to 'team'
--
-- OR run the parts below separately in Supabase SQL editor:

-- ============================================
-- PART 1: Add enum values (run this first)
-- ============================================
DO $$ BEGIN
  -- Add starter if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'starter' AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'plan_t')) THEN
    ALTER TYPE plan_t ADD VALUE 'starter';
  END IF;
  
  -- Add team if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'team' AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'plan_t')) THEN
    ALTER TYPE plan_t ADD VALUE 'team';
  END IF;
EXCEPTION WHEN OTHERS THEN
  -- If enum doesn't exist, create it
  CREATE TYPE plan_t AS ENUM ('free', 'pro', 'turbo', 'starter', 'team');
END $$;

-- ============================================
-- PART 2: Migrate users (run this AFTER part 1)
-- ============================================
-- Uncomment and run after Part 1 is committed:
/*
UPDATE public.users 
SET plan = 'team'::plan_t
WHERE plan = 'turbo'::plan_t;

COMMENT ON COLUMN public.users.plan IS 'User plan: free (5 total credits), starter (50 monthly credits), pro (350 monthly credits), team (2000 monthly credits, up to 5 users)';
*/

