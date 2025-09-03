# 🚀 ListLens Quick Setup Guide

## Step 1: Environment Variables

The `.env.local` file has been created for you. Now you need to add your API keys:

### 1.1 Get Google Gemini API Key
1. Go to [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Sign in with your Google account
3. Click "Create API Key"
4. Copy the API key

### 1.2 Get Supabase Credentials
1. Go to [Supabase](https://supabase.com) and create a new project
2. Go to Settings → API
3. Copy your Project URL and anon/public key

### 1.3 Update .env.local
Edit the `.env.local` file and replace the placeholder values:

```bash
# Replace these with your actual values:
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-actual-anon-key
GEMINI_API_KEY=your-actual-gemini-api-key
```

## Step 2: Supabase Database Setup

### 2.1 Run the SQL Schema
1. Go to your Supabase project dashboard
2. Click on "SQL Editor" in the left sidebar
3. Copy the contents of `supabase-schema.sql` file
4. Paste it into the SQL Editor
5. Click "Run" to execute the SQL

### 2.2 Verify Tables Created
After running the SQL, you should see:
- `user_usage` table (for tracking free edits)
- `processed_images` table (for storing image history)
- Proper indexes and triggers

## Step 3: Test the Application

1. **Restart your development server:**
   ```bash
   npm run dev
   ```

2. **Test the upload flow:**
   - Go to http://localhost:3000
   - Upload a property photo
   - Select a style
   - Click "Transform My Photo"
   - You should see real AI processing!

## Step 4: Verify Everything Works

### 4.1 Test API Endpoint
```bash
curl -X POST http://localhost:3000/api/process \
  -F "file=@public/placeholder-before.jpg" \
  -F "style=airbnb" \
  -F "userId=test-user"
```

You should get a successful response with a processed image URL.

### 4.2 Check Supabase
- Go to your Supabase dashboard
- Check the `user_usage` table - you should see a record for 'test-user'
- Check the `processed_images` table - you should see the processed image record

## Troubleshooting

### Common Issues:

1. **"AI service temporarily unavailable"**
   - Check that `GEMINI_API_KEY` is set correctly in `.env.local`
   - Restart the development server after adding the key

2. **"TypeError: fetch failed" (Supabase errors)**
   - Check that `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` are correct
   - Make sure you've run the SQL schema in Supabase

3. **"No file provided" error**
   - Make sure you're uploading a valid image file
   - Check file size is under 10MB

### Getting Help:
- Check the browser console for detailed error messages
- Check the terminal where `npm run dev` is running for server logs
- Verify all environment variables are set correctly

## Next Steps

Once everything is working:
1. **Test with real property photos** - upload actual real estate photos
2. **Try all three styles** - test Airbnb Cozy, Luxury Listing, and Architectural Digest
3. **Test the free edit limit** - make 20 edits to see the upgrade prompt
4. **Ready for Phase 3** - Stripe payments and user authentication!

---

🎉 **Congratulations!** You now have a fully functional AI-powered real estate photo studio!
