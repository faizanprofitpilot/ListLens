-- Fix RLS for usage_current view
-- Views need explicit RLS policies

-- Drop and recreate the view with proper RLS
DROP VIEW IF EXISTS public.usage_current;

CREATE VIEW public.usage_current WITH (security_invoker = true) AS
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

-- Enable RLS on the view
ALTER VIEW public.usage_current SET (security_invoker = true);

-- Create RLS policy for the view
CREATE POLICY usage_current_select_self ON public.usage_current
  FOR SELECT USING (auth.uid() = user_id);
