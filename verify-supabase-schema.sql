-- Verification Script for Supabase Schema
-- Run this to check if all required columns and migrations are in place

-- 1. Check if plan enum includes all required values
SELECT 
  enumlabel as plan_value,
  CASE 
    WHEN enumlabel IN ('free', 'starter', 'pro', 'team') THEN '✅'
    ELSE '❌ Missing'
  END as status
FROM pg_enum 
WHERE enumtypid = (SELECT oid FROM pg_type WHERE typname = 'plan_t')
ORDER BY enumlabel;

-- 2. Check users table columns
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default,
  CASE 
    WHEN column_name IN (
      'id', 'email', 'is_pro', 'plan', 
      'free_edits_used', 'monthly_edits_used', 'last_reset_date',
      'stripe_customer_id', 'created_at', 'updated_at',
      'welcome_email_sent', 'welcome_email_sent_at',
      'low_credits_email_sent_at', 'starter_upsell_email_sent_at',
      'last_activity_at'
    ) THEN '✅'
    ELSE '⚠️ Extra'
  END as status
FROM information_schema.columns
WHERE table_name = 'users'
AND table_schema = 'public'
ORDER BY column_name;

-- 3. Check required indexes exist
SELECT 
  indexname,
  CASE 
    WHEN indexname IN (
      'idx_users_plan',
      'idx_users_last_reset_date',
      'idx_users_last_activity_at',
      'idx_users_plan_created_at'
    ) THEN '✅'
    ELSE '⚠️ Extra'
  END as status
FROM pg_indexes
WHERE tablename = 'users'
AND schemaname = 'public'
ORDER BY indexname;

-- 4. Summary check
SELECT 
  'Plan Enum Values' as check_name,
  COUNT(*) as count,
  CASE 
    WHEN COUNT(*) >= 4 THEN '✅ All plans present'
    ELSE '❌ Missing plans'
  END as status
FROM pg_enum 
WHERE enumtypid = (SELECT oid FROM pg_type WHERE typname = 'plan_t')
UNION ALL
SELECT 
  'Required User Columns' as check_name,
  COUNT(*) as count,
  CASE 
    WHEN COUNT(*) >= 15 THEN '✅ All columns present'
    ELSE '❌ Missing columns'
  END as status
FROM information_schema.columns
WHERE table_name = 'users'
AND table_schema = 'public'
AND column_name IN (
  'id', 'email', 'is_pro', 'plan', 
  'free_edits_used', 'monthly_edits_used', 'last_reset_date',
  'stripe_customer_id', 'created_at', 'updated_at',
  'welcome_email_sent', 'welcome_email_sent_at',
  'low_credits_email_sent_at', 'starter_upsell_email_sent_at',
  'last_activity_at'
)
UNION ALL
SELECT 
  'Required Indexes' as check_name,
  COUNT(*) as count,
  CASE 
    WHEN COUNT(*) >= 4 THEN '✅ All indexes present'
    ELSE '❌ Missing indexes'
  END as status
FROM pg_indexes
WHERE tablename = 'users'
AND schemaname = 'public'
AND indexname IN (
  'idx_users_plan',
  'idx_users_last_reset_date',
  'idx_users_last_activity_at',
  'idx_users_plan_created_at'
);

