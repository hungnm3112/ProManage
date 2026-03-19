# Implementation Plan: Recurring Deadline Pattern

## 🎯 Logic được chọn: **DEADLINE PATTERN**

### Cách hoạt động:

- **Hàng ngày (Daily)**: Cố định giờ mỗi ngày (VD: 9:00 sáng hàng ngày)
- **Hàng tuần (Weekly)**: Cố định thứ + giờ mỗi tuần (VD: Thứ 7, 17:00)
- **Hàng tháng (Monthly)**: Cố định ngày + giờ mỗi tháng (VD: Ngày 2, 10:00)

### Ưu điểm:

1. **Trực quan**: User thấy rõ deadline sẽ rơi vào thời điểm nào
2. **Phù hợp use cases thực tế**:
   - ✅ "5S hàng ngày lúc 9:00 sáng" → Chọn time = 09:00
   - ✅ "Kiểm kho thứ 7 hàng tuần" → Chọn Thứ 7, 17:00
   - ✅ "Chấm công ngày 2 hàng tháng" → Chọn Ngày 2, 10:00
3. **Preview real-time**: Hiển thị deadline tiếp theo ngay khi cấu hình
4. **Dễ maintain**: Logic rõ ràng, ít edge cases

---

## 🚀 Implementation Plan (Phương án 1)

### Phase 1: Update UI (Admin Dashboard)

```html
<!-- File: src/views/pages/admin/dashboard.ejs -->

<!-- Replace current recurring section with: -->
<div class="border-t border-gray-200 pt-4 mt-4">
  <div class="flex items-center mb-4">
    <input type="checkbox" id="isRecurring" 
           class="w-4 h-4 text-purple-600 rounded focus:ring-purple-500">
    <label for="isRecurring" class="ml-2 text-gray-700 font-semibold">
      Lặp lại định kỳ
    </label>
  </div>
  
  <div id="recurringSettings" class="hidden space-y-4">
    <!-- Frequency -->
    <div>
      <label class="block text-sm font-semibold text-gray-700 mb-2">
        Tần suất
      </label>
      <select id="recurringFrequency" 
              class="w-full px-4 py-2 border border-gray-300 rounded-lg">
        <option value="daily">Hàng ngày (Daily)</option>
        <option value="weekly">Hàng tuần (Weekly)</option>
        <option value="monthly">Hàng tháng (Monthly)</option>
      </select>
    </div>

    <!-- Daily: Just time -->
    <div id="dailyPattern" 
         class="bg-blue-50 p-4 rounded-lg border border-blue-200">
      <label class="block text-sm font-semibold text-gray-700 mb-2">
        ⏰ Deadline hàng ngày
      </label>
      <div class="flex items-center gap-3">
        <span class="text-gray-700">Mỗi ngày lúc:</span>
        <input type="time" id="dailyTime" value="09:00"
               class="px-3 py-2 border border-gray-300 rounded-lg 
                      focus:ring-2 focus:ring-purple-500 focus:border-transparent">
      </div>
      <p class="text-xs text-gray-600 mt-2">
        💡 Ví dụ: Thực hiện 5S lúc 9:00 sáng mỗi ngày
      </p>
    </div>

    <!-- Weekly: Day + Time -->
    <div id="weeklyPattern" 
         class="bg-green-50 p-4 rounded-lg border border-green-200 hidden">
      <label class="block text-sm font-semibold text-gray-700 mb-2">
        📅 Deadline hàng tuần
      </label>
      <div class="grid grid-cols-2 gap-3">
        <div>
          <label class="block text-xs text-gray-600 mb-1">Ngày trong tuần</label>
          <select id="weeklyDay" 
                  class="w-full px-3 py-2 border border-gray-300 rounded-lg">
            <option value="1">Thứ 2</option>
            <option value="2">Thứ 3</option>
            <option value="3">Thứ 4</option>
            <option value="4">Thứ 5</option>
            <option value="5">Thứ 6</option>
            <option value="6" selected>Thứ 7</option>
            <option value="0">Chủ nhật</option>
          </select>
        </div>
        <div>
          <label class="block text-xs text-gray-600 mb-1">Giờ</label>
          <input type="time" id="weeklyTime" value="17:00"
                 class="w-full px-3 py-2 border border-gray-300 rounded-lg">
        </div>
      </div>
      <p class="text-xs text-gray-600 mt-2">
        💡 Ví dụ: Kiểm kho vào thứ 7 lúc 17:00 hàng tuần
      </p>
    </div>

    <!-- Monthly: Day of month + Time -->
    <div id="monthlyPattern" 
         class="bg-orange-50 p-4 rounded-lg border border-orange-200 hidden">
      <label class="block text-sm font-semibold text-gray-700 mb-2">
        📆 Deadline hàng tháng
      </label>
      <div class="grid grid-cols-2 gap-3">
        <div>
          <label class="block text-xs text-gray-600 mb-1">Ngày trong tháng</label>
          <select id="monthlyDay" 
                  class="w-full px-3 py-2 border border-gray-300 rounded-lg">
            <option value="1">Ngày 1</option>
            <option value="2" selected>Ngày 2</option>
            <option value="3">Ngày 3</option>
            <option value="4">Ngày 4</option>
            <option value="5">Ngày 5</option>
            <option value="10">Ngày 10</option>
            <option value="15">Ngày 15</option>
            <option value="20">Ngày 20</option>
            <option value="25">Ngày 25</option>
            <option value="28">Ngày 28</option>
            <option value="last">Ngày cuối tháng</option>
          </select>
        </div>
        <div>
          <label class="block text-xs text-gray-600 mb-1">Giờ</label>
          <input type="time" id="monthlyTime" value="10:00"
                 class="w-full px-3 py-2 border border-gray-300 rounded-lg">
        </div>
      </div>
      <p class="text-xs text-gray-600 mt-2">
        💡 Ví dụ: Chốt bảng chấm công vào ngày 2 lúc 10:00 hàng tháng
      </p>
    </div>

    <!-- Preview Section -->
    <div class="bg-purple-50 p-3 rounded-lg border border-purple-200">
      <p class="text-xs font-semibold text-purple-800 mb-1">
        🔮 Preview deadline tiếp theo:
      </p>
      <p id="deadlinePreview" class="text-sm text-purple-700 font-medium">
        <!-- Updated by JavaScript -->
      </p>
    </div>
  </div>
</div>
```

