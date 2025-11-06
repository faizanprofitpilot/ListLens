# Email Setup Guide for ListLens

This guide explains how to set up the email flows using Resend.

## Prerequisites

1. **Resend Account**: Sign up at [resend.com](https://resend.com)
2. **API Key**: Get your API key from Resend dashboard
3. **Domain Verification**: Verify your sending domain in Resend

## Environment Variables

Add these to your `.env.local`:

```bash
# Resend Configuration
RESEND_API_KEY=re_xxxxxxxxxxxxx
RESEND_FROM_EMAIL=ListLens <onboarding@yourdomain.com>

# App URL (for email links)
NEXT_PUBLIC_APP_URL=https://listlens.app

# Cron Secret (for scheduled email checks)
CRON_SECRET=your-random-secret-here
```

## Database Migration

Run the email tracking migration in Supabase:

```sql
-- Run: supabase-email-tracking-migration.sql
```

This adds columns to track:
- `welcome_email_sent` / `welcome_email_sent_at`
- `low_credits_email_sent_at`
- `starter_upsell_email_sent_at`
- `last_activity_at`

## Email Flows

### 1. Welcome Email (Free Users)
**Trigger**: Immediately after sign-up
**Location**: `src/app/auth/callback/route.ts`
- Automatically sent when new user is created
- Subject: "Welcome to ListLens — your 5 free edits are ready 🎨"

### 2. Low-Credits / Inactivity Reminder
**Trigger**: Scheduled cron job
**Location**: `src/app/api/email/check-reminders/route.ts`
- Sends when free users have 1-2 credits remaining
- OR after 3 days of inactivity
- Subject: "You still have free edits waiting — don't let them expire 👀"

### 3. 21-Day Upsell Email (Starter Plan)
**Trigger**: Scheduled cron job
**Location**: `src/app/api/email/check-reminders/route.ts`
- Sends 21 days after Starter plan signup
- Subject: "Getting the most out of ListLens? Here's how to unlock more 🚀"

## Setting Up Cron Jobs

### Option 1: Vercel Cron (Recommended)

Add to `vercel.json`:

```json
{
  "crons": [
    {
      "path": "/api/email/check-reminders",
      "schedule": "0 9 * * *"
    }
  ]
}
```

This runs daily at 9 AM UTC.

### Option 2: External Cron Service

Use a service like [cron-job.org](https://cron-job.org) or [EasyCron](https://www.easycron.com):

1. Create a cron job
2. URL: `https://yourdomain.com/api/email/check-reminders`
3. Method: POST
4. Headers: `Authorization: Bearer YOUR_CRON_SECRET`
5. Schedule: Daily at your preferred time

### Option 3: Manual Testing

You can manually trigger the reminder check:

```bash
curl -X POST https://yourdomain.com/api/email/check-reminders \
  -H "Authorization: Bearer YOUR_CRON_SECRET"
```

## Email Templates

All email templates are in `src/lib/email/templates.tsx`:
- `WelcomeEmail` - Welcome message for new users
- `LowCreditsEmail` - Reminder when credits are low
- `StarterUpsellEmail` - Upsell to Pro after 21 days

## Testing

### Test Welcome Email
```bash
curl -X POST http://localhost:3000/api/email/welcome \
  -H "Content-Type: application/json" \
  -d '{"email": "test@example.com", "firstName": "Test"}'
```

### Test Reminders (Development)
Temporarily remove the cron secret check in `check-reminders/route.ts` for local testing.

## Monitoring

- Check Resend dashboard for delivery rates
- Check application logs for email send errors
- Monitor database columns for tracking

## Troubleshooting

1. **Emails not sending**: Check `RESEND_API_KEY` is set correctly
2. **Domain issues**: Verify domain in Resend dashboard
3. **Cron not running**: Verify cron secret matches and schedule is correct
4. **Duplicate emails**: Check database tracking columns prevent duplicates

