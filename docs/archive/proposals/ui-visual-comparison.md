# Visual Comparison: Radio vs Dropdown

## 📊 Xem nhanh 2 phương án

### PHƯƠNG ÁN A: RADIO BUTTON

```
┌──────────────────────────────────────────┐
│ ⏰ Thời hạn hoàn thành (Deadline)         │
├──────────────────────────────────────────┤
│                                          │
│ ○ Làm một lần          ← CHỌN TẠI ĐÂY   │
│ ● Lặp lại định kỳ                        │
│                                          │
│ ┌──────────────────────────────────────┐ │
│ │ Tần suất: [Hàng ngày ▼]              │ │
│ │                                       │ │  
│ │ ⏰ Mỗi ngày lúc: [09:00]              │ │
│ │ 💡 VD: 5S lúc 9h sáng mỗi ngày        │ │
│ │                                       │ │
│ │ 🔮 17/03/2026 09:00                   │ │
│ └──────────────────────────────────────┘ │
└──────────────────────────────────────────┘

✅ Ưu: Scan nhanh, rõ ràng
❌ Nhược: Chiếm nhiều space nếu có nhiều options
```

### PHƯƠNG ÁN B: DROPDOWN (KHUYẾN NGHỊ)

```
┌──────────────────────────────────────────┐
│ ⏰ Thời hạn hoàn thành (Deadline)         │
├──────────────────────────────────────────┤
│                                          │
│ Loại: [Lặp hàng ngày ▼]  ← CHỌN TẠI ĐÂY │
│       │                                  │
│       ├─ Làm một lần                     │
│       ├─ Lặp hàng ngày       ✓           │
│       ├─ Lặp hàng tuần                   │
│       ├─ Lặp hàng tháng                  │
│       └─ Lặp hàng năm                    │
│                                          │
│ ┌──────────────────────────────────────┐ │
│ │ ⏰ Mỗi ngày lúc: [09:00]              │ │
│ │ 💡 VD: 5S lúc 9h sáng mỗi ngày        │ │
│ │                                       │ │
│ │ 🔮 17/03/2026 09:00                   │ │
│ └──────────────────────────────────────┘ │
└──────────────────────────────────────────┘

✅ Ưu: Gọn, scale tốt với nhiều options
❌ Nhược: Cần 2 clicks (mở + chọn)
```

---

## 🎯 Khuyến nghị cuối cùng

### ⭐ **PHƯƠNG ÁN B: DROPDOWN**

### Lý do:

1. **5 options** (one-time, daily, weekly, monthly, yearly) → Dropdown phù hợp hơn Radio
2. **Gọn gàng**: Không chiếm quá nhiều vertical space
3. **Rõ ràng**: Với label "Loại công việc" và preview section
4. **Professional**: Phù hợp với business app

---

## 📐 Wireframe chi tiết

### Khi chọn "Làm một lần":
```
┌─────────────────────────────────────────────────────┐
│ Loại: [Làm một lần ▼]                                │
│                                                      │
│ ┌────────────────────────────────────────────────┐  │
│ │ 📅 Chọn deadline                                │  │
│ │                                                 │  │
│ │ Ngày: [18/03/2026]  Giờ: [14:00]               │  │
│ │                                                 │  │
│ │ 🔮 Thứ 4, 18/03/2026 14:00                      │  │
│ └────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────┘
```

### Khi chọn "Lặp hàng ngày":
```
┌─────────────────────────────────────────────────────┐
│ Loại: [Lặp hàng ngày ▼]                              │
│                                                      │
│ ┌────────────────────────────────────────────────┐  │
│ │ ⏰ Deadline hàng ngày                           │  │
│ │                                                 │  │
│ │ Mỗi ngày lúc: [09:00]                           │  │
│ │ 💡 VD: Thực hiện 5S lúc 9h sáng mỗi ngày        │  │
│ │                                                 │  │
│ │ 🔮 17/03/2026 09:00 (Hàng ngày lúc 09:00)       │  │
│ └────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────┘
```