### Phase 2: Update JavaScript

```javascript
// File: public/js/admin-dashboard.js

// Toggle recurring settings
const isRecurringCheckbox = document.getElementById('isRecurring');
const recurringSettings = document.getElementById('recurringSettings');

isRecurringCheckbox.addEventListener('change', () => {
  if (isRecurringCheckbox.checked) {
    recurringSettings.classList.remove('hidden');
    updateDeadlinePreview();
  } else {
    recurringSettings.classList.add('hidden');
  }
});

// Switch between daily/weekly/monthly
const recurringFrequency = document.getElementById('recurringFrequency');
const dailyPattern = document.getElementById('dailyPattern');
const weeklyPattern = document.getElementById('weeklyPattern');
const monthlyPattern = document.getElementById('monthlyPattern');

recurringFrequency.addEventListener('change', () => {
  // Hide all
  dailyPattern.classList.add('hidden');
  weeklyPattern.classList.add('hidden');
  monthlyPattern.classList.add('hidden');
  
  // Show selected
  const freq = recurringFrequency.value;
  if (freq === 'daily') dailyPattern.classList.remove('hidden');
  if (freq === 'weekly') weeklyPattern.classList.remove('hidden');
  if (freq === 'monthly') monthlyPattern.classList.remove('hidden');
  
  updateDeadlinePreview();
});

// Update preview on input change
document.getElementById('dailyTime').addEventListener('change', updateDeadlinePreview);
document.getElementById('weeklyDay').addEventListener('change', updateDeadlinePreview);
document.getElementById('weeklyTime').addEventListener('change', updateDeadlinePreview);
document.getElementById('monthlyDay').addEventListener('change', updateDeadlinePreview);
document.getElementById('monthlyTime').addEventListener('change', updateDeadlinePreview);

function updateDeadlinePreview() {
  const frequency = recurringFrequency.value;
  const now = new Date();
  const preview = document.getElementById('deadlinePreview');
  
  let nextDeadline;
  let description;
  
  if (frequency === 'daily') {
    const time = document.getElementById('dailyTime').value;
    const [hours, minutes] = time.split(':');
    
    nextDeadline = new Date();
    nextDeadline.setHours(parseInt(hours), parseInt(minutes), 0, 0);
    
    if (nextDeadline <= now) {
      nextDeadline.setDate(nextDeadline.getDate() + 1);
    }
    
    description = `Hàng ngày lúc ${time}`;
    
  } else if (frequency === 'weekly') {
    const dayOfWeek = parseInt(document.getElementById('weeklyDay').value);
    const time = document.getElementById('weeklyTime').value;
    const [hours, minutes] = time.split(':');
    
    nextDeadline = new Date();
    nextDeadline.setHours(parseInt(hours), parseInt(minutes), 0, 0);
    
    const currentDay = now.getDay();
    let daysUntil = dayOfWeek - currentDay;
    
    if (daysUntil <= 0 || (daysUntil === 0 && nextDeadline <= now)) {
      daysUntil += 7;
    }
    
    nextDeadline.setDate(now.getDate() + daysUntil);
    
    const dayNames = ['Chủ nhật', 'Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7'];
    description = `${dayNames[dayOfWeek]} hàng tuần lúc ${time}`;
    
  } else if (frequency === 'monthly') {
    const dayOfMonth = document.getElementById('monthlyDay').value;
    const time = document.getElementById('monthlyTime').value;
    const [hours, minutes] = time.split(':');
    
    nextDeadline = new Date();
    nextDeadline.setHours(parseInt(hours), parseInt(minutes), 0, 0);
    
    if (dayOfMonth === 'last') {
      // Last day of month
      nextDeadline.setMonth(nextDeadline.getMonth() + 1, 0);
    } else {
      nextDeadline.setDate(parseInt(dayOfMonth));
      
      if (nextDeadline <= now) {
        nextDeadline.setMonth(nextDeadline.getMonth() + 1);
      }
    }
    
    const dayText = dayOfMonth === 'last' ? 'cuối tháng' : `ngày ${dayOfMonth}`;
    description = `${dayText} hàng tháng lúc ${time}`;
  }
  
  const formattedDate = nextDeadline.toLocaleString('vi-VN', {
    weekday: 'short',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  });
  
  preview.innerHTML = `
    <strong>${formattedDate}</strong><br>
    <span class="text-xs">(${description})</span>
  `;
}

// Update saveBroadcast function để gửi pattern data
async function saveBroadcast() {
  // ... existing validation code ...
  
  const payload = {
    title,
    description,
    priority,
    checklist,
    recurring: {
      enabled: isRecurringCheckbox.checked,
      frequency: null,
      pattern: null
    }
  };
  
  if (isRecurringCheckbox.checked) {
    const frequency = recurringFrequency.value;
    payload.recurring.frequency = frequency;
    
    if (frequency === 'daily') {
      payload.recurring.pattern = {
        time: document.getElementById('dailyTime').value
      };
    } else if (frequency === 'weekly') {
      payload.recurring.pattern = {
        dayOfWeek: parseInt(document.getElementById('weeklyDay').value),
        time: document.getElementById('weeklyTime').value
      };
    } else if (frequency === 'monthly') {
      const dayOfMonth = document.getElementById('monthlyDay').value;
      payload.recurring.pattern = {
        dayOfMonth: dayOfMonth === 'last' ? 'last' : parseInt(dayOfMonth),
        time: document.getElementById('monthlyTime').value
      };
    }
  }
  
  // ... API call ...
}
```

