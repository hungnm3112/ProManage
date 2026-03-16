/**
 * Recurring Broadcasts Cron Job
 * Handles automatic cloning and publishing of recurring broadcasts
 * 
 * Schedule: Runs daily at 00:00
 * 
 * Author: ProManage Team
 * Date: March 16, 2026
 */

const cron = require('node-cron');
const Broadcast = require('../models/Broadcast');
const StoreTask = require('../models/StoreTask');
const Employee = require('../models/Employee');
const { getEmployeeRole } = require('../helpers/authHelper');
const notificationService = require('../services/notificationService');

/**
 * Check if today matches the recurring schedule
 * @param {Object} recurring - Recurring configuration
 * @param {Date} lastPublished - Last published date
 * @returns {Boolean}
 */
function shouldPublishToday(recurring, lastPublished) {
  if (!recurring || !recurring.enabled) {
    return false;
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // If never published before, publish today
  if (!lastPublished) {
    return true;
  }

  const lastPubDate = new Date(lastPublished);
  lastPubDate.setHours(0, 0, 0, 0);

  // Don't publish if already published today
  if (today.getTime() === lastPubDate.getTime()) {
    return false;
  }

  switch (recurring.frequency) {
    case 'daily':
      // Publish every day
      return true;

    case 'weekly':
      // Publish on specific day of week (0 = Sunday, 6 = Saturday)
      const dayOfWeek = today.getDay();
      return dayOfWeek === recurring.dayOfWeek;

    case 'monthly':
      // Publish on specific day of month
      const dayOfMonth = today.getDate();
      return dayOfMonth === recurring.dayOfMonth;

    default:
      return false;
  }
}

/**
 * Clone a broadcast and create a new instance
 * @param {Object} originalBroadcast - Original broadcast to clone
 * @returns {Promise<Object>} - Cloned broadcast
 */
async function cloneBroadcast(originalBroadcast) {
  // Calculate new deadline (maintain same duration from publish to deadline)
  const now = new Date();
  const originalPublished = originalBroadcast.publishedAt || originalBroadcast.createdAt;
  const originalDeadline = originalBroadcast.deadline;
  
  const durationMs = originalDeadline - originalPublished;
  const newDeadline = new Date(now.getTime() + durationMs);

  // Create cloned broadcast
  const cloned = new Broadcast({
    title: originalBroadcast.title,
    description: originalBroadcast.description,
    priority: originalBroadcast.priority,
    deadline: newDeadline,
    assignedStores: [...originalBroadcast.assignedStores],
    checklist: originalBroadcast.checklist.map(item => ({
      task: item.task,
      note: item.note,
      required: item.required
    })),
    attachments: originalBroadcast.attachments.map(att => ({
      filename: att.filename,
      url: att.url,
      size: att.size,
      mimeType: att.mimeType
    })),
    recurring: {
      enabled: originalBroadcast.recurring.enabled,
      frequency: originalBroadcast.recurring.frequency,
      dayOfWeek: originalBroadcast.recurring.dayOfWeek,
      dayOfMonth: originalBroadcast.recurring.dayOfMonth
    },
    status: 'draft',
    createdBy: originalBroadcast.createdBy
  });

  await cloned.save();
  
  return cloned;
}

/**
 * Auto-publish a broadcast and create store tasks
 * @param {Object} broadcast - Broadcast to publish
 */
async function autoPublishBroadcast(broadcast) {
  try {
    // Populate assignedStores
    await broadcast.populate('assignedStores');

    // Update status to active
    broadcast.status = 'active';
    broadcast.publishedAt = new Date();
    await broadcast.save();

    // Create store tasks for each assigned store
    const storeTasksPromises = broadcast.assignedStores.map(async (store) => {
      // Find manager of this store
      const manager = await Employee.findOne({
        ID_Branch: store._id,
        Status: 'Đang hoạt động'
      }).populate('ID_GroupUser');

      if (!manager) {
        console.warn(`[Recurring] No active manager found for store ${store.Name}`);
        return null;
      }

      const managerRole = await getEmployeeRole(manager);
      if (managerRole !== 'manager') {
        console.warn(`[Recurring] Employee ${manager.FullName} at store ${store.Name} is not a manager`);
        return null;
      }

      // Create store task
      const storeTask = new StoreTask({
        broadcastId: broadcast._id,
        storeId: store._id,
        managerId: manager._id,
        status: 'pending'
      });

      await storeTask.save();
      return { storeTask, managerId: manager._id };
    });

    const results = await Promise.all(storeTasksPromises);
    const created = results.filter(r => r !== null);

    // Send notifications to managers
    if (created.length > 0) {
      const managerIds = created.map(r => r.managerId);
      await notificationService.notifyBroadcastPublished(managerIds, broadcast);
    }

    console.log(`[Recurring] Auto-published broadcast "${broadcast.title}" - ${created.length} store tasks created`);
    
    return {
      success: true,
      storeTasksCreated: created.length
    };

  } catch (error) {
    console.error('[Recurring] Auto-publish error:', error);
    
    // Rollback broadcast status
    try {
      broadcast.status = 'draft';
      broadcast.publishedAt = null;
      await broadcast.save();
    } catch (rollbackError) {
      console.error('[Recurring] Rollback error:', rollbackError);
    }

    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Process all recurring broadcasts
 */
async function processRecurringBroadcasts() {
  try {
    console.log('[Recurring] Starting recurring broadcasts job...');

    // Find all active broadcasts with recurring enabled
    const recurringBroadcasts = await Broadcast.find({
      status: 'active',
      'recurring.enabled': true
    }).populate('assignedStores');

    if (recurringBroadcasts.length === 0) {
      console.log('[Recurring] No recurring broadcasts found');
      return;
    }

    console.log(`[Recurring] Found ${recurringBroadcasts.length} recurring broadcast(s)`);

    let clonedCount = 0;
    let publishedCount = 0;

    for (const broadcast of recurringBroadcasts) {
      // Check if should publish today
      if (shouldPublishToday(broadcast.recurring, broadcast.publishedAt)) {
        console.log(`[Recurring] Processing: "${broadcast.title}"`);

        // Clone the broadcast
        const cloned = await cloneBroadcast(broadcast);
        clonedCount++;

        // Auto-publish the cloned broadcast
        const result = await autoPublishBroadcast(cloned);
        if (result.success) {
          publishedCount++;
        }
      }
    }

    console.log(`[Recurring] Job completed - Cloned: ${clonedCount}, Published: ${publishedCount}`);

  } catch (error) {
    console.error('[Recurring] Job error:', error);
  }
}

/**
 * Initialize cron job
 * Schedule: Every day at 00:00 (midnight)
 */
function initRecurringBroadcastsJob() {
  // Schedule: 0 0 * * * (every day at midnight)
  const job = cron.schedule('0 0 * * *', async () => {
    console.log('[Recurring] Cron job triggered at', new Date().toISOString());
    await processRecurringBroadcasts();
  }, {
    scheduled: true,
    timezone: 'Asia/Ho_Chi_Minh' // Vietnam timezone
  });

  console.log('[Recurring] Cron job initialized - Schedule: Daily at 00:00 (Asia/Ho_Chi_Minh)');

  return job;
}

// Export functions
module.exports = {
  initRecurringBroadcastsJob,
  processRecurringBroadcasts, // Export for manual testing
  shouldPublishToday,
  cloneBroadcast,
  autoPublishBroadcast
};
