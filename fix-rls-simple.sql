-- Simple fix: Drop and recreate usage_current view
-- Views don't need RLS policies, they inherit from base tables

DROP VIEW IF EXISTS public.usage_current;

CREATE VIEW public.usage_current AS
SELECT
  u.id AS user_id,
  u.plan,
  plan_quota(u.plan) AS quota,
  COALESCE((
    SELECT SUM(e.delta)::int
    FROM public.usage_events e
    WHERE e.user_id = u.id
      AND e.feature = 'edits'
      AND e.occurred_at >= month_start(now())
      AND e.occurred_at <= month_end(now())
  ), 0) AS used,
  (month_end(now())) AS resets_at
FROM public.users u;
