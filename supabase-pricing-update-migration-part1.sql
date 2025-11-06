-- Pricing Update Migration - PART 1
-- Add 'starter' and 'team' to the plan enum
-- 
-- Run this FIRST, then run part 2

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

