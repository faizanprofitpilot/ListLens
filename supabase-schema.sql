-- ListLens Database Schema for Supabase
-- Run this SQL in your Supabase SQL Editor

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table for Stripe integration
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY,
  email TEXT NOT NULL,
  is_pro BOOLEAN DEFAULT FALSE,
  free_edits_used INTEGER DEFAULT 0,
  stripe_customer_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User usage tracking table (legacy - keeping for compatibility)
CREATE TABLE IF NOT EXISTS user_usage (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id TEXT NOT NULL,
  free_edits_used INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Processed images history table
CREATE TABLE IF NOT EXISTS processed_images (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id TEXT NOT NULL,
  original_url TEXT NOT NULL,
  processed_url TEXT NOT NULL,
  style TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_users_id ON users(id);
CREATE INDEX IF NOT EXISTS idx_users_stripe_customer_id ON users(stripe_customer_id);
CREATE INDEX IF NOT EXISTS idx_user_usage_user_id ON user_usage(user_id);
CREATE INDEX IF NOT EXISTS idx_processed_images_user_id ON processed_images(user_id);
CREATE INDEX IF NOT EXISTS idx_processed_images_created_at ON processed_images(created_at DESC);

-- Create a function to automatically update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to automatically update updated_at on users table
DROP TRIGGER IF EXISTS update_users_updated_at ON users;
CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Create trigger to automatically update updated_at on user_usage table
DROP TRIGGER IF EXISTS update_user_usage_updated_at ON user_usage;
CREATE TRIGGER update_user_usage_updated_at
    BEFORE UPDATE ON user_usage
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Insert some sample data for testing (optional)
-- INSERT INTO user_usage (user_id, free_edits_used) VALUES ('anonymous', 0);

-- Grant necessary permissions (adjust based on your Supabase setup)
-- ALTER TABLE user_usage ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE processed_images ENABLE ROW LEVEL SECURITY;

-- Create policies for Row Level Security (uncomment if you want to enable RLS)
-- CREATE POLICY "Users can view their own usage" ON user_usage
--   FOR SELECT USING (user_id = current_setting('request.jwt.claims', true)::json->>'sub');
-- 
-- CREATE POLICY "Users can update their own usage" ON user_usage
--   FOR UPDATE USING (user_id = current_setting('request.jwt.claims', true)::json->>'sub');
-- 
-- CREATE POLICY "Users can view their own images" ON processed_images
--   FOR SELECT USING (user_id = current_setting('request.jwt.claims', true)::json->>'sub');
-- 
-- CREATE POLICY "Users can insert their own images" ON processed_images
--   FOR INSERT WITH CHECK (user_id = current_setting('request.jwt.claims', true)::json->>'sub');

-- Verify tables were created
SELECT 'Tables created successfully!' as status;
SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_name IN ('user_usage', 'processed_images');