### Phase 3: Update Backend Model

```javascript
// File: src/models/Broadcast.js

const broadcastSchema = new mongoose.Schema({
  // ... existing fields ...
  
  recurring: {
    enabled: { 
      type: Boolean, 
      default: false 
    },
    frequency: { 
      type: String, 
      enum: ['daily', 'weekly', 'monthly'],
      required: function() { return this.recurring.enabled; }
    },
    pattern: {
      // Common: Time (HH:mm format)
      time: { 
        type: String,
        validate: {
          validator: function(v) {
            return /^([0-1][0-9]|2[0-3]):[0-5][0-9]$/.test(v);
          },
          message: 'Time must be in HH:mm format'
        }
      },
      
      // For weekly: Day of week (0-6, Sunday-Saturday)
      dayOfWeek: {
        type: Number,
        min: 0,
        max: 6
      },
      
      // For monthly: Day of month (1-31 or "last")
      dayOfMonth: {
        type: mongoose.Schema.Types.Mixed,
        validate: {
          validator: function(v) {
            return v === 'last' || (Number.isInteger(v) && v >= 1 && v <= 31);
          },
          message: 'Day of month must be 1-31 or "last"'
        }
      }
    }
  }
}, {
  timestamps: true
});
```

### Phase 4: Create Recurring Service

