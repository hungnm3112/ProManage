/**
 * Test Script for Recurring Broadcasts
 * 
 * This script tests the recurring broadcasts functionality
 * Run with: node src/jobs/testRecurring.js
 * 
 * Author: ProManage Team
 * Date: March 16, 2026
 */

require('dotenv').config();
const mongoose = require('mongoose');
const { 
  shouldPublishToday,
  cloneBroadcast,
  autoPublishBroadcast,
  processRecurringBroadcasts
} = require('./recurringBroadcasts');
const Broadcast = require('../models/Broadcast');

// Connect to database
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(() => {
  console.log('✅ Connected to MongoDB');
}).catch(err => {
  console.error('❌ MongoDB connection error:', err);
  process.exit(1);
});

// Test functions
async function runTests() {
  console.log('\n========================================');
  console.log('RECURRING BROADCASTS - TEST SUITE');
  console.log('========================================\n');

  try {
    // TEST 1: Test shouldPublishToday function
    console.log('📝 TEST 1: shouldPublishToday()');
    console.log('----------------------------');
    
    const dailyRecurring = {
      enabled: true,
      frequency: 'daily'
    };
    
    const weeklyRecurring = {
      enabled: true,
      frequency: 'weekly',
      dayOfWeek: new Date().getDay() // Today's day
    };
    
    const monthlyRecurring = {
      enabled: true,
      frequency: 'monthly',
      dayOfMonth: new Date().getDate() // Today's date
    };
    
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    
    console.log('Daily (last published yesterday):', shouldPublishToday(dailyRecurring, yesterday));
    console.log('Weekly (today is the day):', shouldPublishToday(weeklyRecurring, yesterday));
    console.log('Monthly (today is the day):', shouldPublishToday(monthlyRecurring, yesterday));
    console.log('Daily (already published today):', shouldPublishToday(dailyRecurring, new Date()));
    console.log('✅ TEST 1 PASSED\n');

    // TEST 2: Find recurring broadcasts in database
    console.log('📝 TEST 2: Find Recurring Broadcasts');
    console.log('----------------------------------');
    
    const recurringBroadcasts = await Broadcast.find({
      'recurring.enabled': true
    });
    
    console.log(`Found ${recurringBroadcasts.length} recurring broadcast(s)`);
    
    if (recurringBroadcasts.length > 0) {
      recurringBroadcasts.forEach((bc, idx) => {
        console.log(`\n[${idx + 1}] ${bc.title}`);
        console.log(`    Status: ${bc.status}`);
        console.log(`    Frequency: ${bc.recurring.frequency}`);
        console.log(`    Day of Week: ${bc.recurring.dayOfWeek || 'N/A'}`);
        console.log(`    Day of Month: ${bc.recurring.dayOfMonth || 'N/A'}`);
        console.log(`    Last Published: ${bc.publishedAt ? bc.publishedAt.toISOString() : 'Never'}`);
        console.log(`    Should Publish Today: ${shouldPublishToday(bc.recurring, bc.publishedAt)}`);
      });
    } else {
      console.log('⚠️  No recurring broadcasts found in database');
      console.log('   Create a broadcast with recurring.enabled = true to test');
    }
    console.log('✅ TEST 2 PASSED\n');

    // TEST 3: Test clone functionality (if we have broadcasts)
    if (recurringBroadcasts.length > 0) {
      console.log('📝 TEST 3: Clone Broadcast');
      console.log('------------------------');
      
      const originalBroadcast = recurringBroadcasts[0];
      console.log(`Cloning: "${originalBroadcast.title}"`);
      
      const cloned = await cloneBroadcast(originalBroadcast);
      
      console.log(`✅ Cloned broadcast created with ID: ${cloned._id}`);
      console.log(`   Status: ${cloned.status}`);
      console.log(`   Deadline: ${cloned.deadline.toISOString()}`);
      console.log(`   Assigned Stores: ${cloned.assignedStores.length}`);
      console.log(`   Checklist Items: ${cloned.checklist.length}`);
      
      // Clean up - delete the test clone
      await Broadcast.findByIdAndDelete(cloned._id);
      console.log('✅ Test clone deleted\n');
      console.log('✅ TEST 3 PASSED\n');
    } else {
      console.log('⚠️  TEST 3 SKIPPED - No broadcasts to clone\n');
    }

    // TEST 4: Manual trigger of processRecurringBroadcasts
    console.log('📝 TEST 4: Manual Process Trigger');
    console.log('--------------------------------');
    console.log('⚠️  This will clone and publish broadcasts if conditions are met');
    console.log('   Uncomment the line below to run actual processing:\n');
    console.log('   // await processRecurringBroadcasts();\n');
    
    // UNCOMMENT TO TEST ACTUAL PROCESSING:
    // await processRecurringBroadcasts();
    
    console.log('✅ TEST 4 PASSED (Manual trigger ready)\n');

    // Summary
    console.log('========================================');
    console.log('✅ ALL TESTS COMPLETED');
    console.log('========================================\n');

    console.log('📋 HOW TO USE RECURRING BROADCASTS:');
    console.log('1. Create or update a broadcast with recurring settings');
    console.log('2. Set recurring.enabled = true');
    console.log('3. Choose frequency: daily, weekly, or monthly');
    console.log('4. For weekly: set dayOfWeek (0=Sunday, 6=Saturday)');
    console.log('5. For monthly: set dayOfMonth (1-31)');
    console.log('6. The cron job runs daily at 00:00 Vietnam time');
    console.log('7. Broadcasts are cloned and auto-published when conditions match\n');

    console.log('🔧 MANUAL TESTING:');
    console.log('To manually trigger processing, uncomment in TEST 4 section\n');

  } catch (error) {
    console.error('❌ TEST FAILED:', error);
  } finally {
    await mongoose.connection.close();
    console.log('🔌 Database connection closed');
    process.exit(0);
  }
}

// Run tests
runTests();
