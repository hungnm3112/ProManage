# UI Development Guidelines - ProManage

## 🌐 Ngôn ngữ (Language)

### ✅ QUY TẮC BẮT BUỘC: 100% TIẾNG VIỆT

**Tất cả text hiển thị trên UI PHẢI là tiếng Việt**, bao gồm:

- ✅ Labels, buttons, headings
- ✅ Placeholder text trong input fields
- ✅ Error messages, warning messages
- ✅ Success messages, info messages
- ✅ Tooltips, help text
- ✅ Dropdown options
- ✅ Table headers, table data
- ✅ Modal titles, modal content
- ✅ Form validation messages
- ✅ Notification text
- ✅ Status text (draft, active, completed...)

### ❌ Những gì KHÔNG nên dùng tiếng Anh:

```html
<!-- ❌ SAI -->
<button>Create Task</button>
<label>Deadline:</label>
<option value="daily">Daily</option>
<p class="error">Invalid input</p>

<!-- ✅ ĐÚNG -->
<button>Tạo công việc</button>
<label>Thời hạn:</label>
<option value="daily">Hàng ngày</option>
<p class="error">Dữ liệu không hợp lệ</p>
```

### 📝 Ngoại lệ (Exceptions)

Chỉ giữ tiếng Anh cho:
- Code variables: `taskType`, `deadline`, `isRecurring`
- HTML attributes: `id`, `class`, `name`, `value`
- API endpoints: `/api/broadcasts`
- Console logs cho developer: `console.log('[Debug] ...')`
- Technical comments trong code

### 🎯 Ví dụ chuẩn:

```html
<!-- Dropdown với tiếng Việt -->
<select id="taskType" name="taskType">
  <option value="onetime">Làm một lần</option>
  <option value="daily">Lặp hàng ngày</option>
  <option value="weekly">Lặp hàng tuần</option>
  <option value="monthly">Lặp hàng tháng</option>
  <option value="yearly">Lặp hàng năm</option>
</select>

<!-- Error message -->
<div class="error-message">
  Vui lòng chọn thời hạn hoàn thành
</div>

<!-- Success alert -->
<script>
  showAlert('success', 'Công việc đã được tạo thành công!');
</script>

<!-- Preview text -->
<p class="preview-text">
  🔮 Deadline tiếp theo: <strong>17/03/2026 09:00</strong><br>
  <span class="text-muted">(Hàng ngày lúc 09:00)</span>
</p>
```

---

## 🎨 UI Component Standards

### Buttons

```html
<!-- Primary actions -->
<button class="btn-primary">Lưu công việc</button>
<button class="btn-primary">Tạo mới</button>
<button class="btn-primary">Cập nhật</button>

<!-- Secondary actions -->
<button class="btn-secondary">Hủy</button>
<button class="btn-secondary">Đóng</button>

<!-- Danger actions -->
<button class="btn-danger">Xóa</button>
```

### Form Labels

```html
<label class="form-label">Tiêu đề công việc</label>
<label class="form-label">Mô tả chi tiết</label>
<label class="form-label">Độ ưu tiên</label>
<label class="form-label">Thời hạn hoàn thành</label>
```

### Placeholders

```html
<input type="text" placeholder="Nhập tiêu đề công việc...">
<textarea placeholder="Nhập mô tả chi tiết..."></textarea>
<input type="date" placeholder="Chọn ngày...">
```

### Status Text

```javascript
const statusTranslations = {
  'draft': 'Nháp',
  'active': 'Đang chạy',
  'completed': 'Hoàn thành',
  'archived': 'Đã lưu trữ',
  'pending': 'Chờ xử lý',
  'in_progress': 'Đang thực hiện',
  'approved': 'Đã duyệt',
  'rejected': 'Từ chối'
};
```

### Priority Text

```javascript
const priorityTranslations = {
  'low': 'Thấp',
  'medium': 'Trung bình',
  'high': 'Cao',
  'urgent': 'Khẩn cấp'
};
```

---

## 📐 Layout Standards

