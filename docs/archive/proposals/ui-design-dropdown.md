# Phương án 2: Dropdown Selector (Thay thế)

## 🎨 UI Design - Dropdown Approach

### Layout:

```html
┌─────────────────────────────────────────────────────────────────────┐
│ 📋 Thông tin công việc                                               │
├─────────────────────────────────────────────────────────────────────┤
│ Tiêu đề: [________________________________]                          │
│ Mô tả:   [________________________________]                          │
│ Ưu tiên: [Trung bình ▼]                                             │
├─────────────────────────────────────────────────────────────────────┤
│ ⏰ Thời hạn hoàn thành (Deadline)                                    │
│                                                                      │
│ Loại công việc: [Lặp hàng ngày ▼]                                   │
│                  ├─ Làm một lần                                      │
│                  ├─ Lặp hàng ngày                                    │
│                  ├─ Lặp hàng tuần                                    │
│                  ├─ Lặp hàng tháng                                   │
│                  └─ Lặp hàng năm                                     │
│                                                                      │
│ ⏰ Mỗi ngày lúc: [09:00]                                             │
│ 💡 VD: Thực hiện 5S lúc 9:00 sáng mỗi ngày                           │
│                                                                      │
│ 🔮 Deadline tiếp theo: Thứ 2, 17/03/2026 09:00                       │
│    (Hàng ngày lúc 09:00)                                            │
└─────────────────────────────────────────────────────────────────────┘
[💾 Lưu công việc]  [❌ Hủy]
```

### HTML Code:

```html
<!-- Deadline Section - DROPDOWN APPROACH -->
<div class="space-y-4">
  <!-- Section Header -->
  <div class="border-b pb-2">
    <h3 class="text-lg font-semibold text-gray-800">
      ⏰ Thời hạn hoàn thành (Deadline)
    </h3>
  </div>

  <!-- Task Type Dropdown -->
  <div>
    <label class="block text-sm font-semibold text-gray-700 mb-2">
      Loại công việc
    </label>
    <select id="taskTypeDropdown" 
            class="w-full px-4 py-2 border border-gray-300 rounded-lg 
                   focus:ring-2 focus:ring-purple-500 text-base">
      <option value="onetime">Làm một lần</option>
      <option value="daily" selected>Lặp hàng ngày</option>
      <option value="weekly">Lặp hàng tuần</option>
      <option value="monthly">Lặp hàng tháng</option>
      <option value="yearly">Lặp hàng năm</option>
    </select>
  </div>

  <!-- ONE-TIME SETTINGS -->
  <div id="onetimeSettings" class="bg-blue-50 p-4 rounded-lg border border-blue-200 hidden">
    <div class="grid grid-cols-2 gap-3">
      <div>
        <label class="block text-xs text-gray-600 mb-1">Ngày</label>
        <input type="date" id="onetimeDate" 
               class="w-full px-3 py-2 border rounded-lg">
      </div>
      <div>
        <label class="block text-xs text-gray-600 mb-1">Giờ</label>
        <input type="time" id="onetimeTime" value="14:00"
               class="w-full px-3 py-2 border rounded-lg">
      </div>
    </div>
    <div class="mt-3 bg-white p-2 rounded">
      <p class="text-xs text-gray-600">🔮 Deadline:</p>
      <p id="onetimePreview" class="text-sm font-medium text-purple-700"></p>
    </div>
  </div>

  <!-- DAILY SETTINGS -->
  <div id="dailySettings" class="bg-green-50 p-4 rounded-lg border border-green-200">
    <div class="flex items-center gap-3">
      <span class="text-gray-700">Mỗi ngày lúc:</span>
      <input type="time" id="dailyTime" value="09:00"
             class="px-3 py-2 border rounded-lg">
    </div>
    <p class="text-xs text-gray-600 italic mt-2">
      💡 Ví dụ: Thực hiện 5S lúc 9:00 sáng mỗi ngày
    </p>
  </div>

  <!-- WEEKLY SETTINGS -->
  <div id="weeklySettings" class="bg-green-50 p-4 rounded-lg border border-green-200 hidden">
    <div class="grid grid-cols-2 gap-3">
      <div>
        <label class="block text-xs text-gray-600 mb-1">Ngày trong tuần</label>
        <select id="weeklyDay" class="w-full px-3 py-2 border rounded-lg">
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
               class="w-full px-3 py-2 border rounded-lg">
      </div>
    </div>
    <p class="text-xs text-gray-600 italic mt-2">
      💡 Ví dụ: Kiểm kho vào thứ 7 lúc 17:00 hàng tuần
    </p>
  </div>

  <!-- MONTHLY SETTINGS -->
  <div id="monthlySettings" class="bg-green-50 p-4 rounded-lg border border-green-200 hidden">
    <div class="grid grid-cols-2 gap-3">
      <div>
        <label class="block text-xs text-gray-600 mb-1">Ngày trong tháng</label>
        <select id="monthlyDay" class="w-full px-3 py-2 border rounded-lg">
          <option value="1">Ngày 1</option>
          <option value="2" selected>Ngày 2</option>
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
               class="w-full px-3 py-2 border rounded-lg">
      </div>
    </div>
    <p class="text-xs text-gray-600 italic mt-2">
      💡 Ví dụ: Chốt bảng chấm công vào ngày 2 lúc 10:00 hàng tháng
    </p>
  </div>

  <!-- YEARLY SETTINGS -->
  <div id="yearlySettings" class="bg-green-50 p-4 rounded-lg border border-green-200 hidden">
    <div class="grid grid-cols-3 gap-3">
      <div>
        <label class="block text-xs text-gray-600 mb-1">Tháng</label>
        <select id="yearlyMonth" class="w-full px-3 py-2 border rounded-lg">
          <option value="1" selected>Tháng 1</option>
          <option value="2">Tháng 2</option>
          <option value="3">Tháng 3</option>
          <option value="4">Tháng 4</option>
          <option value="5">Tháng 5</option>
          <option value="6">Tháng 6</option>
          <option value="7">Tháng 7</option>
          <option value="8">Tháng 8</option>
          <option value="9">Tháng 9</option>
          <option value="10">Tháng 10</option>
          <option value="11">Tháng 11</option>
          <option value="12">Tháng 12</option>
        </select>
      </div>
      <div>
        <label class="block text-xs text-gray-600 mb-1">Ngày</label>
        <select id="yearlyDay" class="w-full px-3 py-2 border rounded-lg">
          <option value="1">Ngày 1</option>
          <option value="15" selected>Ngày 15</option>
          <option value="last">Ngày cuối tháng</option>
        </select>
      </div>
      <div>
        <label class="block text-xs text-gray-600 mb-1">Giờ</label>
        <input type="time" id="yearlyTime" value="17:00"
               class="w-full px-3 py-2 border rounded-lg">
      </div>
    </div>
    <p class="text-xs text-gray-600 italic mt-2">
      💡 Ví dụ: Đánh giá năm vào ngày 15/01 lúc 17:00 hàng năm
    </p>
  </div>

  <!-- Unified Preview -->
  <div class="bg-purple-50 p-3 rounded-lg border border-purple-200">
    <p class="text-xs font-semibold text-gray-600 mb-1">
      🔮 Deadline tiếp theo:
    </p>
    <p id="deadlinePreview" class="text-sm font-medium text-purple-700">
      <!-- Updated by JS -->
    </p>
  </div>
</div>
```

