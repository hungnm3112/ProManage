# Plan: Tái cấu trúc hệ thống giao việc — Logic mới (v3.0)

## TL;DR
Loại bỏ flow Manager accept/reject. Admin giao trực tiếp cho nhân viên — admin chỉ định **người phụ trách** (có thể 1 hoặc nhiều người). TẤT CẢ người được chọn đều là người phụ trách (không có khái niệm "worker" từ phía admin). Người phụ trách có thể giao checklist item cho **bất kỳ nhân viên nào trong chi nhánh** của họ, không phụ thuộc vào danh sách admin đã chọn. Admin chỉ có thể xóa hoặc clone task đã giao.

---

## Quyết định kiến trúc đã xác nhận

| # | Quyết định | Chi tiết |
|---|-----------|---------|
| D1 | **UserTask cho TẤT CẢ người phụ trách** | Tạo UserTask (checklist đầy đủ) cho MỖI người phụ trách admin chọn. Không còn khái niệm "worker" do admin chỉ định. Nhân viên ngoài nhóm phụ trách vẫn có thể được giao item — khi đó tự động tạo UserTask rỗng cho họ để visibility. |
| D2 | **assignedTo nhúng trong checklist item** | Option A: thêm `assignedTo: ObjectId` vào mỗi item của `UserTask.checklist[]`. Nhanh hơn Option B (collection riêng). |
| D3 | **StoreTask có bước xác nhận** | Admin giao → `assigned`. Người phụ trách xác nhận nhận việc → `in_progress`. Nhân viên KHÔNG có quyền từ chối. |
| D4 | **`assignedPersonId` thay `managerId`** | `managerId` (required) → `assignedPersonId` (optional, auto-set = employee[0]). Người phụ trách KHÔNG xác định theo chức vụ mà theo Admin chỉ định. |
| D5 | **Admin: chỉ xóa hoặc clone** | Xóa nút "Sửa". Thêm nút "Nhân bản". Clone pre-fill title/description/checklist/deadline vào form tạo mới. |
| D6 | **Clone — task gốc chạy song song** | Không archive task gốc sau khi clone. Clone tạo Broadcast draft mới có `sourceId` trỏ về gốc. |
| D7 | **StoreTask completion** | 100% required checklist items (aggregate across all assignments) được approve = completed. |

---

## Phase A — Schema (không breaking, dùng migration-safe defaults)

### A1. `src/models/StoreTask.js`
- Đổi `managerId: { required: true }` → `assignedPersonId: { type: ObjectId, ref: 'Employee', required: false, default: null }`
- Giữ `managerId` tạm thời với `required: false` (backward compat với data cũ) → xóa sau khi migrate
- Giữ nguyên `assignedEmployees: [ObjectId]` — **chỉ chứa những người phụ trách** (tất cả admin chọn, kể cả `assignedPerson`). Không còn là "danh sách những người được phép nhận việc". Nhân viên ngoài danh sách này vẫn có thể được người phụ trách giao item.
- Xóa status `'pending'`, `'accepted'`, `'rejected'` khỏi enum → chỉ còn `['in_progress', 'completed']`
  - **Giữ lại** nếu có data cũ, đánh dấu deprecated
- Cập nhật `calculateCompletionRate()`: đếm `checklist[i].isCompleted && checklist[i].required` trên UserTask duy nhất, không đếm theo UserTask count

### A2. `src/models/UserTask.js`
Thêm vào mỗi item trong `checklist[]`:
```
assignedTo: { type: ObjectId, ref: 'Employee', default: null }
reviewStatus: { type: String, enum: ['pending_review', 'approved', 'rejected'], default: null }
reviewedAt: { type: Date, default: null }
reviewedBy: { type: ObjectId, ref: 'Employee', default: null }
reviewNote: { type: String, default: '' }
```
Thêm multikey index: `{ 'checklist.assignedTo': 1 }`

### A3. `src/models/Broadcast.js`
Thêm field:
```
sourceId: { type: ObjectId, ref: 'Broadcast', default: null }
```

---

## Phase B — Backend: Thay đổi luồng tạo StoreTask + giao việc

### B1. `src/controllers/storeTaskController.js` — Sửa `assignEmployees`
**Route hiện tại:** `POST /api/store-tasks/:id/assign`

**Logic cũ:** Tạo UserTask cho MỖI employee trong mảng `employeeIds`

**Logic mới (v3.1 — multiple responsible):**
1. Validate StoreTask tồn tại
2. `assignedPerson = employeeIds[0]` → set `storeTask.assignedPersonId = assignedPerson` (primary contact)
3. `storeTask.assignedEmployees = employeeIds` (TẤT CẢ đều là người phụ trách)
4. Tạo **UserTask cho MỖI employee** với checklist đầy đủ copy từ Broadcast
5. Set `storeTask.status = 'assigned'` (confirm flow giữ nguyên)
6. Notify tất cả — người đầu tiên là "phụ trách chính", còn lại là "đồng phụ trách"
7. Return `{ storeTask, userTasks[] }`

### B2. `src/routes/storeTaskRoutes.js` — Xóa routes
Xóa:
- `PUT /api/store-tasks/:id/accept`
- `PUT /api/store-tasks/:id/reject`

Giữ:
- `GET /api/store-tasks`
- `GET /api/store-tasks/:id`
- `POST /api/store-tasks/:id/assign` (đã sửa ở B1)

### B3. `src/controllers/storeTaskController.js` — Xóa functions
Xóa `acceptStoreTask()` và `rejectStoreTask()`.

---

