# Plan: Cải thiện Level 3 accordion + Edit modal đa nhân viên

## Context
Hiện tại khi admin "Sửa" 1 UserTask, hệ thống **reassign** (thay thế nhân viên cũ bằng nhân viên mới). User muốn **thêm** nhân viên thứ 2 nhưng kết quả là nhân viên đầu bị xóa — chỉ còn 1 người.

Ngoài ra Level 3 chưa hiển thị chức vụ và format checklist `done/required/total` theo yêu cầu.

**3 nhóm thay đổi:**
1. Backend — trả thêm `employeePosition` và `checklistRequired`
2. Frontend Level 3 — cập nhật hiển thị
3. Frontend Edit modal — hiển thị TẤT CẢ nhân viên, hỗ trợ xóa từng người và thêm người mới
4. Backend — endpoint mới để admin thêm nhân viên vào StoreTask đã tồn tại

---

## Thứ tự implement (docs → backend → frontend)

### BƯỚC 0: Cập nhật docs trước
- `docs/CHANGELOG.md` — thêm entry v2.2.0
- `docs/03-API-REFERENCE.md` — thêm endpoint mới, cập nhật response shape
- `docs/05-KNOWN-ISSUES.md` — nếu liên quan

---

### BƯỚC 1: Backend — `src/controllers/dashboardController.js`

**Vị trí:** hàm `getAdminTasksByStatus`, đoạn populate UserTask (~line 276-283)

Thêm `ID_GroupUser` vào populate employee:
```javascript
// CŨ:
.populate({
  path: 'employeeId',
  select: 'FullName Phone ID_Branch',
  populate: { path: 'ID_Branch', select: 'Name' }
})
.select('_id employeeId status checklist');

// MỚI:
.populate({
  path: 'employeeId',
  select: 'FullName Phone ID_Branch ID_GroupUser',
  populate: [
    { path: 'ID_Branch', select: 'Name' },
    { path: 'ID_GroupUser', select: 'GroupName' }
  ]
})
.select('_id employeeId status checklist');
```

Thêm `checklistRequired` và `employeePosition` vào formattedUserTasks (~line 295-309):
```javascript
const checklistRequired = ut.checklist.filter(c => c.required).length;
// ...
{
  userTaskId: ut._id,
  employeeId: emp._id,
  employeeName: emp.FullName,
  employeePhone: emp.Phone,
  employeeBranch: emp.ID_Branch?.Name,
  employeePosition: emp.ID_GroupUser?.GroupName || 'Nhân viên',  // ← MỚI
  status: ut.status,
  checklistDone: ut.checklist.filter(c => c.isCompleted).length,
  checklistRequired,           // ← MỚI: số item required
  checklistTotal: ut.checklist.length
}
```

---

### BƯỚC 2: Backend — Endpoint mới thêm nhân viên (Admin)

**File:** `src/routes/adminRoutes.js`
```javascript
router.post('/store-tasks/:id/add-employee', authenticate, requireAdmin, adminController.addEmployeeToStoreTask);
```

**File:** `src/controllers/adminController.js` — thêm function `addEmployeeToStoreTask`:
```
POST /api/admin/store-tasks/:id/add-employee
Body: { employeeId }
Logic:
  1. Find StoreTask by :id
  2. Validate StoreTask status ∈ ['accepted', 'in_progress']
  3. Check employee chưa được assign (không có UserTask với storeTaskId + employeeId này)
  4. Validate employee.Status === 'Đang hoạt động' và employee.ID_Branch === storeTask.storeId
  5. Lấy checklist từ Broadcast → tạo UserTask mới (status: 'assigned')
  6. Thêm employeeId vào StoreTask.assignedEmployees
  7. Notify employee (notificationService.notifyTaskAssigned)
  8. Return new UserTask
```

---

### BƯỚC 3: Frontend — `renderUserTaskRow` (admin-dashboard.js ~line 296-327)

Cập nhật hiển thị Level 3:
```javascript
// Dòng 1: Tên • Chức vụ
<p class="text-sm font-medium text-gray-800">${ut.employeeName} · <span class="text-gray-500 font-normal">${ut.employeePosition || 'Nhân viên'}</span></p>
// Dòng 2: SĐT • done/required/total
<p class="text-xs text-gray-500">
  ${ut.employeePhone || ''} &bull; ${ut.checklistDone}/${ut.checklistRequired}/${ut.checklistTotal} checklist
</p>
```

