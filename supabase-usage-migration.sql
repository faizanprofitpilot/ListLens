-- ListLens Usage System Migration
-- Clean, atomic usage tracking with idempotency and RLS

-- 1. Plan enum
DO $$ BEGIN
  CREATE TYPE plan_t AS ENUM ('free','pro','turbo');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- 2. Users table (ensure fields exist)
ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS plan plan_t DEFAULT 'free',
  ADD COLUMN IF NOT EXISTS credits_quota int,
  ADD COLUMN IF NOT EXISTS credits_used int DEFAULT 0, -- legacy, will ignore
  ADD COLUMN IF NOT EXISTS stripe_customer_id text,
  ADD COLUMN IF NOT EXISTS created_at timestamptz DEFAULT now();

-- 3. Usage ledger (idempotent events)
CREATE TABLE IF NOT EXISTS public.usage_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  job_id text NOT NULL,                 -- idempotency key per processing job
  feature text NOT NULL DEFAULT 'edits',
  delta int NOT NULL CHECK (delta > 0),
  occurred_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, job_id)
);

-- 4. Helper: start/end of current calendar month (at UTC)
CREATE OR REPLACE FUNCTION public.month_start(ts timestamptz)
RETURNS timestamptz LANGUAGE sql IMMUTABLE AS $$
  date_trunc('month', ts)
$$;

CREATE OR REPLACE FUNCTION public.month_end(ts timestamptz)
RETURNS timestamptz LANGUAGE sql IMMUTABLE AS $$
  (date_trunc('month', ts) + INTERVAL '1 month') - INTERVAL '1 second'
$$;

-- 5. Quota resolver
CREATE OR REPLACE FUNCTION public.plan_quota(p plan_t)
RETURNS int LANGUAGE sql IMMUTABLE AS $$
  SELECT CASE p
    WHEN 'free'  THEN 5
    WHEN 'pro'   THEN 350
    WHEN 'turbo' THEN 2000
    ELSE 5
  END;
$$;

-- 6. View: current month usage per user/feature
CREATE OR REPLACE VIEW public.usage_current AS
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

-- 7. RLS
ALTER TABLE public.usage_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Users: a user can select itself
DROP POLICY IF EXISTS users_select_self ON public.users;
CREATE POLICY users_select_self ON public.users
  FOR SELECT USING (auth.uid() = id);

-- Users updates only by service role (no direct client updates)
DROP POLICY IF EXISTS users_update_none ON public.users;
CREATE POLICY users_update_none ON public.users
  FOR UPDATE USING (false);

-- Usage events: user can read own, INSERT only via RPC (we'll enforce definer security)
DROP POLICY IF EXISTS ue_select_self ON public.usage_events;
CREATE POLICY ue_select_self ON public.usage_events
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS ue_insert_none ON public.usage_events;
CREATE POLICY ue_insert_none ON public.usage_events
  FOR INSERT WITH CHECK (false);

-- 8. RPC: increment usage atomically with idempotency + quota check
CREATE OR REPLACE FUNCTION public.increment_usage(_user_id uuid, _job_id text, _delta int DEFAULT 1)
RETURNS TABLE (used int, quota int, remaining int, plan plan_t, resets_at timestamptz)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_plan plan_t;
  v_quota int;
  v_used int;
BEGIN
  -- Ensure caller is the same user (if not service role)
  IF current_user = 'authenticated' THEN
    IF auth.uid() IS NULL OR auth.uid() <> _user_id THEN
      RAISE EXCEPTION 'Unauthorized';
    END IF;
  END IF;

  SELECT plan INTO v_plan FROM public.users WHERE id = _user_id LIMIT 1;
  IF v_plan IS NULL THEN RAISE EXCEPTION 'User not found'; END IF;

  v_quota := plan_quota(v_plan);

  -- Precompute current 'used' within this month
  SELECT COALESCE(SUM(delta),0) INTO v_used
  FROM public.usage_events
  WHERE user_id = _user_id
    AND feature = 'edits'
    AND occurred_at >= month_start(now())
    AND occurred_at <= month_end(now());

  -- If adding would exceed quota (for non-turbo unlimited? Turbo has quota=2000)
  IF (v_used + _delta) > v_quota THEN
    RAISE EXCEPTION 'Usage limit reached for plan % (quota %).', v_plan, v_quota
      USING HINT = 'Upgrade plan or wait until next month.';
  END IF;

  -- Idempotent insert: if job_id already present, do nothing
  INSERT INTO public.usage_events (user_id, job_id, feature, delta)
  VALUES (_user_id, _job_id, 'edits', _delta)
  ON CONFLICT (user_id, job_id) DO NOTHING;

  -- Recompute used after insert (idempotent case stays same)
  SELECT COALESCE(SUM(delta),0) INTO v_used
  FROM public.usage_events
  WHERE user_id = _user_id
    AND feature = 'edits'
    AND occurred_at >= month_start(now())
    AND occurred_at <= month_end(now());

  RETURN QUERY
  SELECT v_used, v_quota, GREATEST(v_quota - v_used, 0), v_plan, month_end(now());
END $$;

-- 9. RPC: get usage summary
CREATE OR REPLACE FUNCTION public.get_usage_summary(_user_id uuid)
RETURNS TABLE (used int, quota int, remaining int, plan plan_t, resets_at timestamptz)
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT c.used, c.quota, GREATEST(c.quota - c.used,0) AS remaining, c.plan, c.resets_at
  FROM public.usage_current c
  WHERE c.user_id = _user_id
$$;