## Phase C — Backend: Phân công checklist item

### C1. `src/routes/userTaskRoutes.js` — Thêm route
```javascript
PUT /api/my-tasks/:id/assign-item   // assignChecklistItem
PUT /api/my-tasks/:id/review-item   // reviewChecklistItem
```

### C2. `src/controllers/userTaskController.js` — Thêm 2 functions

**`assignChecklistItem`** (PUT `/api/my-tasks/:id/assign-item`):
- Request body: `{ itemId, assignedToEmployeeId }`
- Validate: caller phải là `UserTask.employeeId` (người phụ trách — chỉ người có UserTask mới được gọi)
- Validate (MỚI): `assignedToEmployeeId` phải thuộc **cùng chi nhánh** với `StoreTask.storeId` — KHÔNG phụ thuộc vào `StoreTask.assignedEmployees`
- Nếu employee được giao chưa có UserTask cho StoreTask này → tự động tạo UserTask rỗng cho họ (để visibility trong Section 2 "Việc của tôi")
- Set `checklist[itemId].assignedTo = assignedToEmployeeId`
- Notify `assignedToEmployeeId`
- Return updated UserTask

**`reviewChecklistItem`** (PUT `/api/my-tasks/:id/review-item`):
- Request body: `{ itemId, action: 'approve'|'reject', reviewNote }`
- Validate: caller phải là `UserTask.employeeId` (người phụ trách)
- Validate: `checklist[itemId].assignedTo` phải != null (item phải đã giao cho ai đó)
- Set `reviewStatus`, `reviewedAt`, `reviewedBy`, `reviewNote`
- Nếu action = 'approve': set `isCompleted = true`, `completedAt = now`
- Gọi `storeTask.updateCompletionRate()` → auto-complete nếu 100%
- Notify người được review
- Return updated UserTask

---

## Phase D — Backend: Admin actions mới

### D1. `src/routes/adminRoutes.js` — Thêm + Xóa routes
Xóa:
- `PUT /api/admin/user-tasks/:id` (reassign — không còn dùng)
- `POST /api/admin/store-tasks/:id/add-employee` (không cần nữa)

Thêm:
- `GET /api/admin/broadcasts/:id/clone-data`

### D2. `src/controllers/adminController.js` — Thêm `getCloneData`
**`getCloneData`** (GET `/api/admin/broadcasts/:id/clone-data`):
- Find Broadcast by :id
- Return `{ title, description, priority, checklist, deadline, attachments }`
- Không return `assignedStores` (admin chọn lại)
- Không return `recurring` (admin set lại nếu cần)

Giữ: `deleteUserTask()` (vẫn cần)

---

## Phase E — Backend: Dashboard updates

### E1. `src/controllers/dashboardController.js` — `getAdminTasksByStatus`
- **Bỏ** filter status 'pending-confirm' (hoặc giữ cho data cũ, không hiển thị trong UI mới)
- Cập nhật `formattedUserTasks`: thêm `assignedItems` count (số checklist item đã giao cho người khác)
- Render Level 3 mới: 1 UserTask row (người phụ trách) + sub-rows cho các item được tag

---

## Phase F — Frontend: Admin dashboard

### F1. `public/js/admin-dashboard.js` — Assign modal
- Khi user chọn nhân viên cho 1 chi nhánh, highlight nhân viên đầu tiên với badge "👑 Phụ trách"
- Hiển thị tooltip: "Nhân viên đầu tiên trong danh sách sẽ là người phụ trách"
- Giao diện chọn người: drag-to-reorder hoặc đơn giản hơn: nút "Đặt làm phụ trách" trên mỗi card

### F2. `public/js/admin-dashboard.js` — Dashboard task rows (Level 3)
Thay đổi `renderUserTaskRow()`:
- Level 3 hiển thị người phụ trách + danh sách checklist items với `assignedTo` name
- Format: `👑 Nguyễn A (phụ trách) — 2/5 checklist` 
- Sub-info: `Item #3 → Trần B, Item #4 → Lê C`

### F3. `public/js/admin-dashboard.js` — Xóa nút "Sửa", thêm "Nhân bản"
- Xóa `editTaskBtn` event handlers liên quan đến reassign modal
- Thêm nút "Nhân bản" (clone) trong mỗi task row
- Clone click handler:
  1. `GET /api/admin/broadcasts/:broadcastId/clone-data`
  2. Mở modal tạo việc (`createBroadcastModal`)
  3. Pre-fill tất cả fields: title, description, priority, deadline, checklist
  4. Admin chỉnh sửa → tạo Broadcast draft mới
- Xóa section "pending-confirm" hoặc ẩn nếu không còn pending tasks

---

## Phase G — Frontend: Employee dashboard

### G1. `public/js/employee-dashboard.js` — Người phụ trách
Trong màn hình chi tiết task:
- Hiển thị toàn bộ checklist
- Với mỗi item: dropdown "Giao cho..." → list `StoreTask.assignedEmployees` (trừ bản thân)
- Nút "Phê duyệt" / "Từ chối" xuất hiện khi `item.assignedTo != null && item.reviewStatus === null`

### G2. `public/js/employee-dashboard.js` — Nhân viên thường (được tag)
- Thấy task trong dashboard (read-only overview)
- Chỉ tương tác với item có `assignedTo === self`:
  - Tick hoàn thành
  - Upload evidence
  - Submit item → trigger notification đến người phụ trách

---

## Phase H — Docs

