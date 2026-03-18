# Phương án 1: Deadline Pattern (Cố định thời điểm)

## 📌 Ý tưởng

Thay vì deadline = "ngày tạo + X ngày", deadline sẽ là **thời điểm cụ thể** trong chu kỳ:

- **Hàng ngày**: Cố định giờ (VD: 9:00 mỗi ngày)
- **Hàng tuần**: Cố định thứ + giờ (VD: Thứ 7, 17:00 mỗi tuần)
- **Hàng tháng**: Cố định ngày + giờ (VD: Ngày 2, 10:00 mỗi tháng)

---

## 🎨 UI Design

### HTML Structure

```html
<!-- Recurring Settings (Updated) -->
<div class="border-t border-gray-200 pt-4">
  <div class="flex items-center mb-4">
    <input type="checkbox" id="isRecurring" class="w-4 h-4 text-purple-600 rounded focus:ring-purple-500">
    <label for="isRecurring" class="ml-2 text-gray-700 font-semibold">Lặp lại định kỳ (Recurring)</label>
  </div>
  
  <div id="recurringSettings" class="hidden space-y-4">
    <!-- Frequency Selection -->
    <div>
      <label class="block text-gray-700 font-semibold mb-2">Tần suất</label>
      <select id="recurringFrequency" class="w-full px-4 py-2 border border-gray-300 rounded-lg">
        <option value="daily">Hàng ngày (Daily)</option>
        <option value="weekly">Hàng tuần (Weekly)</option>
        <option value="monthly">Hàng tháng (Monthly)</option>
      </select>
    </div>

    <!-- Daily Settings -->
    <div id="dailySettings" class="bg-blue-50 p-4 rounded-lg border border-blue-200">
      <label class="block text-gray-700 font-semibold mb-2">Deadline hàng ngày</label>
      <div class="flex items-center gap-3">
        <span class="text-gray-700">Mỗi ngày lúc:</span>
        <input type="time" id="dailyTime" value="09:00" 
               class="px-3 py-2 border border-gray-300 rounded-lg">
      </div>
      <p class="text-sm text-gray-600 mt-2">
        Ví dụ: Thực hiện 5S lúc 9:00 sáng mỗi ngày
      </p>
    </div>

    <!-- Weekly Settings -->
    <div id="weeklySettings" class="bg-green-50 p-4 rounded-lg border border-green-200 hidden">
      <label class="block text-gray-700 font-semibold mb-2">Deadline hàng tuần</label>
      <div class="grid grid-cols-2 gap-3">
        <div>
          <label class="block text-sm text-gray-600 mb-1">Ngày trong tuần</label>
          <select id="weeklyDay" class="w-full px-3 py-2 border border-gray-300 rounded-lg">
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
          <label class="block text-sm text-gray-600 mb-1">Giờ</label>
          <input type="time" id="weeklyTime" value="17:00"
                 class="w-full px-3 py-2 border border-gray-300 rounded-lg">
        </div>
      </div>
      <p class="text-sm text-gray-600 mt-2">
        Ví dụ: Kiểm kho vào thứ 7 lúc 17:00 hàng tuần
      </p>
    </div>

    <!-- Monthly Settings -->
    <div id="monthlySettings" class="bg-orange-50 p-4 rounded-lg border border-orange-200 hidden">
      <label class="block text-gray-700 font-semibold mb-2">Deadline hàng tháng</label>
      <div class="grid grid-cols-2 gap-3">
        <div>
          <label class="block text-sm text-gray-600 mb-1">Ngày trong tháng</label>
          <select id="monthlyDay" class="w-full px-3 py-2 border border-gray-300 rounded-lg">
            <option value="1">Ngày 1</option>
            <option value="2" selected>Ngày 2</option>
            <option value="3">Ngày 3</option>
            <!-- ... 4-27 -->
            <option value="28">Ngày 28</option>
            <option value="last">Ngày cuối tháng</option>
          </select>
        </div>
        <div>
          <label class="block text-sm text-gray-600 mb-1">Giờ</label>
          <input type="time" id="monthlyTime" value="10:00"
                 class="w-full px-3 py-2 border border-gray-300 rounded-lg">
        </div>
      </div>
      <p class="text-sm text-gray-600 mt-2">
        Ví dụ: Chốt bảng chấm công vào ngày 2 lúc 10:00 hàng tháng
      </p>
    </div>

    <!-- Preview -->
    <div class="bg-purple-50 p-3 rounded-lg border border-purple-200">
      <p class="text-sm font-semibold text-purple-800 mb-1">🔮 Preview deadline:</p>
      <p id="deadlinePreview" class="text-sm text-purple-700">
        <!-- JavaScript will update this -->
      </p>
    </div>
  </div>
</div>
```

