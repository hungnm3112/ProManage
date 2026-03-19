# Recurring Deadline Logic - UI & Implementation

## 📂 Files trong thư mục này

### 1. `ui-visual-comparison.md` ⭐ BẮT ĐẦU TẠI ĐÂY
So sánh trực quan **Radio Button vs Dropdown** với wireframes chi tiết.
- 📊 Visual comparison
- 🎨 Wireframes cho cả 5 loại công việc
- 🎯 **Khuyến nghị: DROPDOWN** (gọn, scale tốt với 5 options)

### 2. `ui-design-unified.md`
Chi tiết **Phương án 1: Radio Button UI**
- Layout với radio selection
- HTML code hoàn chỉnh
- User flows

### 3. `ui-design-dropdown.md`
Chi tiết **Phương án 2: Dropdown UI** (ĐƯỢC CHỌN)
- Layout với dropdown selector
- HTML + JavaScript code
- Accessibility considerations

### 4. `recurring-deadline-pattern.md`
Chi tiết về **Deadline Pattern Logic**
- Daily/Weekly/Monthly/Yearly patterns
- Backend schema structure
- Examples

### 5. `recurring-implementation-plan.md`
**Implementation Plan** với code đầy đủ
- Phase-by-phase implementation
- Backend schema (Broadcast model)
- Recurring service (calculate deadline, clone broadcast)
- Cron job setup

---

## 🎯 Logic đã được xác định lại: 5 LOẠI CÔNG VIỆC

## 🎯 Logic đã được xác định lại: 5 LOẠI CÔNG VIỆC

### 1️⃣ Làm một lần (One-time)
**Logic**: Deadline cố định, không lặp lại

**Pattern**: 
```javascript
{
  type: "onetime",
  deadline: Date  // VD: 2026-03-18T14:00:00
}
```

**Use case**: Họp đột xuất, sự kiện đặc biệt, dự án có thời hạn cụ thể

---

### 2️⃣ Lặp hàng ngày (Daily Recurring)
**Logic**: Cố định **giờ** mỗi ngày

**Pattern**: 
```javascript
{
  type: "daily",
  pattern: {
    time: "09:00"  // HH:mm
  }
}
```

**Use case**: 
- Thực hiện 5S lúc 9:00 mỗi ngày
- Kiểm tra vệ sinh lúc 17:00 mỗi ngày

**Deadline tiếp theo**: Hôm nay hoặc ngày mai lúc 09:00 (tùy giờ hiện tại)

---

### 3️⃣ Lặp hàng tuần (Weekly Recurring)
**Logic**: Cố định **thứ + giờ** mỗi tuần

**Pattern**: 
```javascript
{
  type: "weekly",
  pattern: {
    dayOfWeek: 6,    // 0=CN, 1=T2, ..., 6=T7
    time: "17:00"
  }
}
```

**Use case**: 
- Kiểm kho vào thứ 7 lúc 17:00
- Họp team vào thứ 2 lúc 9:00

**Deadline tiếp theo**: Thứ 7 tuần này hoặc tuần sau (tùy thời điểm hiện tại)

---

### 4️⃣ Lặp hàng tháng (Monthly Recurring)
**Logic**: Cố định **ngày + giờ** mỗi tháng

**Pattern**: 
```javascript
{
  type: "monthly",
  pattern: {
    dayOfMonth: 2,     // 1-31 hoặc "last"
    time: "10:00"
  }
}
```

**Use case**: 
- Chấm công vào ngày 2 lúc 10:00 hàng tháng
- Báo cáo cuối tháng (dayOfMonth: "last")

**Deadline tiếp theo**: Ngày 2 tháng này hoặc tháng sau

---

### 5️⃣ Lặp hàng năm (Yearly Recurring) ⭐ MỚI
**Logic**: Cố định **tháng + ngày + giờ** mỗi năm

**Pattern**: 
```javascript
{
  type: "yearly",
  pattern: {
    month: 1,          // 1-12
    dayOfMonth: 15,    // 1-31 hoặc "last"
    time: "17:00"
  }
}
```