Giữ nguyên nút **Xóa** (DELETE UserTask). Đổi nút **Sửa** — thay vì edit per-employee, nút Sửa mở edit modal với đầy đủ context storeTask (đã có `userTasks[]`).

---

### BƯỚC 4: Frontend — Edit modal (admin-dashboard.js)

**4a. Đổi section "Đang giao cho" → hiển thị tất cả nhân viên**

Hàm `populateCurrentEmployee(task)` → thay bằng `populateAssignedEmployees(task)`:
```javascript
function populateAssignedEmployees(task) {
  const container = document.getElementById('editCurrentEmployeeContainer');
  const userTasks = task.userTasks || [];

  if (userTasks.length === 0) {
    container.innerHTML = `<p class="text-sm text-gray-500 italic">Chưa giao cho nhân viên nào</p>`;
    return;
  }

  container.innerHTML = userTasks.map(ut => `
    <div class="flex items-center gap-3 p-3 bg-blue-50 border border-blue-200 rounded-lg" id="emp-card-${ut.userTaskId}">
      <i class="fas fa-user-circle text-blue-500 text-xl flex-shrink-0"></i>
      <div class="flex-1 min-w-0">
        <p class="font-semibold text-gray-900 text-sm truncate">${ut.employeeName}</p>
        <p class="text-xs text-gray-500">${ut.employeePhone || ''} · ${ut.employeeBranch || ''}</p>
      </div>
      <button class="remove-assigned-emp-btn flex-shrink-0 text-red-500 hover:text-red-700 p-1"
              data-user-task-id="${ut.userTaskId}"
              data-employee-name="${ut.employeeName}"
              title="Xóa khỏi task">
        <i class="fas fa-times text-lg"></i>
      </button>
    </div>
  `).join('');

  // Attach remove handlers
  container.querySelectorAll('.remove-assigned-emp-btn').forEach(btn => {
    btn.addEventListener('click', async () => {
      const userTaskId = btn.getAttribute('data-user-task-id');
      const name = btn.getAttribute('data-employee-name');
      if (!confirm(`Xóa ${name} khỏi task?`)) return;

      const res = await fetch(`/api/admin/user-tasks/${userTaskId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        document.getElementById(`emp-card-${userTaskId}`)?.remove();
        // Cập nhật task.userTasks trong memory
        if (currentEditingTask) {
          currentEditingTask.userTasks = currentEditingTask.userTasks.filter(
            ut => ut.userTaskId?.toString() !== userTaskId
          );
        }
      }
    });
  });
}
```

**4b. Đổi section "Giao lại" → "Thêm nhân viên mới"**

Thay vì reassign (PUT /api/admin/user-tasks/:id với employeeId), khi user chọn nhân viên mới → gọi:
```
POST /api/admin/store-tasks/:storeTaskId/add-employee
Body: { employeeId }
```

Sau khi thêm thành công → reload lại danh sách nhân viên trong modal (gọi lại `populateAssignedEmployees` với dữ liệu mới).

**4c. Label thay đổi trong UI:**
- "🚀 Đang giao cho:" → "👥 Nhân viên được giao:"
- "CHỌN NHÂN VIÊN MỚI" → "THÊM NHÂN VIÊN MỚI"

---

## Files cần sửa

| File | Thay đổi |
|------|---------|
| `src/controllers/dashboardController.js` | Thêm ID_GroupUser populate, thêm checklistRequired & employeePosition |
| `src/routes/adminRoutes.js` | Thêm route POST /admin/store-tasks/:id/add-employee |
| `src/controllers/adminController.js` | Thêm hàm addEmployeeToStoreTask |
| `public/js/admin-dashboard.js` | renderUserTaskRow + edit modal (populateAssignedEmployees, add-employee logic) |
| `docs/CHANGELOG.md` | Thêm entry |
| `docs/03-API-REFERENCE.md` | Thêm endpoint mới, cập nhật userTask response shape |

---

## Verification
1. Dashboard Level 3 hiển thị: `Tên · Chức vụ` và `SĐT · 0/3/5 checklist`
2. Click Sửa → modal hiện đủ 2 nhân viên (nếu 2 người được giao)
3. Click X trên 1 nhân viên → nhân viên đó biến khỏi danh sách, không ảnh hưởng người còn lại
4. Thêm nhân viên mới → modal reload, hiện đủ cả nhân viên cũ lẫn mới
5. Level 2 accordion cập nhật đúng số nhân viên sau reload task list

---

# Plan cũ: Sửa lỗi filter Active_Schedule (ĐÃ XONG)


## Context
MongoDB Compass xác nhận `Active_Schedule` trong collection Branch lưu kiểu **Boolean** (True 80%, False 20%) — KHÔNG phải String.

Mongoose model `Brand.js` khai báo `Active_Schedule: String` là **schema sai** — dữ liệu thực tế trong DB là boolean do ERP ghi trực tiếp.

Docs (`02-DATABASE-SCHEMA.md`, `03-API-REFERENCE.md`) hiện tại cũng sai theo schema Mongoose — ghi là `String "true"/"false"`.

Lịch sử lỗi tạo ra trạng thái hiện tại:
1. Audit thêm `filter.Active_Schedule = true` (boolean) → đúng, match 80% brands
2. Nhìn sai vào schema Mongoose (`String`) → "sửa" thành `filter.Active_Schedule = 'true'` (string)
3. Fix sai → `'true'` string không match boolean DB → **0 brands trả về**

## Thứ tự implement (docs trước, code sau)

### 1. `docs/02-DATABASE-SCHEMA.md`

**Dòng 179** — sửa kiểu dữ liệu Brand schema:
```
// CŨ:
Active_Schedule: String // "true" | "false"