---

## ⚙️ JavaScript Logic

```javascript
// Recurring settings visibility
const recurringFrequency = document.getElementById('recurringFrequency');
const dailySettings = document.getElementById('dailySettings');
const weeklySettings = document.getElementById('weeklySettings');
const monthlySettings = document.getElementById('monthlySettings');
const deadlinePreview = document.getElementById('deadlinePreview');

// Show/hide settings based on frequency
recurringFrequency.addEventListener('change', () => {
  const frequency = recurringFrequency.value;
  
  // Hide all
  dailySettings.classList.add('hidden');
  weeklySettings.classList.add('hidden');
  monthlySettings.classList.add('hidden');
  
  // Show selected
  if (frequency === 'daily') dailySettings.classList.remove('hidden');
  if (frequency === 'weekly') weeklySettings.classList.remove('hidden');
  if (frequency === 'monthly') monthlySettings.classList.remove('hidden');
  
  updateDeadlinePreview();
});

// Update preview when inputs change
document.getElementById('dailyTime').addEventListener('change', updateDeadlinePreview);
document.getElementById('weeklyDay').addEventListener('change', updateDeadlinePreview);
document.getElementById('weeklyTime').addEventListener('change', updateDeadlinePreview);
document.getElementById('monthlyDay').addEventListener('change', updateDeadlinePreview);
document.getElementById('monthlyTime').addEventListener('change', updateDeadlinePreview);

function updateDeadlinePreview() {
  const frequency = recurringFrequency.value;
  const now = new Date();
  let nextDeadline;
  
  if (frequency === 'daily') {
    const time = document.getElementById('dailyTime').value;
    const [hours, minutes] = time.split(':');
    nextDeadline = new Date(now);
    nextDeadline.setHours(parseInt(hours), parseInt(minutes), 0, 0);
    
    // If time already passed today, show tomorrow
    if (nextDeadline <= now) {
      nextDeadline.setDate(nextDeadline.getDate() + 1);
    }
    
    deadlinePreview.textContent = `Deadline tiếp theo: ${nextDeadline.toLocaleString('vi-VN')} (hàng ngày lúc ${time})`;
    
  } else if (frequency === 'weekly') {
    const dayOfWeek = parseInt(document.getElementById('weeklyDay').value);
    const time = document.getElementById('weeklyTime').value;
    const [hours, minutes] = time.split(':');
    
    nextDeadline = new Date(now);
    nextDeadline.setHours(parseInt(hours), parseInt(minutes), 0, 0);
    
    // Calculate days until target day
    const currentDay = now.getDay();
    let daysUntil = dayOfWeek - currentDay;
    if (daysUntil <= 0 || (daysUntil === 0 && nextDeadline <= now)) {
      daysUntil += 7;
    }
    
    nextDeadline.setDate(nextDeadline.getDate() + daysUntil);
    
    const dayNames = ['Chủ nhật', 'Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7'];
    deadlinePreview.textContent = `Deadline tiếp theo: ${nextDeadline.toLocaleString('vi-VN')} (${dayNames[dayOfWeek]} hàng tuần lúc ${time})`;
    
  } else if (frequency === 'monthly') {
    const dayOfMonth = document.getElementById('monthlyDay').value;
    const time = document.getElementById('monthlyTime').value;
    const [hours, minutes] = time.split(':');
    
    nextDeadline = new Date(now);
    nextDeadline.setHours(parseInt(hours), parseInt(minutes), 0, 0);
    
    if (dayOfMonth === 'last') {
      // Last day of current month
      nextDeadline.setMonth(nextDeadline.getMonth() + 1, 0);
    } else {
      nextDeadline.setDate(parseInt(dayOfMonth));
      
      // If date passed this month, move to next month
      if (nextDeadline <= now) {
        nextDeadline.setMonth(nextDeadline.getMonth() + 1);
      }
    }
    
    const dayText = dayOfMonth === 'last' ? 'ngày cuối tháng' : `ngày ${dayOfMonth}`;
    deadlinePreview.textContent = `Deadline tiếp theo: ${nextDeadline.toLocaleString('vi-VN')} (${dayText} hàng tháng lúc ${time})`;
  }
}

// Trigger initial preview
updateDeadlinePreview();
```

