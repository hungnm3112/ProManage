# Phương án 1: Deadline Pattern (Cố định thời điểm)

> **⚠️ UPDATE 20/03/2026 (v2):** Simplified UX - Monthly và Yearly giờ dùng input giống "Làm một lần"  
> - **Ý tưởng:** User chỉ cần chọn ngày/giờ mong muốn LẦN ĐẦU, backend tự extract pattern  
> - **Monthly:** Chọn 20/03/2026 10:00 → Backend extract dayOfMonth=20 → Lặp ngày 20 mỗi tháng  
> - **Yearly:** Chọn 20/03/2026 10:00 → Backend extract month=3, day=20 → Lặp 20/3 mỗi năm  
> - **Lợi ích:** UX đơn giản, user không cần hiểu "dayOfMonth", native date picker hỗ trợ calendar

## 📌 Ý tưởng

Thay vì deadline = "ngày tạo + X ngày", deadline sẽ là **thời điểm cụ thể** trong chu kỳ:

- **Hàng ngày**: Cố định giờ (VD: 9:00 mỗi ngày)
- **Hàng tuần**: Cố định thứ + giờ (VD: Thứ 7, 17:00 mỗi tuần)
- **Hàng tháng**: User chọn ngày cụ thể, hệ thống tự động lặp lại mỗi tháng (VD: 20/03 10:00 → 20/04 10:00 → 20/05 10:00...)
- **Hàng năm**: User chọn ngày cụ thể, hệ thống tự động lặp lại mỗi năm (VD: 20/03 10:00 → 20/03/2027 10:00...)

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
        <option value="yearly">Hàng năm (Yearly)</option>
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
      <p class="text-sm text-gray-600 mb-3">
        💡 Chọn ngày giờ đầu tiên, hệ thống sẽ tự động lặp lại mỗi tháng
      </p>
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label class="block text-sm text-gray-600 mb-1">Ngày</label>
          <input type="date" id="monthlyDate" 
                 class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500">
        </div>
        <div>
          <label class="block text-sm text-gray-600 mb-1">Giờ</label>
          <input type="time" id="monthlyTime" value="10:00"
                 class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500">
        </div>
      </div>
      <p class="text-xs text-gray-500 mt-2">
        Ví dụ: Chọn 20/03/2026 10:00 → Deadline sẽ lặp lại: 20/04 10:00, 20/05 10:00, 20/06 10:00...
      </p>
    </div>

    <!-- Yearly Settings -->
    <div id="yearlySettings" class="bg-pink-50 p-4 rounded-lg border border-pink-200 hidden">
      <label class="block text-gray-700 font-semibold mb-2">Deadline hàng năm</label>
      <p class="text-sm text-gray-600 mb-3">
        💡 Chọn ngày giờ đầu tiên, hệ thống sẽ tự động lặp lại mỗi năm
      </p>
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label class="block text-sm text-gray-600 mb-1">Ngày</label>
          <input type="date" id="yearlyDate" 
                 class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500">
        </div>
        <div>
          <label class="block text-sm text-gray-600 mb-1">Giờ</label>
          <input type="time" id="yearlyTime" value="17:00"
                 class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500">
        </div>
      </div>
      <p class="text-xs text-gray-500 mt-2">
        Ví dụ: Chọn 20/03/2026 17:00 → Deadline sẽ lặp lại: 20/03/2027 17:00, 20/03/2028 17:00...
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
const yearlySettings = document.getElementById('yearlySettings');

recurringFrequency.addEventListener('change', () => {
  const frequency = recurringFrequency.value;
  
  // Hide all
  dailySettings.classList.add('hidden');
  weeklySettings.classList.add('hidden');
  monthlySettings.classList.add('hidden');
  yearlySettings.classList.add('hidden');
  
  // Show selected
  if (frequency === 'daily') dailySettings.classList.remove('hidden');
  if (frequency === 'weekly') weeklySettings.classList.remove('hidden');
  if (frequency === 'monthly') monthlySettings.classList.remove('hidden');
  if (frequency === 'yearly') yearlySettings.classList.remove('hidden');
  
  updateDeadlinePreview();
});