### H1. `docs/01-BUSINESS-LOGIC.md`
Viết lại section "Luồng giao việc":
- Xóa Manager accept/reject flow
- Thêm flow mới: Admin → chọn chi nhánh + nhân viên → assignedPerson → phân công checklist → review

### H2. `docs/02-DATABASE-SCHEMA.md`
- Cập nhật StoreTask schema: `assignedPersonId`, bỏ `managerId`
- Cập nhật UserTask checklist item schema: thêm `assignedTo`, `reviewStatus`, `reviewedAt`, `reviewedBy`
- Cập nhật Broadcast schema: thêm `sourceId`

### H3. `docs/03-API-REFERENCE.md`
- Xóa: `PUT /store-tasks/:id/accept`, `PUT /store-tasks/:id/reject`
- Xóa: `PUT /admin/user-tasks/:id` (reassign)
- Thêm: `PUT /my-tasks/:id/assign-item`, `PUT /my-tasks/:id/review-item`
- Thêm: `GET /admin/broadcasts/:id/clone-data`
- Cập nhật: `POST /store-tasks/:id/assign` request/response shape

### H4. `docs/CHANGELOG.md`
Thêm entry v3.0.0

---

## Files cần sửa

| File | Phase | Thay đổi |
|------|-------|---------|
| `src/models/StoreTask.js` | A1 | `managerId` → `assignedPersonId`, cập nhật enum status, `calculateCompletionRate()` |
| `src/models/UserTask.js` | A2 | Thêm `assignedTo`, `reviewStatus`, `reviewedAt`, `reviewedBy`, `reviewNote` vào checklist[] |
| `src/models/Broadcast.js` | A3 | Thêm `sourceId` |
| `src/controllers/storeTaskController.js` | B1, B3 | Sửa `assignEmployees`, xóa `acceptStoreTask`, `rejectStoreTask` |
| `src/routes/storeTaskRoutes.js` | B2 | Xóa accept/reject routes |
| `src/controllers/userTaskController.js` | C2 | Thêm `assignChecklistItem`, `reviewChecklistItem` |
| `src/routes/userTaskRoutes.js` | C1 | Thêm 2 routes mới |
| `src/controllers/adminController.js` | D1, D2 | Xóa `reassignUserTask`, xóa `addEmployeeToStoreTask`, thêm `getCloneData` |
| `src/routes/adminRoutes.js` | D1 | Xóa 2 routes cũ, thêm clone-data route |
| `src/controllers/dashboardController.js` | E1 | Cập nhật populate + response shape |
| `public/js/admin-dashboard.js` | F1-F3 | Assign modal + Level 3 render + clone button |
| `public/js/employee-dashboard.js` | G1-G2 | Assign item UI + review UI + tagged-item view |
| `docs/01-BUSINESS-LOGIC.md` | H1 | Rewrite luồng giao việc |
| `docs/02-DATABASE-SCHEMA.md` | H2 | 3 schema updates |
| `docs/03-API-REFERENCE.md` | H3 | CRUD endpoint docs |
| `docs/CHANGELOG.md` | H4 | v3.0.0 entry |

---

## Thứ tự implement (có dependency)

```
A1 → A2 → A3                    [Song song được]
B1 → B2 → B3  [depends on A1]
C1 → C2       [depends on A2]
D1 → D2       [depends on A1, A3]
E1            [depends on A1, A2]
H1-H4         [song song với code, nên làm TRƯỚC mỗi phase]

F1-F3         [depends on B1, D2]
G1-G2         [depends on C2]
```

---

## Verification

1. Admin tạo broadcast → giao cho chi nhánh A với nhân viên [X, Y, Z] → chỉ 1 UserTask tạo ra (cho X), StoreTask status = `in_progress` ngay
2. X login → thấy task → giao item #2 cho Y, item #3 cho Z
3. Y login → thấy task read-only + chỉ tương tác được item #2
4. Y tick xong item #2 → submit → notification đến X
5. X review item #2 của Y → approve → `isCompleted = true` → progress tăng
6. Khi 100% required items done → StoreTask status = `completed`
7. Admin nhấn "Nhân bản" → form tạo việc mở với title/description/checklist/deadline pre-filled
8. Task gốc vẫn `in_progress`, clone tạo ra Broadcast draft mới
9. `GET /api/store-tasks/:id/accept` → 404 (đã xóa)

---

## Phạm vi KHÔNG bao gồm trong plan này
- Migration script cho data cũ (StoreTask với status pending/accepted)
- Manager dashboard (cần redesign riêng sau khi flow ổn định)
- Recurring broadcast logic (giữ nguyên)
- Employee dashboard mobile view

---




## Phase I — Bugfix + Flow xác nhận: broadcastController + recurringService

> **Lỗi gốc:** Phase A đã xóa `'pending'` khỏi StoreTask enum, nhưng `broadcastController.js` và `recurringService.js` chưa cập nhật → ValidationError.
> **Flow mới (D3 cập nhật):** Admin giao → `assigned`. Người phụ trách xác nhận → `in_progress`. Không có từ chối.

### I-1. `assignBroadcast()` — nhánh `storeAssignments`

- **Xóa** khối "find manager by role"
- StoreTask mới: `status: 'assigned'`, `assignedPersonId: empIds[0]`; **không set `startedAt`** (set khi confirm)
- **Thay** `for (const employeeId of empIds)` loop → tạo đúng **1 UserTask** cho `empIds[0]`, `status: 'assigned'`

### I-2. `assignBroadcast()` — nhánh `employeeIds`

- `assignedPersonId: employeeId`, `status: 'assigned'`, bỏ `managerId` lookup
- UserTask `status: 'assigned'`

