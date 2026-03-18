/**
 * Recurring Broadcast Service
 * Handle deadline calculation and automatic broadcast cloning for recurring tasks
 */

const Broadcast = require('../models/Broadcast');
const StoreTask = require('../models/StoreTask');

/**
 * Calculate next deadline based on recurring pattern
 * @param {Object} broadcast - Broadcast document with recurring settings
 * @returns {Date} - Next deadline date
 */
function calculateNextDeadline(broadcast) {
  if (!broadcast.recurring || !broadcast.recurring.enabled) {
    return null;
  }
  
  const { frequency, pattern } = broadcast.recurring;
  const now = new Date();
  let nextDeadline = new Date();
  
  // Parse time (HH:mm)
  if (pattern.time) {
    const [hours, minutes] = pattern.time.split(':');
    nextDeadline.setHours(parseInt(hours), parseInt(minutes), 0, 0);
  }
  
  switch (frequency) {
    case 'daily':
      // If time already passed today, move to tomorrow
      if (nextDeadline <= now) {
        nextDeadline.setDate(nextDeadline.getDate() + 1);
      }
      break;
      
    case 'weekly':
      const targetDay = pattern.dayOfWeek;
      const currentDay = now.getDay();
      let daysUntil = targetDay - currentDay;
      
      // If target day already passed this week, move to next week
      if (daysUntil < 0 || (daysUntil === 0 && nextDeadline <= now)) {
        daysUntil += 7;
      }
      
      nextDeadline.setDate(now.getDate() + daysUntil);
      break;
      
    case 'monthly':
      if (pattern.dayOfMonth === 'last') {
        // Set to last day of current month
        nextDeadline.setMonth(nextDeadline.getMonth() + 1, 0);
        
        // If already passed, move to last day of next month
        if (nextDeadline <= now) {
          nextDeadline.setMonth(nextDeadline.getMonth() + 2, 0);
        }
      } else {
        nextDeadline.setDate(pattern.dayOfMonth);
        
        // If date already passed this month, move to next month
        if (nextDeadline <= now) {
          nextDeadline.setMonth(nextDeadline.getMonth() + 1);
        }
      }
      break;
      
    case 'yearly':
      // Set month (1-indexed in pattern, 0-indexed in Date)
      nextDeadline.setMonth(pattern.month - 1);
      
      if (pattern.dayOfMonth === 'last') {
        // Last day of specified month
        nextDeadline.setMonth(pattern.month, 0);
      } else {
        nextDeadline.setDate(pattern.dayOfMonth);
      }
      
      // If date already passed this year, move to next year
      if (nextDeadline <= now) {
        nextDeadline.setFullYear(nextDeadline.getFullYear() + 1);
      }
      break;
      
    default:
      return null;
  }
  
  return nextDeadline;
}

/**
 * Clone recurring broadcast and create new instance with next deadline
 * @param {Object} originalBroadcast - Original broadcast document
 * @param {Array} stores - Array of store IDs to assign
 * @returns {Object} - New broadcast document
 */
async function cloneRecurringBroadcast(originalBroadcast, stores = null) {
  try {
    const nextDeadline = calculateNextDeadline(originalBroadcast);
    
    if (!nextDeadline) {
      throw new Error('Cannot calculate next deadline for this broadcast');
    }
    
    // Use assigned stores from original if not provided
    const assignedStores = stores || originalBroadcast.assignedStores;
    
    // Create new broadcast
    const newBroadcast = new Broadcast({
      title: originalBroadcast.title,
      description: originalBroadcast.description,
      priority: originalBroadcast.priority,
      deadline: nextDeadline,
      checklist: originalBroadcast.checklist,
      attachments: originalBroadcast.attachments || [],
      recurring: originalBroadcast.recurring,
      createdBy: originalBroadcast.createdBy,
      assignedStores: assignedStores,
      status: 'draft'
    });
    
    await newBroadcast.save();
    
    console.log(`✅ [Recurring Service] Cloned broadcast: ${newBroadcast.title} with deadline ${nextDeadline}`);
    
    // Create store tasks for each assigned store
    if (assignedStores && assignedStores.length > 0) {
      const storeTasks = assignedStores.map(storeId => ({
        broadcastId: newBroadcast._id,
        storeId: storeId,
        status: 'pending',
        deadline: nextDeadline
      }));
      
      await StoreTask.insertMany(storeTasks);
      console.log(`✅ [Recurring Service] Created ${storeTasks.length} store tasks`);
    }
    
    return newBroadcast;
  } catch (error) {
    console.error('❌ [Recurring Service] Error cloning broadcast:', error);
    throw error;
  }
}

/**
 * Process all active recurring broadcasts and create next instances if needed
 * Should be run by cron job daily
 */
async function processRecurringBroadcasts() {
  try {
    console.log('🔄 [Recurring Service] Starting recurring broadcast processor...');
    
    // Find all active recurring broadcasts
    const recurringBroadcasts = await Broadcast.find({
      'recurring.enabled': true,
      status: 'active'
    }).populate('assignedStores');
    
    console.log(`📋 [Recurring Service] Found ${recurringBroadcasts.length} recurring broadcasts`);
    
    for (const broadcast of recurringBroadcasts) {
      try {
        const nextDeadline = calculateNextDeadline(broadcast);
        const now = new Date();
        
        if (!nextDeadline) {
          console.warn(`⚠️  [Recurring Service] Cannot calculate deadline for: ${broadcast.title}`);
          continue;
        }
        
        // Check if we need to create next instance
        // Create if deadline is within next 24 hours
        const hoursUntilDeadline = (nextDeadline - now) / (1000 * 60 * 60);
        
        if (hoursUntilDeadline <= 24 && hoursUntilDeadline > 0) {
          // Check if we already created one for this period
          const existingBroadcast = await Broadcast.findOne({
            title: broadcast.title,
            deadline: {
              $gte: new Date(nextDeadline.getTime() - 1000 * 60), // 1 minute tolerance
              $lte: new Date(nextDeadline.getTime() + 1000 * 60)
            },
            'recurring.enabled': true
          });
          
          if (!existingBroadcast) {
            await cloneRecurringBroadcast(broadcast);
            console.log(`✅ [Recurring Service] Created recurring broadcast: ${broadcast.title} for ${nextDeadline.toISOString()}`);
          } else {
            console.log(`ℹ️  [Recurring Service] Broadcast already exists for: ${broadcast.title} at ${nextDeadline.toISOString()}`);
          }
        }
      } catch (error) {
        console.error(`❌ [Recurring Service] Error processing broadcast ${broadcast.title}:`, error);
        // Continue with next broadcast
      }
    }
    
    console.log('✅ [Recurring Service] Recurring broadcast processing completed');
  } catch (error) {
    console.error('❌ [Recurring Service] Error processing recurring broadcasts:', error);
  }
}

/**
 * Get preview of next deadline for a recurring pattern
 * Used for UI preview
 * @param {String} frequency - daily, weekly, monthly, yearly
 * @param {Object} pattern - Pattern object with time, dayOfWeek, dayOfMonth, month
 * @returns {Date} - Next deadline preview
 */
function previewNextDeadline(frequency, pattern) {
  const mockBroadcast = {
    recurring: {
      enabled: true,
      frequency: frequency,
      pattern: pattern
    }
  };
  
  return calculateNextDeadline(mockBroadcast);
}

module.exports = {
  calculateNextDeadline,
  cloneRecurringBroadcast,
  processRecurringBroadcasts,
  previewNextDeadline
};
