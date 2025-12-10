#!/usr/bin/env node
/**
 * Email Automation Test Script
 * 
 * Run this script to test all email flow automations:
 * node scripts/test-email-flows.js
 * 
 * Or with custom URL:
 * NEXT_PUBLIC_APP_URL=https://www.listlens.xyz node scripts/test-email-flows.js
 */

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://www.listlens.xyz';

async function testEndpoint(name, method, endpoint, headers = {}) {
  try {
    console.log(`\n🧪 Testing: ${name}`);
    console.log(`   ${method} ${BASE_URL}${endpoint}`);
    
    const response = await fetch(`${BASE_URL}${endpoint}`, {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...headers,
      },
    });

    const data = await response.json();
    const success = response.ok;

    if (success) {
      console.log(`   ✅ SUCCESS (HTTP ${response.status})`);
      
      // Print key metrics for cron job
      if (data.reactivationEmailsSent !== undefined) {
        console.log(`   📊 Results:`);
        console.log(`      - Day 3 Reactivation: ${data.reactivationEmailsSent || 0} sent`);
        console.log(`      - Day 7 Email: ${data.day7EmailsSent || 0} sent`);
        console.log(`      - Low Credits: ${data.lowCreditEmailsSent || 0} sent`);
        console.log(`      - Starter Upsell: ${data.starterUpsellEmailsSent || 0} sent`);
      }
      
      return { success: true, data };
    } else {
      console.log(`   ❌ FAILED (HTTP ${response.status})`);
      console.log(`   Error: ${JSON.stringify(data)}`);
      return { success: false, error: data };
    }
  } catch (error) {
    console.log(`   ❌ ERROR: ${error.message}`);
    return { success: false, error: error.message };
  }
}

async function runTests() {
  console.log('═══════════════════════════════════════');
  console.log('   Email Automation Test Suite');
  console.log('═══════════════════════════════════════');
  console.log(`\nBase URL: ${BASE_URL}\n`);

  const results = [];

  // Test 1: Cron Job Endpoint (Most Critical)
  const cronTest = await testEndpoint(
    'Cron Job Endpoint (check-reminders)',
    'POST',
    '/api/email/check-reminders',
    { 'x-vercel-cron': '1' }
  );
  results.push({ name: 'Cron Job Endpoint', ...cronTest });

  // Summary
  console.log('\n═══════════════════════════════════════');
  console.log('   Test Summary');
  console.log('═══════════════════════════════════════\n');

  const passed = results.filter(r => r.success).length;
  const failed = results.filter(r => !r.success).length;

  results.forEach(result => {
    const icon = result.success ? '✅' : '❌';
    console.log(`${icon} ${result.name}`);
  });

  console.log(`\n✅ Passed: ${passed}`);
  console.log(`❌ Failed: ${failed}`);
  console.log(`📊 Total: ${results.length}\n`);

  if (failed === 0) {
    console.log('🎉 All tests passed! Email automations are working correctly.');
    console.log('\n💡 Next Steps:');
    console.log('   1. Check Vercel logs to verify cron job runs automatically at 2 PM UTC');
    console.log('   2. Monitor Resend dashboard for email delivery');
    console.log('   3. Verify database columns are being updated correctly\n');
    process.exit(0);
  } else {
    console.log('⚠️  Some tests failed. Please check the errors above.\n');
    process.exit(1);
  }
}

// Run tests
runTests().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});