### I-3. `publishBroadcast()`

- **Không tạo StoreTask** khi publish — chỉ đổi Broadcast `status: 'active'`
- Xóa khối tạo StoreTask + notify manager ✅ (đã done)

### I-4. `updateUserTask()` deprecated

- Patch tối thiểu: `status: 'assigned'`, `assignedPersonId: newEmployee._id` (bỏ `managerId`)

### I-5. `recurringService.js`

- `status: 'pending'` → `status: 'assigned'` trong `StoreTask.insertMany()`

### I-6. `src/models/StoreTask.js` — thêm `'assigned'` vào enum

- Enum: `['assigned', 'in_progress', 'completed']`
- Default: `'assigned'`

### I-7. `src/controllers/storeTaskController.js` — `assignEmployees()`

- Đổi `storeTask.status = 'in_progress'` → `storeTask.status = 'assigned'`
- Bỏ `storeTask.startedAt = new Date()`

### I-8. `src/controllers/userTaskController.js` — thêm `confirmTask()`

**`confirmTask`** (`POST /api/my-tasks/:id/confirm`):
- Chỉ người phụ trách (`UserTask.employeeId === req.user._id`) mới gọi được
- Input: không cần body
- Logic:
  1. Find UserTask, validate status = `'assigned'`
  2. UserTask: `status → 'in_progress'`
  3. StoreTask: `status → 'in_progress'`, `startedAt = now`
  4. Return updated UserTask
- Nhân viên **KHÔNG** có route từ chối

### I-9. `src/routes/userTaskRoutes.js` — thêm route

```
POST /api/my-tasks/:id/confirm    // confirmTask
```

### Files cần sửa (Phase I)

| File | Thay đổi |
|------|---------|
| `src/models/StoreTask.js` | I-6: thêm `'assigned'` vào enum |
| `src/controllers/storeTaskController.js` | I-7: `status: 'assigned'`, bỏ startedAt |
| `src/controllers/broadcastController.js` | I-1, I-2, I-3✅, I-4 |
| `src/services/recurringService.js` | I-5 |
| `src/controllers/userTaskController.js` | I-8: thêm `confirmTask()` |
| `src/routes/userTaskRoutes.js` | I-9: POST /:id/confirm |

### Verification Phase I

1. Admin giao broadcast cho 2 chi nhánh → không còn lỗi ValidationError
2. `StoreTask.status === 'assigned'` ngay sau khi Admin giao
3. `UserTask.status === 'assigned'` ngay sau khi Admin giao
4. Employee gọi `POST /api/my-tasks/:id/confirm` → `StoreTask.status === 'in_progress'`, `startedAt` được set
5. Không có route từ chối → `POST /api/my-tasks/:id/reject` → 404
6. Dashboard KPI: task `assigned` chưa tính "Đang làm", chỉ tính sau khi confirm

---

## Phase J — Account Switcher: Redirect theo role (Phương án A)

### Vấn đề
Sau khi switch account (dev tool), `window.location.reload()` giữ nguyên URL hiện tại.
Nếu đang ở `/admin/dashboard` và switch sang employee, role guard kiểm tra `employee.role !== 'admin'` → redirect về `/login`.

### J-1. `public/js/account-switcher.js` — `switchTo()`

Thay `window.location.reload()` bằng redirect đến dashboard phù hợp với role:

```js
const dashboardUrls = {
  admin:    '/admin/dashboard',
  manager:  '/manager/dashboard',
  employee: '/employee/dashboard'
};
window.location.href = dashboardUrls[data.employee.role] || '/login';
```

Toast message cũng cập nhật: `✓ Switched to ${data.employee.fullName} → redirecting...`

### Files cần sửa (Phase J)

| File | Thay đổi |
|------|---------|
| `public/js/account-switcher.js` | J-1: thay reload → href redirect |

### Verification Phase J

1. Đang ở `/admin/dashboard`, switch sang employee → tự động đến `/employee/dashboard`
2. Đang ở `/employee/dashboard`, switch sang admin → tự động đến `/admin/dashboard`
3. Switch sang manager → đến `/manager/dashboard`
4. Role guard không kick về `/login` nữa

---

## Phase G (v2) — Employee Dashboard: Tách 2 section theo task-role (Phương án C)

### Bối cảnh

Cùng một employee có thể đồng thời:
- 👑 **Người phụ trách** (`me ∈ StoreTask.assignedEmployees`): Vừa làm vừa quản lý, có quyền phân công checklist item cho BẤT KỲ nhân viên cùng chi nhánh, review kết quả
- 🔧 **Nhân viên thực hiện** (`UserTask.employeeId === me` AND `me ∉ StoreTask.assignedEmployees`): Chỉ thực hiện checklist item được giao

Nếu hiển thị tất cả trong cùng 1 danh sách → không rõ ràng về trách nhiệm và quyền hạn.

### G-1. Backend: `src/controllers/dashboardController.js` — `getEmployeeDashboard()`

Tách response thành 2 section:

**responsibleTasks** — Task mình là người phụ trách:
```js
// Lấy tất cả StoreTask mà employee là NGƯỜI PHỤ TRÁCH (trong assignedEmployees)
const responsibleStoreTasks = await StoreTask.find({ assignedEmployees: currentUser._id })
  .populate('broadcastId', 'title priority deadline checklist')
  .populate('assignedEmployees', 'FullName Phone')
  .sort({ createdAt: -1 });
```

