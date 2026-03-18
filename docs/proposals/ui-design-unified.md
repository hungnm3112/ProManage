# UI Design - Unified Deadline & Recurring Logic

## 🎯 Logic được thiết kế lại

### 5 Loại công việc:

1. **Làm một lần (One-time)**: Deadline cố định, không lặp
2. **Lặp hàng ngày (Daily)**: Cố định giờ mỗi ngày
3. **Lặp hàng tuần (Weekly)**: Cố định thứ + giờ mỗi tuần
4. **Lặp hàng tháng (Monthly)**: Cố định ngày + giờ mỗi tháng
5. **Lặp hàng năm (Yearly)** ⭐ MỚI: Cố định ngày/tháng + giờ mỗi năm

---

## 🎨 UI Design - Phương án 1: RADIO BUTTON (Khuyến nghị)

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
│ ▢ ○ Làm một lần                                                     │
│ ▢   Deadline: [18/03/2026] [14:00]                                  │
│ ▢   🔮 Preview: Thứ 4, 18/03/2026 14:00                             │
│                                                                      │
│ ▢ ● Lặp lại định kỳ                                                 │
│ ▢   Tần suất: [Hàng ngày ▼]                                         │
│ ▢                                                                    │
│ ▢   ⏰ Mỗi ngày lúc: [09:00]                                         │
│ ▢   💡 VD: Thực hiện 5S lúc 9:00 sáng mỗi ngày                       │
│ ▢                                                                    │
│ ▢   🔮 Deadline tiếp theo: Thứ 2, 17/03/2026 09:00                   │
│ ▢      (Hàng ngày lúc 09:00)                                        │
└─────────────────────────────────────────────────────────────────────┘
[💾 Lưu công việc]  [❌ Hủy]
```

### HTML Code:

```html
<!-- Deadline Section - UNIFIED -->
<div class="space-y-4">
  <!-- Section Header -->
  <div class="border-b pb-2">
    <h3 class="text-lg font-semibold text-gray-800">
      ⏰ Thời hạn hoàn thành (Deadline)
    </h3>
  </div>

  <!-- Task Type Selection -->
  <div class="space-y-3">
    <label class="block">
      <input type="radio" name="taskType" value="onetime" checked
             class="w-4 h-4 text-purple-600 focus:ring-purple-500">
      <span class="ml-2 font-medium text-gray-800">Làm một lần</span>
    </label>
    
    <label class="block">
      <input type="radio" name="taskType" value="recurring"
             class="w-4 h-4 text-purple-600 focus:ring-purple-500">
      <span class="ml-2 font-medium text-gray-800">Lặp lại định kỳ</span>
    </label>
  </div>

  <!-- ONE-TIME SETTINGS -->
  <div id="onetimeSettings" class="bg-blue-50 p-4 rounded-lg border border-blue-200">
    <label class="block text-sm font-semibold text-gray-700 mb-3">
      Chọn deadline
    </label>
    
    <div class="grid grid-cols-2 gap-3">
      <div>
        <label class="block text-xs text-gray-600 mb-1">Ngày</label>
        <input type="date" id="onetimeDate" 
               class="w-full px-3 py-2 border border-gray-300 rounded-lg 
                      focus:ring-2 focus:ring-purple-500 focus:border-transparent">
      </div>
      <div>
        <label class="block text-xs text-gray-600 mb-1">Giờ</label>
        <input type="time" id="onetimeTime" value="14:00"
               class="w-full px-3 py-2 border border-gray-300 rounded-lg 
                      focus:ring-2 focus:ring-purple-500 focus:border-transparent">
      </div>
    </div>

    <!-- Preview -->
    <div class="mt-3 bg-white p-2 rounded border border-blue-300">
      <p class="text-xs text-gray-600">🔮 Preview:</p>
      <p id="onetimePreview" class="text-sm font-medium text-purple-700">
        <!-- Updated by JS -->
      </p>
    </div>
  </div>

  <!-- RECURRING SETTINGS -->
  <div id="recurringSettings" class="bg-green-50 p-4 rounded-lg border border-green-200 hidden">
    <!-- Frequency Selector -->
    <div class="mb-4">
      <label class="block text-sm font-semibold text-gray-700 mb-2">
        Tần suất
      </label>
      <select id="recurringFrequency" 
              class="w-full px-4 py-2 border border-gray-300 rounded-lg 
                     focus:ring-2 focus:ring-purple-500">
        <option value="daily">Hàng ngày (Daily)</option>
        <option value="weekly">Hàng tuần (Weekly)</option>
        <option value="monthly">Hàng tháng (Monthly)</option>
        <option value="yearly">Hàng năm (Yearly)</option>
      </select>
    </div>

    <!-- DAILY PATTERN -->
    <div id="dailyPattern" class="space-y-2">
      <label class="block text-sm font-semibold text-gray-700">
        ⏰ Deadline hàng ngày
      </label>
      <div class="flex items-center gap-3">
        <span class="text-gray-700">Mỗi ngày lúc:</span>
        <input type="time" id="dailyTime" value="09:00"
               class="px-3 py-2 border border-gray-300 rounded-lg">
      </div>
      <p class="text-xs text-gray-600 italic">
        💡 Ví dụ: Thực hiện 5S lúc 9:00 sáng mỗi ngày
      </p>
    </div>

    <!-- WEEKLY PATTERN -->
    <div id="weeklyPattern" class="space-y-2 hidden">
      <label class="block text-sm font-semibold text-gray-700">
        📅 Deadline hàng tuần
      </label>
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
      <p class="text-xs text-gray-600 italic">
        💡 Ví dụ: Kiểm kho vào thứ 7 lúc 17:00 hàng tuần
      </p>
    </div>

    <!-- MONTHLY PATTERN -->
    <div id="monthlyPattern" class="space-y-2 hidden">
      <label class="block text-sm font-semibold text-gray-700">
        📆 Deadline hàng tháng
      </label>
      <div class="grid grid-cols-2 gap-3">
        <div>
          <label class="block text-xs text-gray-600 mb-1">Ngày trong tháng</label>
          <select id="monthlyDay" class="w-full px-3 py-2 border rounded-lg">
            <option value="1">Ngày 1</option>
            <option value="2" selected>Ngày 2</option>
            <option value="3">Ngày 3</option>
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
      <p class="text-xs text-gray-600 italic">
        💡 Ví dụ: Chốt bảng chấm công vào ngày 2 lúc 10:00 hàng tháng
      </p>
    </div>

    <!-- YEARLY PATTERN (NEW) -->
    <div id="yearlyPattern" class="space-y-2 hidden">
      <label class="block text-sm font-semibold text-gray-700">
        🗓️ Deadline hàng năm
      </label>
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
      <p class="text-xs text-gray-600 italic">
        💡 Ví dụ: Đánh giá năm vào ngày 15/01 lúc 17:00 hàng năm
      </p>
    </div>

    <!-- Recurring Preview -->
    <div class="mt-4 bg-white p-3 rounded border border-green-300">
      <p class="text-xs font-semibold text-gray-600 mb-1">
        🔮 Deadline tiếp theo:
      </p>
      <p id="recurringPreview" class="text-sm font-medium text-purple-700">
        <!-- Updated by JS -->
      </p>
    </div>
  </div>
