# Database Setup Guide

## 🚨 **IMPORTANT: Database Schema Required**

The error you're seeing is because the database tables haven't been created in Supabase yet.

## 📋 **Steps to Fix:**

### 1. **Open Supabase Dashboard**
- Go to [https://supabase.com/dashboard](https://supabase.com/dashboard)
- Select your project: `ppiwcewvhzelldqmhalc`

### 2. **Run the SQL Schema**
- Go to **SQL Editor** in the left sidebar
- Click **"New Query"**
- Copy and paste the entire contents of `supabase-schema.sql`
- Click **"Run"** to execute the SQL

### 3. **Verify Tables Created**
After running the SQL, you should see these tables:
- ✅ `users` - For user management and Stripe integration
- ✅ `user_usage` - For tracking free edits (legacy)
- ✅ `processed_images` - For storing image processing history

### 4. **Test the Application**
- Refresh your browser at `http://localhost:3001`
- The error should be resolved

## 🔧 **Alternative: Quick Test**

If you want to test without setting up the full database, the app will still work with fallback user objects, but you won't have:
- User persistence
- Usage tracking
- Stripe integration

## 📞 **Need Help?**

The SQL schema is in `supabase-schema.sql` - just copy and paste it into your Supabase SQL Editor!