// MỚI:
Active_Schedule: Boolean // true | false (Boolean thực, không phải String)
```

**Dòng 665** — sửa mục "Boolean as Strings":
```
// CŨ:
- Fields: `is_timekeeping_all`, `Active`, `Active_Schedule`
- Values: `"true"` / `"false"` instead of boolean

// MỚI:
- Fields: `is_timekeeping_all`, `Active` (Brand)
- Values: `"true"` / `"false"` instead of boolean
// (Bỏ Active_Schedule — nó là Boolean thật)
// Thêm note:
- `Active_Schedule` (Brand): lưu Boolean thật (true/false), KHÔNG phải String
```

### 2. `docs/03-API-REFERENCE.md`

**Dòng 133-136** — Rule 6 "Boolean as String":
```
// CŨ:
- ❌ `Active_Schedule: "true"/"false"` (Brand model)

// MỚI: xóa dòng đó, thêm note riêng:
- ✅ `Active_Schedule: true/false` (Brand model) — Boolean thực, query bình thường
```

**Dòng 981, 990** — example response:
```json
// CŨ:
"Active_Schedule": "true"
"Active_Schedule": "false"

// MỚI:
"Active_Schedule": true
"Active_Schedule": false
```

**Dòng 1022, 1029** — DATA TYPE WARNING:
```javascript
// CŨ:
- `Active_Schedule`: String "true"/"false" - KHÔNG phải Boolean!
const hasSchedule = brand.Active_Schedule === "true";

// MỚI:
- `Active_Schedule`: Boolean thực — dùng trực tiếp, không cần parse
const hasSchedule = brand.Active_Schedule;  // Boolean, dùng bình thường
```

Kiểm tra dòng 1072 (example GET /api/brands/:id) nếu có `"Active_Schedule": "true"` → sửa thành `true` (không quotes).

### 3. `docs/CHANGELOG.md`

Thêm vào section `[2.2.0]` → `🐛 Bug Fixes`:
```markdown
#### Brand Controller (`src/controllers/brandController.js`)
- **Fix:** `Active_Schedule` trong MongoDB lưu kiểu Boolean thực (true/false), KHÔNG phải String "true"/"false" như Mongoose schema khai báo. Filter `Active_Schedule = 'true'` (string) không match → 0 chi nhánh trả về. Sửa thành `Active_Schedule = true` (boolean). Đồng thời cập nhật docs để phản ánh đúng kiểu dữ liệu thực tế trong DB.
```

### 4. `src/controllers/brandController.js`

**Dòng 30-31** — revert về boolean:
```javascript
// CŨ (sai):
// Chỉ lấy chi nhánh đang hoạt động (Active_Schedule: 'true' - stored as String)
filter.Active_Schedule = 'true';