---

## 💾 Backend Schema

```javascript
// Broadcast Model - Recurring field
recurring: {
  enabled: { type: Boolean, default: false },
  frequency: { 
    type: String, 
    enum: ['daily', 'weekly', 'monthly'] 
  },
  
  // Deadline pattern (thay vì dayOfWeek/dayOfMonth riêng lẻ)
  deadlinePattern: {
    // For daily: just time
    time: String,  // "09:00"
    
    // For weekly: day + time
    dayOfWeek: Number,  // 0-6 (Sunday-Saturday)
    
    // For monthly: day + time
    dayOfMonth: { 
      type: mongoose.Schema.Types.Mixed,  // Number (1-31) or "last"
    }
  }
}
```

---

## 🔄 Cron Job Logic

```javascript
// services/recurringService.js

function calculateNextDeadline(broadcast) {
  const { frequency, deadlinePattern } = broadcast.recurring;
  const now = new Date();
  let nextDeadline = new Date(now);
  
  const [hours, minutes] = deadlinePattern.time.split(':');
  nextDeadline.setHours(parseInt(hours), parseInt(minutes), 0, 0);
  
  switch (frequency) {
    case 'daily':
      // Deadline là hôm nay (nếu chưa qua giờ) hoặc ngày mai
      if (nextDeadline <= now) {
        nextDeadline.setDate(nextDeadline.getDate() + 1);
      }
      break;
      
    case 'weekly':
      const targetDay = deadlinePattern.dayOfWeek;
      const currentDay = now.getDay();
      let daysUntil = targetDay - currentDay;
      
      if (daysUntil < 0 || (daysUntil === 0 && nextDeadline <= now)) {
        daysUntil += 7;
      }
      
      nextDeadline.setDate(nextDeadline.getDate() + daysUntil);
      break;
      
    case 'monthly':
      if (deadlinePattern.dayOfMonth === 'last') {
        // Set to last day of next month
        nextDeadline.setMonth(nextDeadline.getMonth() + 1, 0);
      } else {
        nextDeadline.setDate(deadlinePattern.dayOfMonth);
        
        if (nextDeadline <= now) {
          nextDeadline.setMonth(nextDeadline.getMonth() + 1);
        }
      }
      break;
  }
  
  return nextDeadline;
}

// Clone broadcast với calculated deadline
async function cloneRecurringBroadcast(originalBroadcast) {
  const newDeadline = calculateNextDeadline(originalBroadcast);
  
  const newBroadcast = new Broadcast({
    ...originalBroadcast.toObject(),
    _id: new mongoose.Types.ObjectId(),
    deadline: newDeadline,
    createdAt: new Date(),
    status: 'draft'
  });
  
  await newBroadcast.save();
  return newBroadcast;
}
```

---

## ✅ Ưu điểm

1. **Trực quan**: User thấy rõ deadline sẽ rơi vào thời điểm nào
2. **Linh hoạt**: Phù hợp với mọi loại công việc thực tế
3. **Chính xác**: Không bị lệch do tính "ngày tạo + X"
4. **Preview**: Hiển thị deadline tiếp theo ngay khi cấu hình

## ⚠️ Nhược điểm

1. UI phức tạp hơn (nhiều input field)
2. Cần handle edge cases (ngày 31 tháng 2, v.v.)

---

## 📊 Ví dụ thực tế

### 1. Thực hiện 5S hàng ngày
```
Tần suất: Hàng ngày
Deadline: Mỗi ngày lúc 09:00

→ Deadline: 17/3/2026 09:00, 18/3/2026 09:00, 19/3/2026 09:00...
```

### 2. Kiểm kho hàng tuần
```
Tần suất: Hàng tuần
Ngày: Thứ 7
Giờ: 17:00

→ Deadline: 22/3/2026 17:00, 29/3/2026 17:00, 5/4/2026 17:00...
```

### 3. Chấm công hàng tháng
```
Tần suất: Hàng tháng
Ngày: Ngày 2
Giờ: 10:00

→ Deadline: 2/4/2026 10:00, 2/5/2026 10:00, 2/6/2026 10:00...
```