</div>
```

---

## 📊 So sánh 2 phương án UI

| Tiêu chí | **Phương án 1: Radio Button** | **Phương án 2: Dropdown** |
|----------|-------------------------------|---------------------------|
| **Trực quan** | ⭐⭐⭐⭐⭐ Rõ ràng | ⭐⭐⭐⭐ Tốt |
| **Clicks cần thiết** | 1 click (chọn radio) | 2 clicks (mở dropdown, chọn) |
| **UI feedback** | Rõ ràng (radio selected) | Ít trực quan hơn |
| **Dễ hiểu** | ⭐⭐⭐⭐⭐ Rất dễ | ⭐⭐⭐⭐ Dễ |
| **Space usage** | Dọc hơn | Gọn hơn |

---

## 🎯 Khuyến nghị: **Phương án 1 - Radio Button**

### Lý do:

1. **User flow tự nhiên hơn**:
   - Bước 1: Chọn loại (One-time hoặc Recurring)
   - Bước 2: Cấu hình chi tiết

2. **Visual feedback rõ ràng**:
   - Radio button cho thấy selection hiện tại
   - Section tương ứng highlight (blue/green background)

3. **Ít confusion**:
   - Không bị nhầm lẫn giữa "deadline" và "recurring"
   - Concept thống nhất: Cả 2 đều là về "Thời hạn hoàn thành"

---

## 🔄 User Flows

### Flow 1: Tạo công việc 1 lần
```
1. [●] Làm một lần
2. Chọn ngày: 18/03/2026
3. Chọn giờ: 14:00
4. Preview: "Thứ 4, 18/03/2026 14:00"
5. Lưu
```

### Flow 2: Tạo công việc lặp hàng ngày
```
1. [●] Lặp lại định kỳ
2. Tần suất: Hàng ngày
3. Giờ: 09:00
4. Preview: "17/03/2026 09:00 (Hàng ngày lúc 09:00)"
5. Lưu
```

### Flow 3: Tạo công việc lặp hàng năm (mới)
```
1. [●] Lặp lại định kỳ
2. Tần suất: Hàng năm
3. Tháng: Tháng 1
4. Ngày: Ngày 15
5. Giờ: 17:00
6. Preview: "15/01/2027 17:00 (Ngày 15/01 hàng năm)"
7. Lưu
```

---

## 📋 Use Cases với Yearly

| Công việc | Loại | Pattern | Deadline |
|-----------|------|---------|----------|
| Báo cáo tuần | Weekly | Thứ 6, 16:00 | Thứ 6 hàng tuần 16:00 |
| Chấm công tháng | Monthly | Ngày 2, 10:00 | Ngày 2 hàng tháng 10:00 |
| **Kiểm kê cuối năm** | **Yearly** | **30/12, 17:00** | **30/12 hàng năm 17:00** |
| **Đánh giá nhân viên** | **Yearly** | **15/01, 09:00** | **15/01 hàng năm 09:00** |
| **Lập kế hoạch năm** | **Yearly** | **Cuối tháng 12, 14:00** | **Ngày cuối tháng 12 hàng năm** |