// MỚI (đúng):
// Chỉ lấy chi nhánh đang hoạt động (Active_Schedule: true - Boolean)
filter.Active_Schedule = true;
```

## Verification
Mở modal "Giao việc" → tab "Chi nhánh" → danh sách chi nhánh hiển thị bình thường (~80% số chi nhánh có Active_Schedule = true).

---

# Plan cũ: Cải thiện UI Dev Tool Chuyển Đổi Tài Khoản (ĐÃ XONG)

## Context
Hiện tại Dev Tool "Chuyển đổi tài khoản" chỉ hiển thị tối đa **50 nhân viên** (limit ở backend)
và không có ô tìm kiếm, cards nhỏ khó đọc.

User muốn giao diện giống tab "Nhân viên" trong modal "Giao việc":
- Hiển thị **toàn bộ** nhân viên đang hoạt động
- Có **ô tìm kiếm** lọc theo tên / chức vụ / chi nhánh
- Cards lớn hơn, dễ đọc hơn (tên, số điện thoại, chức vụ, chi nhánh)
- Vẫn giữ nhóm theo vai trò (Admin / Quản lý / Nhân viên)

---

## Files cần thay đổi

| File | Thay đổi |
|------|---------|
| `src/routes/devRoutes.js` | Bỏ `.limit(50)` → trả về toàn bộ nhân viên đang hoạt động |
| `public/js/account-switcher.js` | Thêm ô tìm kiếm + lọc client-side + cải thiện card style |

---

## PHẦN 1 — Backend: devRoutes.js

**Thay đổi duy nhất (line 32):** Xoá `.limit(50)`:

```javascript
// CŨ:
.sort({ FullName: 1 })
.limit(50);