### JavaScript Logic:

```javascript
const taskTypeDropdown = document.getElementById('taskTypeDropdown');
const onetimeSettings = document.getElementById('onetimeSettings');
const dailySettings = document.getElementById('dailySettings');
const weeklySettings = document.getElementById('weeklySettings');
const monthlySettings = document.getElementById('monthlySettings');
const yearlySettings = document.getElementById('yearlySettings');

taskTypeDropdown.addEventListener('change', () => {
  const type = taskTypeDropdown.value;
  
  // Hide all
  onetimeSettings.classList.add('hidden');
  dailySettings.classList.add('hidden');
  weeklySettings.classList.add('hidden');
  monthlySettings.classList.add('hidden');
  yearlySettings.classList.add('hidden');
  
  // Show selected
  switch(type) {
    case 'onetime':
      onetimeSettings.classList.remove('hidden');
      break;
    case 'daily':
      dailySettings.classList.remove('hidden');
      break;
    case 'weekly':
      weeklySettings.classList.remove('hidden');
      break;
    case 'monthly':
      monthlySettings.classList.remove('hidden');
      break;
    case 'yearly':
      yearlySettings.classList.remove('hidden');
      break;
  }
  
  updateDeadlinePreview();
});
```

---

## ⚖️ So sánh Dropdown vs Radio

| Ưu điểm | Radio Button | Dropdown |
|---------|--------------|----------|
| Dễ scan options | ✅ Nhìn thấy tất cả | ❌ Phải click mở |
| Gọn UI | ❌ Dài hơn | ✅ Compact |
| Selection rõ ràng | ✅ Visual feedback | ⚠️ Chỉ hiện text |
| Số clicks | ✅ 1 click | ❌ 2 clicks |
| Accessibility | ✅ Dễ dùng hơn | ⚠️ Cần keyboard nav |

## 🎯 Kết luận

**Nếu chỉ có 2 options**: Radio tốt hơn
**Nếu có 5 options** (như case này): **Dropdown có thể phù hợp hơn** vì:
- Không chiếm nhiều không gian
- 5 options trong radio hơi dài
- Dropdown vẫn đủ rõ ràng với label tốt

## 💡 Recommendation

Sử dụng **Dropdown** với improvements:
- Label rõ ràng: "Loại công việc"
- Icons trong dropdown options (nếu có thể)
- Preview section lớn và rõ ràng
- Màu sắc phân biệt (blue cho one-time, green cho recurring)

