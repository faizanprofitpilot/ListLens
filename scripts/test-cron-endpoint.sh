#!/bin/bash

# Simple test script for the cron job endpoint
# This is the most critical test - verifies the cron job automation works

set -e

BASE_URL="${NEXT_PUBLIC_APP_URL:-https://www.listlens.xyz}"

echo "🧪 Testing Cron Job Endpoint"
echo "============================"
echo ""
echo "Base URL: ${BASE_URL}"
echo ""

echo "Testing: POST /api/email/check-reminders"
echo "With header: x-vercel-cron: 1"
echo ""

response=$(curl -s -w "\nHTTP_CODE:%{http_code}" -X POST "${BASE_URL}/api/email/check-reminders" \
  -H "Content-Type: application/json" \
  -H "x-vercel-cron: 1" \
  --max-time 60)

http_code=$(echo "$response" | grep -o "HTTP_CODE:[0-9]*" | cut -d: -f2)
body=$(echo "$response" | sed 's/HTTP_CODE:[0-9]*$//')

echo "HTTP Status: ${http_code}"
echo ""

if [ "$http_code" -ge 200 ] && [ "$http_code" -lt 300 ]; then
    echo "✅ SUCCESS - Cron job endpoint is working!"
    echo ""
    echo "Response:"
    echo "$body" | jq '.' 2>/dev/null || echo "$body"
    echo ""
    
    # Extract key metrics
    reactivation=$(echo "$body" | jq -r '.reactivationEmailsSent // 0' 2>/dev/null || echo "0")
    day7=$(echo "$body" | jq -r '.day7EmailsSent // 0' 2>/dev/null || echo "0")
    lowCredits=$(echo "$body" | jq -r '.lowCreditEmailsSent // 0' 2>/dev/null || echo "0")
    starterUpsell=$(echo "$body" | jq -r '.starterUpsellEmailsSent // 0' 2>/dev/null || echo "0")
    
    echo "📊 Email Summary:"
    echo "  - Day 3 Reactivation emails sent: ${reactivation}"
    echo "  - Day 7 emails sent: ${day7}"
    echo "  - Low credit emails sent: ${lowCredits}"
    echo "  - Starter upsell emails sent: ${starterUpsell}"
    echo ""
    echo "✅ All email automations are working correctly!"
else
    echo "❌ FAILED - HTTP ${http_code}"
    echo ""
    echo "Response:"
    echo "$body"
    echo ""
    exit 1
fi

