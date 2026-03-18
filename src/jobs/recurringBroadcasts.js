/**
 * Recurring Broadcasts Cron Job
 * Handles automatic creation of recurring broadcast instances
 * 
 * Schedule: Runs daily at 00:00 Vietnam time
 * 
 * Author: ProManage Team
 * Date: March 17, 2026 (Updated)
 */

const cron = require('node-cron');
const { processRecurringBroadcasts } = require('../services/recurringService');

/**
 * Initialize cron job
 * Schedule: Every day at 00:00 (midnight)
 */
function initRecurringBroadcastsJob() {
  // Schedule: 0 0 * * * (every day at midnight)
  const job = cron.schedule('0 0 * * *', async () => {
    console.log('[Recurring Job] Cron job triggered at', new Date().toISOString());
    await processRecurringBroadcasts();
  }, {
    scheduled: true,
    timezone: 'Asia/Ho_Chi_Minh' // Vietnam timezone
  });

  console.log('✅ [Recurring Job] Cron job initialized - will run daily at 00:00 Vietnam time');

  return job;
}

module.exports = {
  initRecurringBroadcastsJob
};