### Spacing
- Sections: `space-y-4` (16px vertical spacing)
- Form groups: `mb-4` (16px margin bottom)
- Input groups: `gap-3` (12px gap)

### Colors
- One-time tasks: Blue (`bg-blue-50`, `border-blue-200`)
- Recurring tasks: Green (`bg-green-50`, `border-green-200`)
- Preview section: Purple (`bg-purple-50`, `border-purple-200`)
- Errors: Red (`bg-red-50`, `text-red-600`)
- Success: Green (`bg-green-50`, `text-green-600`)

### Typography
- Section headers: `text-lg font-semibold`
- Labels: `text-sm font-semibold text-gray-700`
- Help text: `text-xs text-gray-600 italic`
- Preview text: `text-sm font-medium`

---

## ♿ Accessibility

### ARIA Labels (tiếng Việt)

```html
<select aria-label="Chọn loại công việc">...</select>
<input aria-label="Nhập tiêu đề công việc">
<button aria-label="Lưu công việc">💾 Lưu</button>

<!-- Live region for preview -->
<div role="status" aria-live="polite" aria-label="Xem trước deadline">
  17/03/2026 09:00
</div>
```

### Form Validation Messages

```javascript
// Validation messages - TIẾNG VIỆT
const validationMessages = {
  required: 'Trường này là bắt buộc',
  invalidDate: 'Ngày không hợp lệ',
  invalidTime: 'Giờ không hợp lệ',
  pastDate: 'Deadline không thể là quá khứ',
  titleTooShort: 'Tiêu đề phải có ít nhất 3 ký tự',
  titleTooLong: 'Tiêu đề không được vượt quá 100 ký tự'
};
```

---

## 🔔 Alert Messages

### Success

```javascript
showAlert('success', 'Công việc đã được tạo thành công!');
showAlert('success', 'Đã cập nhật thông tin công việc');
showAlert('success', 'Đã xóa công việc');
```

### Error

```javascript
showAlert('error', 'Không thể tạo công việc. Vui lòng thử lại');
showAlert('error', 'Vui lòng điền đầy đủ thông tin');
showAlert('error', 'Đã có lỗi xảy ra. Vui lòng liên hệ admin');
```

### Warning

```javascript
showAlert('warning', 'Deadline đã qua. Vui lòng chọn thời gian tương lai');
showAlert('warning', 'Bạn chưa chọn chi nhánh nào');
```

### Info

```javascript
showAlert('info', 'Đang xử lý...');
showAlert('info', 'Đang tải dữ liệu...');
```

---

## 📅 Date/Time Formatting

### Hiển thị ngày tháng

```javascript
// Định dạng tiếng Việt
const date = new Date('2026-03-17T09:00:00');

// Full format
date.toLocaleString('vi-VN', {
  weekday: 'long',
  year: 'numeric',
  month: 'long',
  day: 'numeric',
  hour: '2-digit',
  minute: '2-digit'
});
// → "Thứ Hai, 17 tháng 3, 2026 lúc 09:00"

// Short format
date.toLocaleString('vi-VN', {
  weekday: 'short',
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit'
});
// → "T2, 17/03/2026, 09:00"

// Custom format
const dayNames = ['Chủ nhật', 'Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7'];
const monthNames = ['Tháng 1', 'Tháng 2', 'Tháng 3', ..., 'Tháng 12'];
```

---

## ✅ Checklist trước khi commit

- [ ] Tất cả text hiển thị là tiếng Việt
- [ ] Error messages là tiếng Việt
- [ ] Alert messages là tiếng Việt
- [ ] Placeholder text là tiếng Việt
- [ ] Dropdown options là tiếng Việt
- [ ] Button text là tiếng Việt
- [ ] Modal titles/content là tiếng Việt
- [ ] Help text/tooltips là tiếng Việt
- [ ] Status/priority text đã được translate
- [ ] Date/time hiển thị theo format Việt Nam
- [ ] Console logs giữ tiếng Anh (OK cho developer)
- [ ] Code variables/functions giữ tiếng Anh (OK)