**myTasks** — UserTask mình được giao (là worker, không phải responsible person):
```js
// Lấy storeTaskIds mà mình là responsible để loại trừ
const responsibleIds = responsibleStoreTasks.map(st => st._id.toString());
const workerTasks = allActiveTasks.filter(
  ut => !responsibleIds.includes(ut.storeTaskId._id.toString())
);
```

Response mới:
```json
{
  "overview": { ... },
  "responsibleTasks": [ { storeTask + broadcast + employees + progress } ],
  "myTasks": [ { userTask + broadcast + checklist } ],
  "recentFeedback": [ ... ]
}
```

### G-2. Frontend: `public/js/employee-dashboard.js`

Render 2 section riêng biệt:

**Section 1 — "📋 Việc tôi phụ trách"** (`responsibleTasks`):
- Card hiển thị: tên broadcast, deadline, progress bar (completionRate), danh sách NV tham gia
- Badge role: `👑 Phụ trách`
- Nút: "Xem chi tiết" → link đến task detail

**Section 2 — "👤 Việc của tôi"** (`myTasks`):
- Card hiển thị: tên broadcast, deadline, checklist cá nhân (isCompleted per item), status badge
- Badge role: `🔧 Thực hiện`
- Nút: "Nộp kết quả" (nếu status in_progress) / "Xem chi tiết"

Logic hiển thị:
- Ẩn Section 1 nếu `responsibleTasks.length === 0`
- Ẩn Section 2 nếu `myTasks.length === 0`
- Nếu cả 2 đều rỗng: hiển thị "Không có công việc nào"

### G-3. Frontend: `src/views/pages/employee/dashboard.ejs`

Thêm 2 section container sau phần KPI cards:

```html
<!-- Section 1: Việc tôi phụ trách -->
<section id="responsibleTasksSection" class="hidden mb-8">
  <h3 class="text-xl font-bold mb-4">📋 Việc tôi phụ trách <span id="responsibleCount" class="..."></span></h3>
  <div id="responsibleTasksList" class="grid grid-cols-1 md:grid-cols-2 gap-4"></div>
</section>

<!-- Section 2: Việc của tôi -->
<section id="myTasksSection" class="hidden mb-8">
  <h3 class="text-xl font-bold mb-4">👤 Việc của tôi <span id="myTaskCount" class="..."></span></h3>
  <div id="myTasksList" class="grid grid-cols-1 md:grid-cols-2 gap-4"></div>
</section>
```

### Files cần sửa (Phase G v2)

| File | Thay đổi |
|------|---------|
| `src/controllers/dashboardController.js` | G-1: tách response thành responsibleTasks + myTasks |
| `public/js/employee-dashboard.js` | G-2: render 2 section riêng biệt |
| `src/views/pages/employee/dashboard.ejs` | G-3: thêm 2 section container |

### Verification Phase G (v2)

1. Employee là assignedPerson trên 1 StoreTask → Section 1 xuất hiện với task đó
2. Employee là worker (UserTask) nhưng không phải assignedPerson → Section 2 xuất hiện
3. Employee vừa là phụ trách vừa là worker trên 2 task khác nhau → cả 2 section đều xuất hiện
4. Employee không có task nào → cả 2 section ẩn, hiển thị "Không có công việc"
5. Section 1 badge `👑 Phụ trách`, Section 2 badge `🔧 Thực hiện`

---

## Phase K — Employee Dashboard: Task Detail Modal + Confirm + Assign Item + Upload Evidence

### Tổng quan

Thêm modal chi tiết task full-featured vào Employee Dashboard. Modal này có 4 tính năng:
1. Xem chi tiết công việc
2. Xác nhận đã nhận việc (confirm)
3. Giao checklist item cho nhân viên khác (người phụ trách)
4. Upload ảnh báo cáo + nộp kết quả

**Quyết định đã xác nhận:**
- Worker được tạo UserTask riêng → sửa `storeTaskController.assignEmployees` (K-1)
- Popup chọn nhân viên tái sử dụng `GET /api/employees?limit=800` + filter local theo `branchId` (giống `loadStoreEmployees` trong admin-dashboard.js), không tạo endpoint mới
- Upload + Submit nằm trong modal chi tiết, không trang riêng
- Giao checklist item: nút `👤 Giao` trên từng item trong modal, click mở popup chọn nhân viên (single-select, layout giống `#storeEmployeesModal` trong admin)

---

### K-1. Backend: Tạo UserTask cho TẤT CẢ người phụ trách

**File:** `src/controllers/storeTaskController.js` — `assignEmployees()`

Không còn khái niệm "worker" từ admin. Tất cả người được chọn đều là người phụ trách, MỖI người có UserTask riêng với checklist đầy đủ:

```
employee[0] = assignedPersonId (phụ trách chính / primary contact)
employee[1..n] = các người phụ trách khác (đồng phụ trách)
TẤT CẢ → UserTask với checklist đầy đủ, status = 'assigned'
```

- Người phụ trách tự quản lý checklist của mình — có thể giao item cho BẤT KỲ nhân viên cùng chi nhánh
- Nếu đã có UserTask: skip tạo mới
- Gửi notification cho tất cả

---

### K-2. Backend: Worker confirm nhận việc

**File:** `src/controllers/userTaskController.js` — `confirmTask()`

Hiện tại chỉ cho phép assignedPerson và set `storeTask.status = 'in_progress'`. Mở rộng logic:

| Caller | Hành động |
|--------|-----------|
| assignedPerson | `storeTask.status = 'in_progress'`, `startedAt = now`, `userTask.status = 'in_progress'` *(giữ nguyên)* |
| worker | `userTask.status = 'in_progress'` **chỉ vậy thôi** — không ảnh hưởng StoreTask |