// MỚI:
.sort({ FullName: 1 });
// (xoá dòng .limit(50))
```

---

## PHẦN 2 — Frontend: account-switcher.js

Viết lại toàn bộ file (giữ nguyên class `AccountSwitcher`, logic `switchTo`, `init`, `loadAccounts`, `attachEvents` - chỉ thay đổi UI rendering và thêm search).

### 2.1 `createUI()` — Thêm search bar, modal flexbox

```javascript
createUI() {
  // Floating button (giữ nguyên)
  const button = ...; // không đổi

  // Modal — thêm search bar, dùng flex column để overflow đúng
  const modal = document.createElement('div');
  modal.id = 'accountSwitcherModal';
  modal.className = 'fixed inset-0 bg-black bg-opacity-50 z-50 hidden flex items-center justify-center';
  modal.innerHTML = `
    <div class="bg-white rounded-lg shadow-xl max-w-lg w-full mx-4 max-h-[85vh] overflow-hidden flex flex-col">
      <!-- Header -->
      <div class="bg-indigo-600 text-white p-4 flex justify-between items-center flex-shrink-0">
        <h3 class="text-lg font-bold">🔄 Chuyển đổi tài khoản (Dev Tool)</h3>
        <button id="closeAccountSwitcher" class="text-white hover:text-gray-200">✕</button>
      </div>
      <!-- Search bar (MỚI) -->
      <div class="p-3 border-b flex-shrink-0">
        <input id="accountSwitcherSearch" type="text"
          class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
          placeholder="Tìm kiếm theo tên, chức vụ, chi nhánh...">
      </div>
      <!-- List -->
      <div class="overflow-y-auto flex-1">
        <div id="accountsList" class="p-3"></div>
      </div>
    </div>
  `;

  document.body.appendChild(button);
  document.body.appendChild(modal);
  this.renderAccounts();
}
```

### 2.2 `renderAccounts()` — gọi `renderAccountList(this.accounts)`

```javascript
renderAccounts() {
  if (!this.accounts) return;
  this.renderAccountList(this.accounts);
}
```

### 2.3 `renderAccountList(filtered)` — NEW method

Nhận object `{ admin, manager, employee }` (đã lọc hoặc đầy đủ):

```javascript
renderAccountList(filtered) {
  const container = document.getElementById('accountsList');
  if (!container) return;

  const currentEmployee = JSON.parse(localStorage.getItem('employee') || '{}');

  let html = `
    <div class="mb-3 p-3 bg-green-50 border border-green-200 rounded-lg">
      <p class="text-xs font-semibold text-green-700 mb-1">✓ Đang đăng nhập</p>
      <p class="font-semibold text-gray-900">${currentEmployee.fullName || 'N/A'}</p>
      <p class="text-xs text-gray-500">${currentEmployee.groupUser || ''} · ${currentEmployee.branchName || ''}</p>
    </div>
  `;

  html += this.renderRoleSection('👑 Admin', filtered.admin || [], 'purple');
  html += this.renderRoleSection('👔 Quản lý', filtered.manager || [], 'blue');
  html += this.renderRoleSection('👤 Nhân viên', filtered.employee || [], 'green');

  const total = (filtered.admin?.length || 0) + (filtered.manager?.length || 0) + (filtered.employee?.length || 0);
  if (total === 0) {
    html += '<p class="text-center text-gray-400 py-6 text-sm">Không tìm thấy kết quả</p>';
  }

  container.innerHTML = html;
}
```

### 2.4 `renderRoleSection(title, accounts, color)` — card style mới

Bỏ grid 2 cột, dùng danh sách 1 cột, card lớn giống "Giao việc":

```javascript
renderRoleSection(title, accounts, color) {
  if (!accounts || accounts.length === 0) return '';

  const headerColor = {
    purple: 'text-purple-700',
    blue:   'text-blue-700',
    green:  'text-green-700'
  }[color] || 'text-gray-700';

  const items = accounts.map(acc => `
    <button onclick="accountSwitcher.switchTo('${acc._id}')"
      class="w-full text-left flex items-center gap-3 p-3 border border-gray-100 rounded-lg hover:bg-indigo-50 hover:border-indigo-200 transition-colors">
      <div class="w-9 h-9 rounded-full bg-gray-200 flex items-center justify-center flex-shrink-0 text-gray-500">
        <i class="fas fa-user text-sm"></i>
      </div>
      <div class="flex-1 min-w-0">
        <p class="font-semibold text-gray-900 truncate">${acc.fullName}</p>
        <p class="text-xs text-gray-500 truncate">📞 ${acc.phone} · 💼 ${acc.position}</p>
        <p class="text-xs text-gray-400 truncate">🏢 ${acc.branch}</p>
      </div>
    </button>
  `).join('');

  return `
    <div class="mb-3">
      <p class="text-xs font-bold ${headerColor} uppercase tracking-wide px-1 mb-2">
        ${title} (${accounts.length})
      </p>
      <div class="space-y-1">${items}</div>
    </div>
  `;
}
```

### 2.5 `filterAndRender(query)` — NEW method

```javascript
filterAndRender(query) {
  if (!this.accounts) return;
  const q = query.toLowerCase();
  const filter = (list) => !q ? list : list.filter(acc =>
    acc.fullName.toLowerCase().includes(q) ||
    acc.position.toLowerCase().includes(q) ||
    acc.branch.toLowerCase().includes(q)
  );
  this.renderAccountList({
    admin:    filter(this.accounts.admin    || []),
    manager:  filter(this.accounts.manager  || []),
    employee: filter(this.accounts.employee || [])
  });
}
```

### 2.6 Cập nhật `attachEvents()` — thêm search listener

```javascript
// (giữ nguyên 4 listeners hiện có)
// Thêm:
const searchInput = document.getElementById('accountSwitcherSearch');
let searchTimer = null;
searchInput.addEventListener('input', () => {
  if (searchTimer) clearTimeout(searchTimer);
  searchTimer = setTimeout(() => {
    this.filterAndRender(searchInput.value.trim());
  }, 200);
});
```

### 2.7 Cập nhật `open()` — reset search khi mở

```javascript
open() {
  document.getElementById('accountSwitcherModal').classList.remove('hidden');
  document.getElementById('accountSwitcherModal').classList.add('flex');
  this.isOpen = true;
  const searchInput = document.getElementById('accountSwitcherSearch');
  if (searchInput) {
    searchInput.value = '';
    this.filterAndRender('');
  }
}
```

---

## Thứ tự implement

1. **`docs/`** — Cập nhật các file logic md trước khi sửa code:
   - `docs/03-API-REFERENCE.md` — endpoint `GET /api/dev/accounts`: bỏ ghi chú limit 50, thêm ghi chú search client-side
   - `docs/05-KNOWN-ISSUES.md` — thêm entry "Dev Tool chỉ hiển thị 50 tài khoản ✅" vào mục đã sửa
   - `docs/CHANGELOG.md` — thêm thay đổi vào version hiện tại
2. `src/routes/devRoutes.js` — xoá `.limit(50)`
3. `public/js/account-switcher.js` — sửa theo từng method ở trên

---

## Verification

1. Mở admin dashboard, click nút chuyển đổi (góc phải dưới)
2. Modal mở → thấy ô tìm kiếm + toàn bộ nhân viên (> 50 nếu db có nhiều)
3. Gõ tên → danh sách lọc real-time (200ms debounce)
4. Gõ tên chi nhánh / chức vụ → cũng lọc được
5. Click 1 tài khoản → toast xanh + trang reload + đăng nhập đúng tài khoản
6. Mở lại modal → ô tìm kiếm đã reset về trống