// Update preview when inputs change
document.getElementById('dailyTime').addEventListener('change', updateDeadlinePreview);
document.getElementById('weeklyDay').addEventListener('change', updateDeadlinePreview);
document.getElementById('weeklyTime').addEventListener('change', updateDeadlinePreview);
document.getElementById('monthlyDate').addEventListener('change', updateDeadlinePreview);
document.getElementById('monthlyTime').addEventListener('change', updateDeadlinePreview);
document.getElementById('yearlyDate').addEventListener('change', updateDeadlinePreview);
document.getElementById('yearlyTime').addEventListener('change', updateDeadlinePreview);

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
    const dateInput = document.getElementById('monthlyDate').value;
    const timeInput = document.getElementById('monthlyTime').value;
    
    if (!dateInput) {
      deadlinePreview.textContent = 'Vui lòng chọn ngày để xem preview';
      return;
    }
    
    // Parse user-selected date
    const selectedDate = new Date(dateInput + 'T' + timeInput);
    const dayOfMonth = selectedDate.getDate();
    
    // Calculate next deadline
    nextDeadline = new Date(selectedDate);
    
    // If selected date is in the past, move to next month
    while (nextDeadline <= now) {
      nextDeadline.setMonth(nextDeadline.getMonth() + 1);
    }
    
    deadlinePreview.textContent = `Deadline tiếp theo: ${nextDeadline.toLocaleString('vi-VN')} (Ngày ${dayOfMonth} hàng tháng lúc ${timeInput})`;
    
  } else if (frequency === 'yearly') {
    const dateInput = document.getElementById('yearlyDate').value;
    const timeInput = document.getElementById('yearlyTime').value;
    
    if (!dateInput) {
      deadlinePreview.textContent = 'Vui lòng chọn ngày để xem preview';
      return;
    }
    
    // Parse user-selected date
    const selectedDate = new Date(dateInput + 'T' + timeInput);
    const month = selectedDate.getMonth() + 1; // 1-12
    const day = selectedDate.getDate();
    
    // Calculate next deadline
    nextDeadline = new Date(selectedDate);
    
    // If selected date is in the past, move to next year
    while (nextDeadline <= now) {
      nextDeadline.setFullYear(nextDeadline.getFullYear() + 1);
    }
    
    deadlinePreview.textContent = `Deadline tiếp theo: ${nextDeadline.toLocaleString('vi-VN')} (Ngày ${day}/${month} hàng năm lúc ${timeInput})`;
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
    enum: ['daily', 'weekly', 'monthly', 'yearly'] 
  },
  
  pattern: {
    // For daily: just time
    time: String,  // "09:00"
    
    // For weekly: day + time
    dayOfWeek: Number,  // 0-6 (Sunday-Saturday)
    
    // For monthly: extracted from user's selected date
    dayOfMonth: Number,  // 1-31 (extracted từ monthlyDate input)
    
    // For yearly: extracted from user's selected date
    month: Number,  // 1-12 (extracted từ yearlyDate input)
    day: Number     // 1-31 (extracted từ yearlyDate input)
  }
}
```

**Logic xử lý:**
- **Monthly**: User chọn `2026-03-20` → Backend extract `dayOfMonth: 20` → Lặp lại ngày 20 mỗi tháng
- **Yearly**: User chọn `2026-03-20` → Backend extract `month: 3, day: 20` → Lặp lại ngày 20/3 mỗi năm

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
      // dayOfMonth extracted from user's selected date (1-31)
      nextDeadline.setDate(deadlinePattern.dayOfMonth);
      
      // If this month's deadline passed, move to next month
      if (nextDeadline <= now) {
        nextDeadline.setMonth(nextDeadline.getMonth() + 1);
      }
      
      // Handle edge case: if next month doesn't have this day (e.g., Feb 30)
      // JavaScript auto-adjusts to last day of month
      break;
      
    case 'yearly':
      // month and day extracted from user's selected date
      nextDeadline.setMonth(deadlinePattern.month - 1); // month is 1-based
      nextDeadline.setDate(deadlinePattern.day);
      
      // If this year's deadline passed, move to next year
      if (nextDeadline <= now) {
        nextDeadline.setFullYear(nextDeadline.getFullYear() + 1);
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
User chọn: 20/03/2026 10:00
Backend extract: dayOfMonth = 20

→ Deadline: 20/4/2026 10:00, 20/5/2026 10:00, 20/6/2026 10:00...
```

### 4. Đánh giá nhân sự hàng năm
```
Tần suất: Hàng năm
User chọn: 20/03/2026 17:00
Backend extract: month = 3, day = 20

→ Deadline: 20/3/2027 17:00, 20/3/2028 17:00, 20/3/2029 17:00...
```

---

## 🤖 LOGIC CHO AI IMPLEMENTATION

### Khái niệm UX - Input Pattern Đơn Giản Hóa

**Vấn đề:** User không muốn hiểu các khái niệm kỹ thuật như "dayOfMonth", "month + day"

**Giải pháp:** Dùng chung 1 pattern input quen thuộc cho tất cả loại recurring

#### Pattern Input Giống Nhau:

| Loại | Input UI | Ví dụ User Chọn |
|------|----------|-----------------|
| **Onetime** | `<input type="date">` + `<input type="time">` | 20/03/2026 14:00 |
| **Monthly** | `<input type="date">` + `<input type="time">` | 20/03/2026 10:00 ✅ SAME! |
| **Yearly** | `<input type="date">` + `<input type="time">` | 20/03/2026 17:00 ✅ SAME! |

### Backend Logic - Extract Pattern

**Frontend → Backend Data Flow:**