Cả 2 trường hợp: yêu cầu `userTask.status === 'assigned'` trước khi confirm.

---

### K-3. Backend: Đảm bảo employee gọi được `GET /api/employees`

**File:** `src/routes/employeeRoutes.js`

Kiểm tra và đảm bảo `GET /api/employees` cho phép `employee` role (cần để load danh sách nhân viên cùng chi nhánh khi mở popup giao item).

---

### K-4. Frontend: Thêm 2 modal vào `dashboard.ejs`

**File:** `src/views/pages/employee/dashboard.ejs`

Thêm sau `#emptyState`:

**Modal 1 — `#taskDetailModal`** (modal chi tiết task):

```
┌─────────────────────────────────────────┐
│ [Tên task]  [👑 Phụ trách / 🔧 Thực hiện]  ✕ │
├─────────────────────────────────────────┤
│ 📅 Hạn: ...   🔴 Ưu tiên: ...   Status  │
│ ─────────────────────────────────────── │
│ Checklist:                              │
│  ⬜ Item 1      [👤 Giao → Nguyễn A]    │  ← chỉ phụ trách thấy nút Giao
│  ✅ Item 2      [👤 Giao]               │
│  ⬜ Item 3      [👤 Giao → (chưa giao)] │
│ ─────────────────────────────────────── │
│ 📷 Ảnh báo cáo:  [+ Thêm ảnh]          │  ← ẩn nếu status=assigned/submitted
│  [thumb1] [thumb2]                      │
├─────────────────────────────────────────┤
│ [Hủy]        [✅ Xác nhận nhận việc]    │  ← status=assigned
│              [📤 Nộp báo cáo]          │  ← status=in_progress
│              [Đã nộp — chờ duyệt]      │  ← status=submitted (disabled)
└─────────────────────────────────────────┘
```

**Modal 2 — `#assignItemModal`** (popup chọn NV, `z-[60]` để nằm trên modal 1):

Layout tái sử dụng hoàn toàn từ `#storeEmployeesModal` trong admin/dashboard.ejs:
```
┌──────────────────────────────┐
│ Giao việc cho nhân viên   ✕  │
│ [🔍 Tìm kiếm nhân viên...]  │
├──────────────────────────────┤
│ ☐ 👤 Nguyễn Văn A           │  ← single-select (chỉ 1 người/item)
│    📞 0987...  💼 Sale      │
│ ☐ 👤 Trần Thị B             │
│    📞 0912...  💼 Kho       │
├──────────────────────────────┤
│  [Hủy]    [✅ Xác nhận giao] │
└──────────────────────────────┘
```

---

### K-5. Frontend: JS logic trong `employee-dashboard.js`

**File:** `public/js/employee-dashboard.js`

Thêm state variables:
```js
let currentDetailTask = null;   // UserTask object đang mở modal
let currentDetailRole = null;   // 'responsible' | 'worker'
let assignItemContext = null;   // { userTaskId, itemId }
let assignItemEmployees = [];   // danh sách NV đã load
let selectedAssignEmployee = null; // NV được chọn trong popup
```

Thêm các functions:

| Function | Trigger | Mô tả |
|----------|---------|-------|
| `openTaskDetail(taskId, role)` | Nút `Xem chi tiết` trên card | `GET /api/my-tasks/:id` → populate `#taskDetailModal`, set footer theo status |
| `renderModalChecklist(checklist, isResponsible)` | Trong `openTaskDetail` | Render từng item + nút `👤 Giao` (chỉ nếu `isResponsible`) |
| `handleConfirmTask()` | Nút `Xác nhận đã nhận việc` | `POST /api/my-tasks/:id/confirm` → toast → reload |
| `openAssignItemModal(userTaskId, itemId)` | Nút `👤 Giao` trên checklist item | Load TẤT CẢ NV cùng chi nhánh (không giới hạn bởi assignedEmployees) |
| `loadAssignableEmployees(storeId)` | Trong `openAssignItemModal` | `GET /api/employees?limit=800` → filter `ID_Branch._id === storeId` AND `Status === 'Đang hoạt động'` AND `_id !== currentEmployee._id` — KHÔNG filter theo assignedEmployees |
| `renderAssignItemEmployees(employees)` | Sau load | Render card với radio/single-checkbox giống admin `renderStoreEmployees` |
| `handleConfirmAssignItem()` | Nút `Xác nhận giao` trong popup | `PUT /api/my-tasks/:userTaskId/assign-item` → đóng popup → cập nhật UI item |
| `handleUploadAndSubmit()` | Nút `Nộp báo cáo` | Upload ảnh → gắn evidence → submit task |

**Flow upload:**
```
[input file] → FileReader preview thumbnail
             → click Nộp
             → POST /api/upload/photos (multipart, field photos[], max 5)
             → nhận [{url, filename}]
             → POST /api/my-tasks/:id/evidence  {evidences: [{type:'photo', url, filename}]}
             → POST /api/my-tasks/:id/submit
             → toast ✅ → reload
```

**Cập nhật `renderResponsibleTasks` và `renderMyTasks`:** Thêm nút `🔍 Xem chi tiết` vào mỗi card, gọi `openTaskDetail(taskId, 'responsible'|'worker')`.

---

### Endpoint tái sử dụng (không cần API mới)

