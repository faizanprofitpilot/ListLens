#!/usr/bin/env tsx
/**
 * Comprehensive Email Automation Test Script
 * 
 * Tests all email flow automations:
 * 1. Cron job logic (database queries)
 * 2. Cron job endpoint execution
 * 3. Individual email sending
 * 4. Email template rendering
 */

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
const TEST_EMAIL = process.env.TEST_EMAIL || 'test@example.com'

interface TestResult {
  name: string
  success: boolean
  message: string
  data?: any
  error?: string
}

const results: TestResult[] = []

async function testEndpoint(
  name: string,
  method: 'GET' | 'POST',
  endpoint: string,
  body?: any,
  headers?: Record<string, string>
): Promise<TestResult> {
  try {
    const options: RequestInit = {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...headers,
      },
    }

    if (body && method === 'POST') {
      options.body = JSON.stringify(body)
    }

    const response = await fetch(`${BASE_URL}${endpoint}`, options)
    const data = await response.json()

    const success = response.ok
    return {
      name,
      success,
      message: success ? '✅ Passed' : `❌ Failed (HTTP ${response.status})`,
      data: success ? data : undefined,
      error: success ? undefined : JSON.stringify(data),
    }
  } catch (error) {
    return {
      name,
      success: false,
      message: '❌ Error',
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

async function runTests() {
  console.log('🧪 Email Automation Test Suite')
  console.log('================================\n')
  console.log(`Base URL: ${BASE_URL}`)
  console.log(`Test Email: ${TEST_EMAIL}\n`)

  // Test 1: Cron job logic (database queries)
  console.log('📊 Test 1: Cron Job Logic Check')
  console.log('Testing database queries for eligible users...')
  const cronLogicTest = await testEndpoint(
    'Cron Logic Test',
    'GET',
    '/api/email/test-cron-logic'
  )
  results.push(cronLogicTest)
  console.log(cronLogicTest.message)
  if (cronLogicTest.data) {
    console.log(`  - Day 3 Reactivation: ${cronLogicTest.data.summary?.reactivation?.totalFound || 0} found, ${cronLogicTest.data.summary?.reactivation?.eligible || 0} eligible`)
    console.log(`  - Day 7 Email: ${cronLogicTest.data.summary?.day7?.totalFound || 0} found, ${cronLogicTest.data.summary?.day7?.eligible || 0} eligible`)
  }
  console.log('')

  // Test 2: Cron job endpoint execution
  console.log('⏰ Test 2: Cron Job Endpoint Execution')
  console.log('Testing the actual cron job endpoint...')
  const cronJobTest = await testEndpoint(
    'Cron Job Endpoint',
    'POST',
    '/api/email/check-reminders',
    undefined,
    { 'x-vercel-cron': '1' }
  )
  results.push(cronJobTest)
  console.log(cronJobTest.message)
  if (cronJobTest.data) {
    console.log(`  - Reactivation emails sent: ${cronJobTest.data.reactivationEmailsSent || 0}`)
    console.log(`  - Day 7 emails sent: ${cronJobTest.data.day7EmailsSent || 0}`)
    console.log(`  - Low credit emails sent: ${cronJobTest.data.lowCreditEmailsSent || 0}`)
    console.log(`  - Starter upsell emails sent: ${cronJobTest.data.starterUpsellEmailsSent || 0}`)
  }
  console.log('')

  // Test 3: Individual email sending (only in development)
  if (process.env.NODE_ENV !== 'production') {
    console.log('📧 Test 3: Individual Email Sending')
    console.log('Testing all email types...')
    const allEmailsTest = await testEndpoint(
      'All Email Types',
      'POST',
      '/api/email/test-all',
      {
        email: TEST_EMAIL,
        firstName: 'Test',
      }
    )
    results.push(allEmailsTest)
    console.log(allEmailsTest.message)
    if (allEmailsTest.data?.results) {
      Object.entries(allEmailsTest.data.results).forEach(([type, result]) => {
        console.log(`  - ${type}: ${result}`)
      })
    }
    console.log('')
  } else {
    console.log('📧 Test 3: Individual Email Sending')
    console.log('⚠️  Skipped (production mode)\n')
  }

  // Test 4: Welcome email endpoint
  console.log('👋 Test 4: Welcome Email Endpoint')
  const welcomeTest = await testEndpoint(
    'Welcome Email',
    'POST',
    '/api/email/welcome',
    {
      email: TEST_EMAIL,
      firstName: 'Test',
    }
  )
  results.push(welcomeTest)
  console.log(welcomeTest.message)
  console.log('')

  // Test 5: Behavior email endpoint
  console.log('🎯 Test 5: Behavior Email Endpoint')
  const behaviorTest = await testEndpoint(
    'Behavior Email',
    'POST',
    '/api/email/behavior',
    {
      email: TEST_EMAIL,
      firstName: 'Test',
    }
  )
  results.push(behaviorTest)
  console.log(behaviorTest.message)
  console.log('')

  // Summary
  console.log('================================')
  console.log('📋 Test Summary')
  console.log('================================\n')

  const passed = results.filter((r) => r.success).length
  const failed = results.filter((r) => !r.success).length

  results.forEach((result) => {
    console.log(`${result.message} - ${result.name}`)
    if (!result.success && result.error) {
      console.log(`   Error: ${result.error}`)
    }
  })

  console.log('')
  console.log(`✅ Passed: ${passed}`)
  console.log(`❌ Failed: ${failed}`)
  console.log(`📊 Total: ${results.length}`)
  console.log('')

  if (failed === 0) {
    console.log('🎉 All tests passed!')
    process.exit(0)
  } else {
    console.log('⚠️  Some tests failed. Check the errors above.')
    process.exit(1)
  }
}

// Run tests
runTests().catch((error) => {
  console.error('Fatal error running tests:', error)
  process.exit(1)
})

