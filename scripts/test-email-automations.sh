#!/bin/bash

# Test script for all email flow automations
# This script tests:
# 1. Cron job logic (check-reminders endpoint)
# 2. Individual email sending capabilities
# 3. Database query logic

set -e

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Get the base URL from environment or use localhost
BASE_URL="${NEXT_PUBLIC_APP_URL:-http://localhost:3000}"
TEST_EMAIL="${TEST_EMAIL:-test@example.com}"

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}Email Automation Test Suite${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""
echo -e "Base URL: ${BASE_URL}"
echo -e "Test Email: ${TEST_EMAIL}"
echo ""

# Function to make API calls
api_call() {
    local method=$1
    local endpoint=$2
    local data=$3
    local headers=$4
    
    if [ -z "$headers" ]; then
        headers="Content-Type: application/json"
    fi
    
    if [ "$method" = "GET" ]; then
        curl -s -X GET "${BASE_URL}${endpoint}" \
            -H "$headers" \
            -w "\nHTTP_CODE:%{http_code}"
    else
        echo "$data" | curl -s -X "$method" "${BASE_URL}${endpoint}" \
            -H "$headers" \
            -d @- \
            -w "\nHTTP_CODE:%{http_code}"
    fi
}

# Function to check if response is successful
check_success() {
    local response=$1
    local test_name=$2
    
    http_code=$(echo "$response" | grep -o "HTTP_CODE:[0-9]*" | cut -d: -f2)
    body=$(echo "$response" | sed 's/HTTP_CODE:[0-9]*$//')
    
    if [ "$http_code" -ge 200 ] && [ "$http_code" -lt 300 ]; then
        echo -e "${GREEN}✅ ${test_name}${NC}"
        echo "$body" | jq '.' 2>/dev/null || echo "$body"
        return 0
    else
        echo -e "${RED}❌ ${test_name} (HTTP ${http_code})${NC}"
        echo "$body"
        return 1
    fi
}

# Test 1: Check cron job logic (without sending emails)
# Note: This endpoint only works in development mode
echo -e "${YELLOW}Test 1: Cron Job Logic Check${NC}"
echo "Testing database queries for eligible users..."
response=$(api_call "GET" "/api/email/test-cron-logic" "" "")
http_code=$(echo "$response" | grep -o "HTTP_CODE:[0-9]*" | cut -d: -f2)
if [ "$http_code" = "403" ]; then
    echo -e "${YELLOW}⚠️  Skipped (endpoint disabled in production)${NC}"
else
    check_success "$response" "Cron Logic Test"
fi
echo ""

# Test 2: Test cron job endpoint (with Vercel cron header)
echo -e "${YELLOW}Test 2: Cron Job Endpoint (check-reminders)${NC}"
echo "Testing the actual cron job endpoint..."
response=$(api_call "POST" "/api/email/check-reminders" "" "x-vercel-cron: 1")
check_success "$response" "Cron Job Endpoint"
echo ""

# Test 3: Test individual email sending (if in development)
echo -e "${YELLOW}Test 3: Individual Email Sending${NC}"
test_data=$(cat <<EOF
{
  "email": "${TEST_EMAIL}",
  "firstName": "Test"
}
EOF
)
response=$(api_call "POST" "/api/email/test-all" "$test_data" "")
http_code=$(echo "$response" | grep -o "HTTP_CODE:[0-9]*" | cut -d: -f2)
if [ "$http_code" = "403" ]; then
    echo -e "${YELLOW}⚠️  Skipped (endpoint disabled in production)${NC}"
else
    check_success "$response" "All Email Types Test"
fi
echo ""

# Test 4: Check welcome email endpoint
echo -e "${YELLOW}Test 4: Welcome Email Endpoint${NC}"
welcome_data=$(cat <<EOF
{
  "email": "${TEST_EMAIL}",
  "firstName": "Test"
}
EOF
)
response=$(api_call "POST" "/api/email/welcome" "$welcome_data" "")
check_success "$response" "Welcome Email"
echo ""

# Test 5: Check behavior email endpoint
echo -e "${YELLOW}Test 5: Behavior Email Endpoint${NC}"
behavior_data=$(cat <<EOF
{
  "email": "${TEST_EMAIL}",
  "firstName": "Test"
}
EOF
)
response=$(api_call "POST" "/api/email/behavior" "$behavior_data" "")
check_success "$response" "Behavior Email"
echo ""

# Summary
echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}Test Summary${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""
echo -e "${GREEN}✅ All tests completed!${NC}"
echo ""
echo -e "${YELLOW}Next Steps:${NC}"
echo "1. Check Vercel logs to verify cron job is running automatically"
echo "2. Monitor Resend dashboard for email delivery"
echo "3. Verify database columns are being updated correctly"
echo ""
echo -e "${BLUE}To test cron job manually in production:${NC}"
echo "curl -X POST ${BASE_URL}/api/email/check-reminders -H 'x-vercel-cron: 1'"
echo ""