| Endpoint | Dùng cho |
|----------|---------|
| `GET /api/my-tasks/:id` | Load chi tiết task vào modal |
| `POST /api/my-tasks/:id/confirm` | Xác nhận nhận việc (đã có) |
| `PUT /api/my-tasks/:id/assign-item` | Giao checklist item (đã có) |
| `POST /api/upload/photos` | Upload ảnh evidence (max 5, field `photos[]`) |
| `POST /api/my-tasks/:id/evidence` | Gắn ảnh vào task (đã có) |
| `POST /api/my-tasks/:id/submit` | Nộp báo cáo (đã có) |
| `GET /api/employees?limit=800` | Danh sách NV, filter local theo branchId |

---

---

### K-6. Frontend: Duyệt kết quả worker (chỉ người phụ trách)

**Backend:** Đã có — `PUT /api/my-tasks/:id/review-item` → `reviewChecklistItem()`, không cần thêm API.

**Scope:** Chỉ hiển thị UI review với người phụ trách (`role === 'responsible'`) đối với các checklist item đã có `assignedTo !== null`.

#### Trạng thái hiển thị per item

| Điều kiện | Hiển thị |
|-----------|---------|
| `assignedTo === null` | Không có nút review (item tự làm) |
| `assignedTo !== null` && `isCompleted === false` | ⏳ Chờ worker hoàn thành |
| `assignedTo !== null` && `isCompleted === true` && `reviewStatus === null` | `[✅ OK]` `[❌ Không OK]` |
| `reviewStatus === 'approved'` | Badge xanh "✅ Đã duyệt" |
| `reviewStatus === 'rejected'` | Badge đỏ "❌ Từ chối" + hiện `reviewNote` |

#### Flow "OK"
```
Click [✅ OK]
→ PUT /api/my-tasks/:userTaskId/review-item { itemId, action: 'approve' }
→ cập nhật UI item → badge "✅ Đã duyệt"
→ storeTask.completionRate tự cập nhật (backend xử lý)
```

#### Flow "Không OK"
```
Click [❌ Không OK]
→ inline textarea "Lý do từ chối..." xuất hiện ngay dưới item
→ Nhập lý do → click [Xác nhận]
→ PUT /api/my-tasks/:userTaskId/review-item { itemId, action: 'reject', reviewNote }
→ cập nhật UI item → badge "❌ Từ chối" + hiện lý do
```

#### Hàm JS cần thêm trong `employee-dashboard.js`

| Function | Mô tả |
|----------|-------|
| `renderReviewButtons(item, userTaskId)` | Sinh HTML nút OK/Không OK dựa vào `reviewStatus` & `isCompleted` |
| `handleReviewItem(userTaskId, itemId, action)` | Gọi `PUT /api/my-tasks/:id/review-item`, cập nhật DOM |
| `showRejectNoteInput(itemEl)` | Hiện inline textarea, gắn confirm handler |

> **Lưu ý:** `renderModalChecklist` (K-5) cần được sửa để gọi `renderReviewButtons` khi `isResponsible === true`.

---

### K-7. Tin nhắn / bình luận trong task (messages)

**Backend:** Chưa có — cần thêm schema, route, controller.

#### Thiết kế schema

Thêm vào **StoreTask** (1 luồng chung cho cả nhóm, tất cả thành viên thấy):

```js
// src/models/StoreTask.js
messages: [
  {
    senderId:   { type: ObjectId, ref: 'Employee', required: true },
    senderName: { type: String },          // snapshot tên, tránh populate mỗi lần
    text:       { type: String, required: true, maxlength: 1000 },
    createdAt:  { type: Date, default: Date.now }
  }
]
```

> **Lý do chọn StoreTask thay vì UserTask:** Mọi thành viên (assignedPerson + workers) đều liên kết với cùng 1 StoreTask. Chỉ cần 1 luồng chat, dễ load khi mở modal.

#### Backend cần thêm

**Controller:** `src/controllers/storeTaskController.js`

```js
// Thêm 2 hàm
getTaskMessages(req, res)   // GET /api/store-tasks/:id/messages
addTaskMessage(req, res)    // POST /api/store-tasks/:id/messages
```

Validation `addTaskMessage`:
- Lấy storeTask từ `storeTaskId` của UserTask của user hiện tại
- Chỉ cho phép employee thuộc task (assignedPerson hoặc worker) gửi / đọc
- Limit load: 50 tin nhắn mới nhất (`sort: { createdAt: -1 }, limit: 50` → reverse khi render)

**Route:** `src/routes/storeTaskRoutes.js`

```js
router.get('/:id/messages',  authenticate, authorize('employee', 'manager', 'admin'), storeTaskController.getTaskMessages);
router.post('/:id/messages', authenticate, authorize('employee', 'manager', 'admin'), storeTaskController.addTaskMessage);
```

#### Frontend

**Tab trong `#taskDetailModal`:** Thêm 2 tab ở header modal:

```
[📋 Chi tiết] [💬 Tin nhắn (3)]
```

**Layout tin nhắn (bubble UI):**
- Tin của mình: bong bóng bên phải, màu primary
- Tin của người khác: bong bóng bên trái, màu xám + hiển thị `senderName`
- Timestamp `HH:mm dd/MM`

**Hàm JS cần thêm trong `employee-dashboard.js`**

| Function | Mô tả |
|----------|-------|
| `loadMessages(storeTaskId)` | `GET /api/store-tasks/:id/messages` → render |
| `renderMessages(messages)` | Sinh bong bóng chat |
| `sendMessage(storeTaskId)` | `POST /api/store-tasks/:id/messages { text }` → prepend tin mới |
| `switchModalTab(tab)` | Toggle giữa 'detail' và 'messages' |