```javascript
// MONTHLY: User chọn trong date picker
monthlyDate = "2026-03-20"
monthlyTime = "10:00"

// Backend nhận được và extract
const selectedDate = new Date("2026-03-20T10:00");
const pattern = {
  dayOfMonth: selectedDate.getDate(), // 20
  time: "10:00"
};

// Lưu vào database
recurring: {
  enabled: true,
  frequency: 'monthly',
  pattern: { dayOfMonth: 20, time: "10:00" }
}

// Cron job sẽ tính deadline tiếp theo
// Tháng 4: setDate(20) → 20/04/2026 10:00
// Tháng 5: setDate(20) → 20/05/2026 10:00
```

```javascript
// YEARLY: User chọn trong date picker
yearlyDate = "2026-03-20"
yearlyTime = "17:00"

// Backend nhận được và extract
const selectedDate = new Date("2026-03-20T17:00");
const pattern = {
  month: selectedDate.getMonth() + 1, // 3 (1-based)
  day: selectedDate.getDate(),        // 20
  time: "17:00"
};

// Lưu vào database
recurring: {
  enabled: true,
  frequency: 'yearly',
  pattern: { month: 3, day: 20, time: "17:00" }
}

// Cron job sẽ tính deadline tiếp theo
// 2027: setMonth(2); setDate(20) → 20/03/2027 17:00
// 2028: setMonth(2); setDate(20) → 20/03/2028 17:00
```

### Khác Biệt Logic vs Onetime

| Aspect | Onetime | Monthly | Yearly |
|--------|---------|---------|--------|
| **User input** | Ngày/giờ cụ thể | Ngày/giờ LẦN ĐẦU | Ngày/giờ LẦN ĐẦU |
| **Lưu vào DB** | `deadline: Date` | `recurring.pattern.dayOfMonth` | `recurring.pattern.month + day` |
| **Tính deadline** | Không tính lại | Cron: lặp mỗi tháng | Cron: lặp mỗi năm |
| **Ý nghĩa date** | Thời điểm deadline | Template để extract pattern | Template để extract pattern |

### Edge Cases Cần Xử Lý

**1. Monthly - Ngày không tồn tại trong tháng:**
```javascript
// User chọn 31/03/2026 → dayOfMonth = 31
// Tháng 2 không có ngày 31
nextDeadline.setDate(31); // JavaScript auto-adjust → 28/02 (hoặc 29 nếu năm nhuận)
```

**2. Yearly - Ngày 29/2 (năm nhuận):**
```javascript
// User chọn 29/02/2024 (năm nhuận) → month=2, day=29
// 2025 không có 29/2
nextDeadline.setMonth(1); // Feb
nextDeadline.setDate(29); // JavaScript auto-adjust → 01/03/2025
```

**3. Selected date in the past:**
```javascript
// User chọn 15/03/2026 nhưng hôm nay là 20/03/2026
// Monthly: while (deadline <= now) → move to next month → 15/04/2026
// Yearly: while (deadline <= now) → move to next year → 15/03/2027
```

### Frontend Validation

```javascript
// Bắt buộc phải chọn date khi chọn Monthly/Yearly
if (frequency === 'monthly' || frequency === 'yearly') {
  const dateInput = document.getElementById(frequency === 'monthly' ? 'monthlyDate' : 'yearlyDate');
  
  if (!dateInput.value) {
    alert('Vui lòng chọn ngày để tiếp tục');
    return;
  }
}
```

### API Request Example

**Tạo Monthly Recurring Broadcast:**
```json
POST /api/broadcasts
{
  "title": "Chốt bảng chấm công",
  "description": "...",
  "priority": "high",
  "recurring": {
    "enabled": true,
    "frequency": "monthly",
    "pattern": {
      "dayOfMonth": 20,
      "time": "10:00"
    }
  },
  "assignedStores": ["store1", "store2"]
}
```

**Backend Extract từ Frontend Form:**
```javascript
// Frontend gửi
const formData = {
  monthlyDate: "2026-03-20",
  monthlyTime: "10:00"
};

// Backend controller extract
const selectedDate = new Date(formData.monthlyDate + 'T' + formData.monthlyTime);

const broadcastData = {
  recurring: {
    enabled: true,
    frequency: 'monthly',
    pattern: {
      dayOfMonth: selectedDate.getDate(), // 20
      time: formData.monthlyTime          // "10:00"
    }
  }
};
```

### Tóm Tắt Cho AI

✅ **User experience:** Đơn giản - chỉ chọn ngày/giờ như "Làm một lần", không cần hiểu technical terms  
✅ **Backend intelligence:** Tự động extract pattern (dayOfMonth cho monthly, month+day cho yearly)  
✅ **Consistent UI:** Cùng 1 loại input `<input type="date">` + `<input type="time">` cho 3 use cases  
✅ **Edge case handling:** JavaScript Date auto-adjust cho tháng không có đủ ngày  
✅ **Preview realtime:** User thấy ngay deadline tiếp theo sẽ là khi nào