```javascript
// File: src/services/recurringService.js

const Broadcast = require('../models/Broadcast');
const StoreTask = require('../models/StoreTask');

/**
 * Calculate next deadline based on pattern
 */
function calculateNextDeadline(broadcast) {
  if (!broadcast.recurring.enabled) return null;
  
  const { frequency, pattern } = broadcast.recurring;
  const now = new Date();
  let nextDeadline = new Date();
  
  const [hours, minutes] = pattern.time.split(':');
  nextDeadline.setHours(parseInt(hours), parseInt(minutes), 0, 0);
  
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
  }
  
  return nextDeadline;
}

/**
 * Clone recurring broadcast and create new instance
 */
async function cloneRecurringBroadcast(originalBroadcast, stores) {
  const nextDeadline = calculateNextDeadline(originalBroadcast);
  
  if (!nextDeadline) {
    throw new Error('Cannot calculate next deadline');
  }
  
  // Create new broadcast
  const newBroadcast = new Broadcast({
    title: originalBroadcast.title,
    description: originalBroadcast.description,
    priority: originalBroadcast.priority,
    deadline: nextDeadline,
    checklist: originalBroadcast.checklist,
    recurring: originalBroadcast.recurring,
    createdBy: originalBroadcast.createdBy,
    status: 'draft'
  });
  
  await newBroadcast.save();
  
  // Create store tasks for each store
  const storeTasks = stores.map(storeId => ({
    broadcastId: newBroadcast._id,
    storeId: storeId,
    status: 'pending',
    deadline: nextDeadline
  }));
  
  await StoreTask.insertMany(storeTasks);
  
  return newBroadcast;
}

/**
 * Check and create new instances for recurring broadcasts
 * Run this via cron job daily
 */
async function processRecurringBroadcasts() {
  try {
    // Find all active recurring broadcasts
    const recurringBroadcasts = await Broadcast.find({
      'recurring.enabled': true,
      status: 'active'
    }).populate('stores');
    
    for (const broadcast of recurringBroadcasts) {
      const nextDeadline = calculateNextDeadline(broadcast);
      const now = new Date();
      
      // Check if we need to create next instance
      // Create if deadline is within next 24 hours
      const hoursUntilDeadline = (nextDeadline - now) / (1000 * 60 * 60);
      
      if (hoursUntilDeadline <= 24 && hoursUntilDeadline > 0) {
        // Check if we already created one for this period
        const existingBroadcast = await Broadcast.findOne({
          title: broadcast.title,
          deadline: nextDeadline,
          'recurring.enabled': true
        });
        
        if (!existingBroadcast) {
          await cloneRecurringBroadcast(broadcast, broadcast.stores);
          console.log(`✅ Created recurring broadcast: ${broadcast.title} for ${nextDeadline}`);
        }
      }
    }
  } catch (error) {
    console.error('❌ Error processing recurring broadcasts:', error);
  }
}

module.exports = {
  calculateNextDeadline,
  cloneRecurringBroadcast,
  processRecurringBroadcasts
};
```

### Phase 5: Setup Cron Job

```javascript
// File: src/app.js or src/server.js

const cron = require('node-cron');
const { processRecurringBroadcasts } = require('./services/recurringService');

// Run every day at 00:00
cron.schedule('0 0 * * *', async () => {
  console.log('🔄 Running recurring broadcast processor...');
  await processRecurringBroadcasts();
});
```

---

## 📝 Testing Checklist

- [ ] Daily: Set time to 5 minutes from now, verify broadcast created
- [ ] Weekly: Set to next Saturday 17:00, verify calculation
- [ ] Monthly: Set to day 2, 10:00, verify calculation
- [ ] Monthly (last day): Set to last day of month, verify edge cases (Feb, etc.)
- [ ] Preview: Verify display updates correctly
- [ ] Cron: Test processRecurringBroadcasts manually
- [ ] Validation: Test invalid patterns (e.g., day 32)

---

## 🎉 Expected Results

**UI Flow:**
1. User clicks "Lặp lại định kỳ"
2. Selects frequency: "Hàng ngày"
3. Sets time: "09:00"
4. Preview shows: "17/3/2026 09:00 (Hàng ngày lúc 09:00)"
5. Saves broadcast

**Backend:**
```json
{
  "_id": "...",
  "title": "Thực hiện 5S",
  "recurring": {
    "enabled": true,
    "frequency": "daily",
    "pattern": {
      "time": "09:00"
    }
  }
}
```

**Cron Job (Daily at 00:00):**
- Scans all recurring broadcasts
- Calculates next deadline using `calculateNextDeadline()`
- If deadline within 24 hours, creates new broadcast instance
- Auto-creates StoreTasks for assigned stores

