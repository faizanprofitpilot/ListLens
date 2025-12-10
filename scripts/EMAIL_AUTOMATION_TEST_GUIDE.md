# Email Automation Test Guide

This guide explains how to test all email flow automations to ensure they're working correctly.

## Test Scripts Available

1. **`test-email-flows.js`** - Node.js script to test the cron job endpoint
2. **`test-email-automations.sh`** - Bash script for comprehensive testing
3. **`test-cron-endpoint.sh`** - Simple script to test just the cron endpoint

## Quick Test: Cron Job Endpoint

The most critical test is verifying the cron job endpoint works:

```bash
# Using curl
curl -X POST https://www.listlens.xyz/api/email/check-reminders \
  -H "x-vercel-cron: 1" \
  -H "Content-Type: application/json"

# Using Node.js script
node scripts/test-email-flows.js
```

## Expected Response

A successful response should look like:

```json
{
  "success": true,
  "reactivationEmailsSent": 0,
  "reactivationEmailsFailed": 0,
  "day7EmailsSent": 0,
  "day7EmailsFailed": 0,
  "lowCreditEmailsSent": 0,
  "starterUpsellEmailsSent": 0
}
```

## What Each Email Flow Does

### 1. Day 3 Reactivation Email
- **Trigger**: Users on free plan, signed up 3+ days ago
- **Condition**: `plan = 'free'`, `created_at <= 3 days ago`, `reactivation_email_sent_at IS NULL`
- **Endpoint**: Automatically sent by cron job

### 2. Day 7 Email
- **Trigger**: Users on free plan, signed up 7+ days ago
- **Condition**: `plan = 'free'`, `created_at <= 7 days ago`, `day7_email_sent_at IS NULL`
- **Endpoint**: Automatically sent by cron job

### 3. Low Credits Email
- **Trigger**: Free users with exactly 3 edits used (2 remaining)
- **Condition**: `plan = 'free'`, `free_edits_used = 3`, `low_credits_email_sent_at IS NULL`
- **Endpoint**: Automatically sent by cron job

### 4. Starter Upsell Email
- **Trigger**: Starter plan users, signed up 21+ days ago
- **Condition**: `plan = 'starter'`, `created_at <= 21 days ago`, `starter_upsell_email_sent_at IS NULL`
- **Endpoint**: Automatically sent by cron job

### 5. Welcome Email
- **Trigger**: Immediately after user signup
- **Endpoint**: `/api/email/welcome` (called from auth callback)

### 6. Behavior Email
- **Trigger**: After user's first edit
- **Endpoint**: `/api/email/behavior` (called from process/chat-refine routes)

## Testing in Production

### Option 1: Manual Cron Trigger (Vercel Dashboard)
1. Go to Vercel Dashboard → Your Project → Settings → Cron Jobs
2. Find `/api/email/check-reminders`
3. Click "Run" button
4. Check the logs to see results

### Option 2: API Call
```bash
curl -X POST https://www.listlens.xyz/api/email/check-reminders \
  -H "x-vercel-cron: 1"
```

### Option 3: Using the Test Script
```bash
NEXT_PUBLIC_APP_URL=https://www.listlens.xyz node scripts/test-email-flows.js
```

## Verification Checklist

- [ ] Cron job endpoint returns 200 status
- [ ] Response includes all email type counts
- [ ] Vercel logs show `[Email Cron] 🔔 Route handler invoked`
- [ ] Vercel logs show `[Email Cron] ✅ Authorized request`
- [ ] Vercel logs show email sending results
- [ ] Resend dashboard shows emails being sent
- [ ] Database columns (`reactivation_email_sent_at`, `day7_email_sent_at`, etc.) are being updated

## Monitoring

### Vercel Logs
Check logs around 2 PM UTC (9 AM EST) to see if cron runs automatically:
- Filter for `/api/email/check-reminders`
- Look for `[Email Cron]` log messages

### Resend Dashboard
- Go to https://resend.com/emails
- Check delivery rates and bounce reports

### Database Verification
```sql
-- Check Day 3 reactivation emails sent
SELECT COUNT(*) FROM users 
WHERE reactivation_email_sent_at IS NOT NULL;

-- Check Day 7 emails sent
SELECT COUNT(*) FROM users 
WHERE day7_email_sent_at IS NOT NULL;

-- Check eligible users (not yet emailed)
SELECT COUNT(*) FROM users 
WHERE plan = 'free' 
  AND created_at <= NOW() - INTERVAL '3 days'
  AND reactivation_email_sent_at IS NULL;
```

## Troubleshooting

### Cron Job Not Running Automatically
1. Verify `export const dynamic = 'force-dynamic'` is in the route file
2. Check Vercel cron job is enabled in dashboard
3. Verify cron schedule in `vercel.json` is correct (`0 14 * * *`)
4. Check Vercel logs for any errors

### Emails Not Sending
1. Verify `RESEND_API_KEY` is set in Vercel environment variables
2. Check Resend dashboard for API errors
3. Verify `SUPABASE_SERVICE_ROLE_KEY` is set (for cron job database access)
4. Check Vercel logs for Supabase errors

### Authorization Errors
1. Verify cron job sends `x-vercel-cron: 1` header
2. Check User-Agent contains `vercel-cron`
3. Verify route handler checks both headers correctly

## Key Files

- **Cron Job Route**: `src/app/api/email/check-reminders/route.ts`
- **Email Service**: `src/lib/email/service.ts`
- **Email Templates**: `src/lib/email/templates.tsx`
- **Vercel Config**: `vercel.json`

