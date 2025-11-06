# Production Deployment Checklist for ListLens

## 🗄️ Database Migrations (Supabase)

### Step 1: Run Pricing Migration (if not already done)
**IMPORTANT:** Run these in order, with a commit between them.

1. **First, run Part 1:**
   ```sql
   -- Copy and run: supabase-pricing-update-migration-part1.sql
   ```
   This adds `starter` and `team` to the `plan_t` enum.

2. **Wait for Part 1 to complete, then run Part 2:**
   ```sql
   -- Copy and run: supabase-pricing-update-migration-part2.sql
   ```
   This migrates existing `turbo` users to `team`.

### Step 2: Run Email Tracking Migration
```sql
-- Copy and run: supabase-email-tracking-migration.sql
```
This adds:
- `welcome_email_sent` / `welcome_email_sent_at`
- `low_credits_email_sent_at`
- `starter_upsell_email_sent_at`
- `last_activity_at`

### Step 3: Verify Database Schema
Run this query to verify all columns exist:

```sql
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'users'
AND column_name IN (
  'plan',
  'free_edits_used',
  'monthly_edits_used',
  'last_reset_date',
  'welcome_email_sent',
  'welcome_email_sent_at',
  'low_credits_email_sent_at',
  'starter_upsell_email_sent_at',
  'last_activity_at'
)
ORDER BY column_name;
```

You should see all 9 columns listed.

## 🔐 Environment Variables (Vercel)

Add these to your Vercel project settings → Environment Variables:

### Required for Email System:
```bash
RESEND_API_KEY=re_xxxxxxxxxxxxx
RESEND_FROM_EMAIL=ListLens <onboarding@yourdomain.com>
NEXT_PUBLIC_APP_URL=https://yourdomain.com
CRON_SECRET=your-random-secret-here
```

### Already Required (verify these exist):
```bash
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
GEMINI_API_KEY=your-gemini-key
STRIPE_SECRET_KEY=your-stripe-secret
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=your-stripe-publishable-key
STRIPE_WEBHOOK_SECRET=your-stripe-webhook-secret
STRIPE_STARTER_PRICE_ID=your-starter-price-id
STRIPE_PRO_PRICE_ID=your-pro-price-id
STRIPE_TEAM_PRICE_ID=your-team-price-id
```

## 🚀 Deployment Steps

### 1. Push to GitHub
```bash
git add .
git commit -m "Add email flows and pricing updates"
git push origin main
```

### 2. Deploy to Vercel
- Vercel will automatically deploy on push
- Or manually trigger deployment from Vercel dashboard

### 3. Verify Cron Job
After deployment, check that Vercel cron is set up:
- Go to Vercel Dashboard → Your Project → Settings → Cron Jobs
- You should see: `/api/email/check-reminders` scheduled for `0 9 * * *` (daily at 9 AM UTC)

If it's not there, the `vercel.json` file should create it automatically.

## 🧪 Testing in Production

### Test 1: Welcome Email
1. Create a new test account (or use incognito)
2. Sign up with Google OAuth
3. Check that welcome email arrives within 1-2 minutes

### Test 2: Manual Email Test
You can manually test emails using the test endpoint (development only):
```bash
# This won't work in production - it's disabled
# But you can verify the welcome email works on signup
```

### Test 3: Cron Job
Wait for the cron job to run (or trigger manually):
```bash
curl -X POST https://yourdomain.com/api/email/check-reminders \
  -H "x-vercel-cron: 1"
```

Check Vercel logs to see if emails were sent.

## 📊 Monitoring

### Check Email Sends:
1. **Resend Dashboard**: https://resend.com/emails
   - View all sent emails
   - Check delivery rates
   - See bounce/spam reports

2. **Vercel Logs**: 
   - Go to Vercel Dashboard → Your Project → Logs
   - Filter for `/api/email/` routes
   - Look for success/error messages

3. **Database Tracking**:
   ```sql
   -- Check welcome emails sent
   SELECT COUNT(*) FROM users WHERE welcome_email_sent = true;
   
   -- Check low credits emails sent
   SELECT COUNT(*) FROM users WHERE low_credits_email_sent_at IS NOT NULL;
   
   -- Check starter upsell emails sent
   SELECT COUNT(*) FROM users WHERE starter_upsell_email_sent_at IS NOT NULL;
   ```

## ✅ Verification Checklist

- [ ] Database migrations run (pricing + email tracking)
- [ ] All environment variables set in Vercel
- [ ] Code pushed to GitHub and deployed
- [ ] Vercel cron job visible in dashboard
- [ ] Test signup sends welcome email
- [ ] Resend domain verified
- [ ] Email templates render correctly (check Resend dashboard)
- [ ] Cron job runs successfully (check logs after 24 hours)

## 🐛 Troubleshooting

### Emails not sending?
1. Check `RESEND_API_KEY` is set correctly
2. Verify domain in Resend dashboard
3. Check Vercel logs for errors
4. Verify `RESEND_FROM_EMAIL` format is correct

### Cron not running?
1. Check `vercel.json` exists in repo
2. Verify cron job appears in Vercel dashboard
3. Check Vercel logs for cron execution
4. Verify `CRON_SECRET` is set (for external cron services)

### Database errors?
1. Verify all migrations have been run
2. Check column names match exactly
3. Verify enum types exist (`plan_t` with `starter` and `team`)

## 📝 Notes

- Welcome emails send immediately on signup (async, non-blocking)
- Reminder emails run daily at 9 AM UTC
- Starter upsell emails check for users who signed up 21+ days ago
- Low credits emails check for users with 1-2 credits remaining OR 3+ days inactive

