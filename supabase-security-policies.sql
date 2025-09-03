-- Supabase Security Policies for ListLens
-- Run this in Supabase Dashboard > SQL Editor

-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE processed_images ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (to avoid conflicts)
DROP POLICY IF EXISTS "Users can view own profile" ON users;
DROP POLICY IF EXISTS "Users can update own profile" ON users;
DROP POLICY IF EXISTS "Users can insert own profile" ON users;
DROP POLICY IF EXISTS "Users can view own usage" ON user_usage;
DROP POLICY IF EXISTS "Users can update own usage" ON user_usage;
DROP POLICY IF EXISTS "Users can insert own usage" ON user_usage;
DROP POLICY IF EXISTS "Users can view own images" ON processed_images;
DROP POLICY IF EXISTS "Users can insert own images" ON processed_images;
DROP POLICY IF EXISTS "Service role full access" ON users;
DROP POLICY IF EXISTS "Service role full access" ON user_usage;
DROP POLICY IF EXISTS "Service role full access" ON processed_images;

-- Users table policies (with proper type casting)
CREATE POLICY "Users can view own profile" ON users
  FOR SELECT USING (auth.uid() = id::uuid);

CREATE POLICY "Users can update own profile" ON users
  FOR UPDATE USING (auth.uid() = id::uuid);

CREATE POLICY "Users can insert own profile" ON users
  FOR INSERT WITH CHECK (auth.uid() = id::uuid);

-- User usage table policies (with proper type casting)
CREATE POLICY "Users can view own usage" ON user_usage
  FOR SELECT USING (auth.uid() = user_id::uuid);

CREATE POLICY "Users can update own usage" ON user_usage
  FOR UPDATE USING (auth.uid() = user_id::uuid);

CREATE POLICY "Users can insert own usage" ON user_usage
  FOR INSERT WITH CHECK (auth.uid() = user_id::uuid);

-- Processed images table policies (with proper type casting)
CREATE POLICY "Users can view own images" ON processed_images
  FOR SELECT USING (auth.uid() = user_id::uuid);

CREATE POLICY "Users can insert own images" ON processed_images
  FOR INSERT WITH CHECK (auth.uid() = user_id::uuid);

-- Service role can do everything (for server-side operations)
CREATE POLICY "Service role full access" ON users
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role full access" ON user_usage
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role full access" ON processed_images
  FOR ALL USING (auth.role() = 'service_role');