**Polling:** Load lại mỗi 15 giây khi tab "Tin nhắn" đang mở (dùng `setInterval`, clear khi đóng modal).

---

### Files cần sửa (Phase K)

| File | Step | Thay đổi |
|------|------|---------|
| `src/controllers/storeTaskController.js` | K-1, K-7 | Tạo UserTask cho workers; thêm `getTaskMessages`, `addTaskMessage` |
| `src/controllers/userTaskController.js` | K-2 | Sửa `confirmTask` cho phép worker confirm |
| `src/routes/employeeRoutes.js` | K-3 | Đảm bảo `GET /api/employees` accessible bởi employee role |
| `src/routes/storeTaskRoutes.js` | K-7 | Thêm 2 route message |
| `src/models/StoreTask.js` | K-7 | Thêm `messages[]` vào schema |
| `src/views/pages/employee/dashboard.ejs` | K-4 | Thêm `#taskDetailModal` (2 tab) + `#assignItemModal` |
| `public/js/employee-dashboard.js` | K-5, K-6, K-7 | State vars + functions mới + card render + review buttons + chat UI |

### Verification Phase K

1. Admin giao task cho 3 người → cả 3 thấy task (Section 1 assignedPerson, Section 2 hai workers)
2. Worker click `Xem chi tiết` → modal mở, hiện thông tin task + checklist + nút `Xác nhận đã nhận việc`
3. Worker confirm → status card `Mới giao → Đang làm`, StoreTask không thay đổi status
4. AssignedPerson mở modal → thấy nút `👤 Giao` trên từng checklist item
5. Click `Giao` → popup hiện danh sách NV cùng chi nhánh (layout giống admin, single-select) → chọn 1 → item cập nhật tên NV
6. AssignedPerson chọn ảnh → preview → click `Nộp báo cáo` → status chuyển `submitted`, toast xác nhận
7. Task đã nộp → nút `Đã nộp — chờ duyệt` disabled
8. Worker đánh dấu hoàn thành checklist item → AssignedPerson thấy `[✅ OK]` `[❌ Không OK]` trên item đó
9. AssignedPerson click OK → badge "✅ Đã duyệt"; click Không OK + lý do → badge "❌ Từ chối" + reviewNote
10. Worker nhận notification khi item bị review (đã có trong backend `reviewChecklistItem`)
11. Mở tab 💬 Tin nhắn → load được 50 tin gần nhất, hiện bubble UI
12. Gửi tin → xuất hiện ngay bên phải; refresh sau 15s → cập nhật tin mới từ người khác
13. `POST /api/employees` vẫn 404 (không thể tạo nhân viên)

---

## Phase L — Bugfix: Auto-heal UserTask cho nhân viên được giao item (data cũ)

### Nguyên nhân lỗi

Code ssignChecklistItem cũ (trước 21/3/2026) chỉ lưu checklist.assignedTo vào UserTask của người phụ trách, **không tạo UserTask** cho nhân viên được giao. Kết quả: nhân viên được giao (VD: Đoàn Thuỳ Dương) không có UserTask → dashboard hiển thị 0 task.

Code mới (21/3) đã fix cho các assignment tương lai, nhưng data cũ vẫn bị thiếu UserTask.

**Bugs cần fix:**

| # | Lỗi | File | Dòng |
|---|-----|------|------|
| L-1 | Auto-heal: tạo UserTask thiếu khi load dashboard | dashboardController.js | Section 2 |
| L-2 | Sai enum: 'Nghỉ việc' ≠ 'Đã nghỉ việc' trong Employee model | userTaskController.js | ssignChecklistItem |

---

### L-1. src/controllers/dashboardController.js — Auto-heal trong getEmployeeDashboard()

Thêm block **sau** khi build esponsibleStoreTaskIds, **trước** khi query Section 2:

**Logic:**
1. Tìm tất cả UserTask có checklist.assignedTo === currentUser._id (dùng multikey index)
2. Lấy danh sách storeTaskId từ kết quả
3. Kiểm tra employee đã có UserTask cho các storeTask đó chưa
4. Với những storeTask còn thiếu → tạo UserTask rỗng (checklist: [], status: 'assigned')
5. Section 2 query chạy SAU auto-heal → bắt được UserTask mới tạo

**Tại sao auto-heal ở đây (không phải endpoint riêng):**
- Không cần migration script
- Tự động sửa mọi data cũ khi nhân viên mở dashboard
- Idempotent: chạy nhiều lần không tạo duplicate (do có existingTargetTask check)
- Index { 'checklist.assignedTo': 1 } đã có → query nhanh

---

### L-2. src/controllers/userTaskController.js — Fix enum Status

`js
// SAI:
if (targetEmployee.Status === 'Nghỉ việc')

// ĐÚNG (theo Employee model enum):
if (targetEmployee.Status === 'Đã nghỉ việc')
`

---

### Files cần sửa (Phase L)

| File | Thay đổi |
|------|---------|
| src/controllers/dashboardController.js | L-1: auto-heal block trước Section 2 |
| src/controllers/userTaskController.js | L-2: fix enum 'Nghỉ việc' → 'Đã nghỉ việc' |

---

### Verification Phase L

1. Nhân viên được giao item bởi người phụ trách (cũ hoặc mới) → mở dashboard → **tự động thấy task trong Section 2**
2. Mở chi tiết task → thấy đúng item được giao cho mình (ssignedItems)
3. Dashboard của người phụ trách không bị ảnh hưởng
4. Giao item cho nhân viên đã nghỉ việc → hiện lỗi đúng