### Khi chọn "Lặp hàng tuần":
```
┌─────────────────────────────────────────────────────┐
│ Loại: [Lặp hàng tuần ▼]                              │
│                                                      │
│ ┌────────────────────────────────────────────────┐  │
│ │ 📅 Deadline hàng tuần                           │  │
│ │                                                 │  │
│ │ Ngày: [Thứ 7 ▼]     Giờ: [17:00]               │  │
│ │ 💡 VD: Kiểm kho vào thứ 7 lúc 17:00 hàng tuần   │  │
│ │                                                 │  │
│ │ 🔮 22/03/2026 17:00 (Thứ 7 hàng tuần)           │  │
│ └────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────┘
```

### Khi chọn "Lặp hàng tháng":
```
┌─────────────────────────────────────────────────────┐
│ Loại: [Lặp hàng tháng ▼]                             │
│                                                      │
│ ┌────────────────────────────────────────────────┐  │
│ │ 📆 Deadline hàng tháng                          │  │
│ │                                                 │  │
│ │ Ngày: [Ngày 2 ▼]    Giờ: [10:00]               │  │
│ │ 💡 VD: Chấm công vào ngày 2 lúc 10h hàng tháng  │  │
│ │                                                 │  │
│ │ 🔮 02/04/2026 10:00 (Ngày 2 hàng tháng)         │  │
│ └────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────┘
```

### Khi chọn "Lặp hàng năm":
```
┌─────────────────────────────────────────────────────┐
│ Loại: [Lặp hàng năm ▼]                               │
│                                                      │
│ ┌────────────────────────────────────────────────┐  │
│ │ 🗓️ Deadline hàng năm                            │  │
│ │                                                 │  │
│ │ Tháng: [Tháng 1 ▼]  Ngày: [15 ▼]  Giờ: [17:00] │  │
│ │ 💡 VD: Đánh giá năm vào 15/01 lúc 17h hàng năm  │  │
│ │                                                 │  │
│ │ 🔮 15/01/2027 17:00 (Ngày 15/01 hàng năm)       │  │
│ └────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────┘
```

---

## 🎨 Color Coding

```css
/* One-time: Blue background */
.onetime-section {
  background: #EFF6FF; /* blue-50 */
  border: 1px solid #BFDBFE; /* blue-200 */
}

/* Recurring: Green background */
.recurring-section {
  background: #F0FDF4; /* green-50 */
  border: 1px solid #BBF7D0; /* green-200 */
}

/* Preview: Purple background */
.preview-section {
  background: #FAF5FF; /* purple-50 */
  border: 1px solid #E9D5FF; /* purple-200 */
}
```

---

## 📱 Responsive Considerations

### Desktop (> 768px)
- Dropdown full width
- Pattern inputs: Grid 2-3 columns
- Preview section: Prominent

### Mobile (< 768px)
- Dropdown full width
- Pattern inputs: Stack vertically (1 column)
- Preview: Sticky bottom (optional)

---

## ♿ Accessibility

```html
<!-- Proper labels -->
<label for="taskTypeDropdown" class="...">
  Loại công việc
</label>
<select id="taskTypeDropdown" 
        aria-label="Chọn loại công việc"
        ...>
  <option value="onetime">Làm một lần</option>
  ...
</select>

<!-- ARIA live region for preview -->
<div role="status" aria-live="polite" id="deadlinePreview">
  <!-- Preview text -->
</div>
```

---

## ✅ Kết luận

**Implement Phương án B (Dropdown)** với các tính năng:

1. ✅ Dropdown selector với 5 options
2. ✅ Conditional UI cho từng loại
3. ✅ Preview section rõ ràng với icon 🔮
4. ✅ Color coding (Blue: one-time, Green: recurring, Purple: preview)
5. ✅ Example text (💡) cho mỗi pattern
6. ✅ Responsive design
7. ✅ Accessible markup