**Use case**: 
- Kiểm kê cuối năm: 30/12 lúc 17:00
- Đánh giá nhân viên: 15/01 lúc 9:00
- Lập kế hoạch năm: Ngày cuối tháng 12

**Deadline tiếp theo**: 15/01/2027 17:00 (nếu năm nay đã qua)

---

## 🎨 UI Design Đã Chọn: DROPDOWN

### Tại sao chọn Dropdown thay vì Radio Button?

1. **5 options**: Dropdown gọn hơn Radio (không chiếm quá nhiều vertical space)
2. **Professional**: Phù hợp với business application
3. **Scale tốt**: Dễ thêm options mới nếu cần
4. **Rõ ràng**: Có label "Loại công việc" và preview section lớn

### UI Flow:

```
[Loại công việc: Lặp hàng ngày ▼]
                 ├─ Làm một lần
                 ├─ Lặp hàng ngày     ✓
                 ├─ Lặp hàng tuần
                 ├─ Lặp hàng tháng
                 └─ Lặp hàng năm

┌─────────────────────────────────────┐
│ ⏰ Mỗi ngày lúc: [09:00]             │
│ 💡 VD: 5S lúc 9h sáng mỗi ngày       │
│                                      │
│ 🔮 17/03/2026 09:00                  │
│    (Hàng ngày lúc 09:00)             │
└─────────────────────────────────────┘
```

---

## 📊 Bảng Use Cases Đầy Đủ

| Công việc | Loại | Pattern | Deadline Result |
|-----------|------|---------|----------------|
| Họp đột xuất | One-time | 18/03/2026 14:00 | 18/03/2026 14:00 (1 lần) |
| Thực hiện 5S | Daily | 09:00 | Mỗi ngày 9:00 sáng |
| Vệ sinh cuối ngày | Daily | 17:30 | Mỗi ngày 17:30 |
| Họp team | Weekly | Thứ 2, 09:00 | Thứ 2 hàng tuần 9:00 |
| Kiểm kho | Weekly | Thứ 7, 17:00 | Thứ 7 hàng tuần 17:00 |
| Chấm công | Monthly | Ngày 2, 10:00 | Ngày 2 hàng tháng 10:00 |
| Báo cáo cuối tháng | Monthly | Cuối tháng, 18:00 | Ngày cuối tháng 18:00 |
| **Kiểm kê cuối năm** | **Yearly** | **30/12, 17:00** | **30/12 hàng năm 17:00** |
| **Đánh giá năm** | **Yearly** | **15/01, 09:00** | **15/01 hàng năm 09:00** |
| **Lập kế hoạch** | **Yearly** | **Cuối tháng 12, 14:00** | **Ngày cuối 12 hàng năm** |

---

## 🚀 Next Steps

### 1. Review UI Design
Xem file **`ui-visual-comparison.md`** để xem wireframes chi tiết

### 2. Start Implementation
Xem file **`recurring-implementation-plan.md`** để bắt đầu code:
- **Phase 1**: Update UI (admin dashboard)
- **Phase 2**: Update JavaScript (dropdown logic + preview)
- **Phase 3**: Update Backend Model (Broadcast schema with yearly support)
- **Phase 4**: Create Recurring Service (calculate deadline for all 5 types)
- **Phase 5**: Setup Cron Job (auto-create recurring tasks)

---

## ✅ Improvements từ thiết kế cũ

| Vấn đề cũ | Giải pháp mới |
|-----------|---------------|
| Tách deadline và recurring thành 2 phần | ✅ Thống nhất trong 1 section "Thời hạn hoàn thành" |
| Chỉ có 3 loại (daily/weekly/monthly) | ✅ Thêm One-time + Yearly (tổng 5 loại) |
| Radio button dài dòng | ✅ Dropdown gọn gàng, professional |
| Không có preview rõ ràng | ✅ Preview section lớn với icon 🔮 |
| Thiếu ví dụ minh họa | ✅ Mỗi pattern có 💡 example text |

