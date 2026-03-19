# Development Workflow - Quy Trình Phát Triển

> **Version:** 1.0  
> **Last Updated:** 19/03/2026  
> **Status:** ✅ Active

## Mục Lục

1. [Tổng Quan](#tổng-quan)
2. [6 Bước Bắt Buộc](#6-bước-bắt-buộc)
3. [Templates & Examples](#templates--examples)
4. [Decision Trees](#decision-trees)
5. [Common Mistakes](#common-mistakes)

---

## Tổng Quan

### Nguyên Tắc Vàng

**LUÔN LUÔN:**
1. ✅ Viết Logic trong MD **TRƯỚC KHI** code
2. ✅ Update docs **NGAY SAU KHI** fix bug
3. ✅ Test trong UI sau mỗi thay đổi
4. ✅ Follow 6-step workflow không bỏ qua

**KHÔNG BAO GIỜ:**
1. ❌ Code trực tiếp không có MD
2. ❌ Tin vào memory - luôn check docs
3. ❌ Skip testing sau khi thay đổi
4. ❌ Quên update CHANGELOG

---

## 6 Bước Bắt Buộc

### Step 1: Define Logic in MD (15-30 phút)

**Mục đích:** Thiết kế business logic trên giấy trước khi code

**Checklist:**
- [ ] Đọc requirements từ user/ticket
- [ ] Mở `01-BUSINESS-LOGIC.md`
- [ ] Tìm workflow liên quan (Auth, Broadcast, StoreTask, UserTask, Review, Dashboard)
- [ ] Viết/Update logic mới:
  - **Endpoint:** Method + Path
  - **Quyền:** Role được phép (Admin/Manager/Employee)
  - **Dữ liệu đầu vào:** Request body/params
  - **Quy trình:** Step-by-step flow
  - **Quy tắc nghiệp vụ:** Validations, constraints
  - **Tác động:** DB changes, notifications, side effects

**Template:**

```markdown
#### [Feature Name]

**Endpoint:** [GET/POST/PUT/DELETE] /api/[path]

**Quyền:** [Admin/Manager/Employee/Public]

**Dữ liệu đầu vào:**
- `param1` (string, required): Mô tả
- `param2` (number, optional): Mô tả

**Quy trình:**
1. Validate input
2. Check permissions
3. Process logic
4. Update DB
5. Return response

**Quy tắc nghiệp vụ:**
- Rule 1: Điều kiện
- Rule 2: Ràng buộc
- Rule 3: Edge case

**Tác động:**
- DB: Collections affected
- Notifications: Who gets notified
- Side effects: Other workflows impacted
```

**Output:** Logic được document rõ ràng trong MD

---

### Step 2: Check API Impact (5-10 phút)

**Mục đích:** Đảm bảo API đồng bộ với logic mới

**Checklist:**
- [ ] Mở `03-API-REFERENCE.md`
- [ ] Kiểm tra endpoint đã tồn tại chưa
- [ ] Nếu **endpoint mới**:
  - Thêm vào section đúng (Auth/Broadcast/StoreTask/UserTask/Review/Dashboard/ReadOnly/Upload)
  - Document đầy đủ: Method, Path, Auth, Request, Response, Errors
- [ ] Nếu **endpoint cũ**:
  - Update Request/Response schema
  - Update Error codes nếu có thêm
- [ ] Mở `02-DATABASE-SCHEMA.md`
- [ ] Check collections bị ảnh hưởng
- [ ] Update schema nếu thêm/sửa fields

**Decision Tree:**

```
Endpoint mới?
├── YES → Thêm vào 03-API-REFERENCE.md
│         └── Document đầy đủ
└── NO  → Update existing endpoint
          └── Sửa Request/Response nếu cần

DB Schema thay đổi?
├── YES → Update 02-DATABASE-SCHEMA.md
│         └── Thêm fields, indexes, constraints
└── NO  → Skip
```

**Output:** API docs & DB schema đồng bộ

---

### Step 3: Implement Code (30-90 phút)

**Mục đích:** Code theo đúng logic đã define trong MD

**Checklist:**
- [ ] Mở file MD (01-BUSINESS-LOGIC.md) để reference
- [ ] Implement controller/route/service
- [ ] Follow logic step-by-step từ MD
- [ ] Validate inputs theo quy tắc
- [ ] Handle errors theo MD
- [ ] Add logging (console.log tạm thời OK, nhưng đánh dấu để cleanup sau)

**Best Practices:**

```javascript
// ✅ GOOD: Follow MD logic
async function createBroadcast(req, res) {
  // Step 1: Validate theo MD
  const { title, content, publishAt } = req.body;
  if (!title || !content) {
    return res.status(400).json({ error: 'Missing fields' });
  }

  // Step 2: Check permissions theo MD
  if (req.user.role !== 'Admin') {
    return res.status(403).json({ error: 'Admin only' });
  }

  // Step 3: Process logic theo MD
  const broadcast = await Broadcast.create({
    title,
    content,
    status: publishAt ? 'scheduled' : 'draft',
    publishAt,
    createdBy: req.user._id
  });

  // Step 4: Side effects theo MD
  if (broadcast.status === 'published') {
    await createNotifications(broadcast);
  }

  res.status(201).json({ broadcast });
}

// ❌ BAD: Không follow MD, code tự do
async function createBroadcast(req, res) {
  const broadcast = await Broadcast.create(req.body); // Missing validation!
  res.json(broadcast); // Missing permissions check!
}
```

**Output:** Code hoạt động theo đúng MD

---

### Step 4: Test in UI (10-20 phút)

**Mục đích:** Verify code hoạt động đúng trong thực tế

**Checklist:**
- [ ] Start server: `npm run dev`
- [ ] Mở browser/Postman
- [ ] Test **happy path:**
  - Login với role phù hợp
  - Thực hiện action
  - Verify response đúng
  - Check DB data update đúng
- [ ] Test **error cases:**
  - Missing fields → 400 Bad Request
  - Wrong role → 403 Forbidden
  - Invalid data → Validation errors
- [ ] Test **edge cases từ MD:**
  - Boundary values
  - Special scenarios
  - Concurrent operations

**Testing Commands:**

```bash
# Start server
npm run dev

# Test với curl
curl -X POST http://localhost:5000/api/broadcasts \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"title":"Test","content":"Content"}'

# Check logs
# Xem console output để verify flow
```

**Output:** Code tested & verified

---

### Step 5: Debug Loop (10-60 phút)

**Mục đích:** Fix bugs và quyết định sửa code hay sửa MD

**Decision Tree:**

```
Bug found?
├── Logic in MD is WRONG
│   ├── Update MD first
│   ├── Then update code to match MD
│   └── Test again
└── Logic in MD is CORRECT
    ├── Fix code to match MD
    └── Test again

Still broken?
├── Check DEBUGGING_403.md (nếu lỗi 403)
├── Check 05-KNOWN-ISSUES.md (xem có issue liên quan không)
└── Add console.log để trace flow
```

**Common Debug Steps:**

1. **Add logging:**
   ```javascript
   console.log('[DEBUG] Input:', req.body);
   console.log('[DEBUG] User role:', req.user.role);
   console.log('[DEBUG] DB result:', result);
   ```

2. **Check DB state:**
   ```bash
   # MongoDB shell
   use promanage
   db.broadcasts.find().pretty()
   ```

3. **Verify permissions:**
   - Check JWT token valid
   - Check role correct
   - Check middleware applied

4. **Compare with MD:**
   - Re-read logic in 01-BUSINESS-LOGIC.md
   - Verify code matches step-by-step
   - Look for missing validations

**Khi nào update MD vs Code:**

| Scenario | Action |
|----------|--------|
| MD thiếu edge case | Update MD → Update code |
| MD sai logic | Update MD → Update code → Test |
| Code thiếu validation | Update code theo MD |
| Code sai flow | Update code theo MD |
| Requirements thay đổi | Update MD → Update code |

**Output:** Bug fixed, code & MD đồng bộ

---

### Step 6: Update Documentation (5-15 phút)

**Mục đích:** Giữ docs luôn sync với code

**Checklist:**
- [ ] Update `04-IMPLEMENTATION-STATUS.md`:
  - Mark feature as ✅ Done
  - Or mark as 🐛 Buggy nếu còn issues
- [ ] Update `CHANGELOG.md`:
  - Thêm entry vào `[Unreleased]`
  - Format: `- [TYPE] Description (#issue)`
  - Types: FEAT, FIX, DOCS, REFACTOR, TEST
- [ ] Update `05-KNOWN-ISSUES.md` nếu:
  - Fix được bug → Move to "Fixed Bugs"
  - Phát hiện bug mới → Add to "Known Issues"
- [ ] Cleanup console.log:
  - Remove debug logs hoặc
  - Add to Known Issues (#6) để cleanup sau
- [ ] Git commit:
  - Message tiếng Việt
  - Format: `[type]: Mô tả ngắn gọn`

**Git Commit Template:**

```bash
git add .
git commit -m "feat: Thêm tính năng tạo broadcast scheduled

- Thêm logic schedule broadcast trong 01-BUSINESS-LOGIC.md
- Implement API POST /api/broadcasts với publishAt
- Test với Admin role OK
- Update CHANGELOG.md với feature mới"

git push origin main
```

**CHANGELOG.md Entry:**

```markdown
## [Unreleased]

### Added
- Tính năng schedule broadcast với `publishAt` field
- Validation cho scheduled broadcasts phải có thời gian tương lai

### Fixed
- Fix lỗi không check role khi tạo broadcast
```

**Output:** Docs updated, changes committed

---

## Templates & Examples

### Template: New Feature

```markdown
## Feature: [Name]

### Step 1: Define Logic
- File: 01-BUSINESS-LOGIC.md
- Section: [Workflow name]
- Logic: [Describe flow]

### Step 2: Check API
- File: 03-API-REFERENCE.md
- Endpoint: [Method] [Path]
- Changes: [New/Updated]

### Step 3: Code Files
- Controller: `controllers/[name].js`
- Route: `routes/[name].js`
- Model: `models/[Name].js` (if new)

### Step 4: Test Cases
- Happy path: [Scenario]
- Error cases: [Scenarios]
- Edge cases: [Scenarios]

### Step 5: Debug Notes
- Issues found: [List]
- MD updates: [Changes]
- Code fixes: [Changes]

### Step 6: Docs Update
- 04-IMPLEMENTATION-STATUS.md: ✅
- CHANGELOG.md: ✅
- Commit: ✅
```

### Example: Real Workflow (Broadcast Scheduled)

**Step 1: Define Logic**
```markdown
#### Tạo Broadcast Scheduled

**Endpoint:** POST /api/broadcasts

**Quy trình:**
1. Validate title, content, publishAt
2. Check user is Admin
3. If publishAt in future → status = 'scheduled'
4. If no publishAt → status = 'draft'
5. Create broadcast in DB
6. Return broadcast object

**Quy tắc nghiệp vụ:**
- publishAt phải là thời gian tương lai
- Chỉ Admin mới được tạo broadcast
```

**Step 2: Check API**
```markdown
### POST /api/broadcasts

**Request:**
{
  "title": "string",
  "content": "string",
  "publishAt": "ISO8601" // optional
}

**Response 201:**
{
  "broadcast": {
    "_id": "...",
    "status": "scheduled",
    "publishAt": "..."
  }
}
```

**Step 3: Code**
```javascript
// controllers/broadcastController.js
exports.createBroadcast = async (req, res) => {
  const { title, content, publishAt } = req.body;
  
  if (!title || !content) {
    return res.status(400).json({ error: 'Title and content required' });
  }
  
  if (req.user.role !== 'Admin') {
    return res.status(403).json({ error: 'Admin only' });
  }
  
  let status = 'draft';
  if (publishAt) {
    const publishDate = new Date(publishAt);
    if (publishDate <= new Date()) {
      return res.status(400).json({ error: 'publishAt must be future' });
    }
    status = 'scheduled';
  }
  
  const broadcast = await Broadcast.create({
    title,
    content,
    status,
    publishAt,
    createdBy: req.user._id
  });
  
  res.status(201).json({ broadcast });
};
```

**Step 4: Test**
```bash
# Happy path
curl -X POST http://localhost:5000/api/broadcasts \
  -H "Authorization: Bearer ADMIN_TOKEN" \
  -d '{"title":"Test","content":"Content","publishAt":"2026-03-20T10:00:00Z"}'

# Error: Future date required
curl -X POST http://localhost:5000/api/broadcasts \
  -H "Authorization: Bearer ADMIN_TOKEN" \
  -d '{"title":"Test","content":"Content","publishAt":"2026-03-18T10:00:00Z"}'

# Error: Admin only
curl -X POST http://localhost:5000/api/broadcasts \
  -H "Authorization: Bearer MANAGER_TOKEN" \
  -d '{"title":"Test","content":"Content"}'
```

**Step 5: Debug**
- Bug found: Không validate publishAt format
- Fix: Add `new Date(publishAt)` validation
- MD OK, code updated

**Step 6: Update Docs**
```bash
git add .
git commit -m "feat: Thêm scheduled broadcasts

- Thêm logic schedule trong 01-BUSINESS-LOGIC.md
- Validate publishAt phải là thời gian tương lai
- Test với Admin role OK"
```

---

## Decision Trees

### Khi Bắt Đầu Task Mới

```
New task received
│
├─> Is it a bug fix?
│   ├─> YES
│   │   └─> Step 1: Read 05-KNOWN-ISSUES.md
│   │       └─> Find related issue
│   │       └─> Step 2: Read logic in 01-BUSINESS-LOGIC.md
│   │       └─> Step 3: Debug code vs MD
│   │       └─> Step 4: Fix code or MD
│   │       └─> Step 5: Test
│   │       └─> Step 6: Update docs (move to Fixed)
│   └─> NO (New feature)
│       └─> Step 1: Define logic in MD
│       └─> Step 2: Check API impact
│       └─> Step 3: Implement
│       └─> Step 4: Test
│       └─> Step 5: Debug if needed
│       └─> Step 6: Update docs
```

### Khi Code Không Khớp MD

```
Code behavior ≠ MD documentation
│
├─> Which is correct?
│   ├─> MD is CORRECT (code sai)
│   │   └─> Fix code to match MD
│   │   └─> Test again
│   │   └─> Commit
│   │
│   ├─> CODE is CORRECT (MD sai/thiếu)
│   │   └─> Update MD first
│   │   └─> Verify code matches updated MD
│   │   └─> Test again
│   │   └─> Commit (mention MD update)
│   │
│   └─> BOTH WRONG (requirements changed)
│       └─> Re-read requirements
│       └─> Update MD with correct logic
│       └─> Update code to match
│       └─> Test thoroughly
│       └─> Commit
```

### Khi Test Fail

```
Test failed
│
├─> Check error type
│   ├─> 400 Bad Request
│   │   └─> Input validation issue
│   │   └─> Check MD validation rules
│   │   └─> Fix code validators
│   │
│   ├─> 403 Forbidden
│   │   └─> Read DEBUGGING_403.md
│   │   └─> Check JWT token
│   │   └─> Check role in MD
│   │   └─> Fix middleware/permissions
│   │
│   ├─> 500 Internal Error
│   │   └─> Add console.log
│   │   └─> Check DB connection
│   │   └─> Check for null/undefined
│   │   └─> Fix code logic
│   │
│   └─> Logic error (wrong result)
│       └─> Compare code vs MD step-by-step
│       └─> Find divergence point
│       └─> Fix code or MD
```

---

## Common Mistakes

### ❌ Mistake 1: Code First, MD Later

**Wrong:**
```
1. Write code directly
2. Test in UI
3. (Maybe) update MD later
4. Forget what the logic was
```

**Correct:**
```
1. Define logic in MD
2. Write code following MD
3. Test
4. Update MD if needed
```

**Why:** MD-first prevents code drift and ensures documentation accuracy.

---

### ❌ Mistake 2: Trust Memory

**Wrong:**
```
"Tôi nhớ là broadcast có field này..."
"Tôi nghĩ là logic này..."
```

**Correct:**
```
1. Mở 01-BUSINESS-LOGIC.md
2. Đọc logic hiện tại
3. Code theo document
```

**Why:** Memory không đáng tin. Docs là Source of Truth.

---

### ❌ Mistake 3: Skip Testing

**Wrong:**
```
1. Code xong
2. Commit luôn
3. Bug production
```

**Correct:**
```
1. Code xong
2. Test happy path
3. Test error cases
4. Verify trong UI
5. Then commit
```

**Why:** Bugs caught sớm = fix dễ hơn.

---

### ❌ Mistake 4: Forget Update Docs

**Wrong:**
```
1. Fix bug
2. Commit code
3. Không update 05-KNOWN-ISSUES.md
4. Bug xuất hiện lại sau
```

**Correct:**
```
1. Fix bug
2. Update 05-KNOWN-ISSUES.md (move to Fixed)
3. Update CHANGELOG.md
4. Commit cả code + docs
```

**Why:** Tracking bugs prevents regression.

---

### ❌ Mistake 5: Update Code Without Update MD

**Wrong:**
```
1. Requirements thay đổi
2. Sửa code trực tiếp
3. MD vẫn cũ
4. Code drift xảy ra
```

**Correct:**
```
1. Requirements thay đổi
2. Update MD first
3. Update code to match MD
4. Test
5. Commit
```

**Why:** MD-Code sync prevents drift.

---

## Quick Reference

### Workflow Shortcuts

| Task | Files to Check | Time |
|------|---------------|------|
| New feature | 01-BUSINESS-LOGIC.md → 03-API-REFERENCE.md → Code | 1-2h |
| Bug fix | 05-KNOWN-ISSUES.md → 01-BUSINESS-LOGIC.md → Code | 30m-1h |
| Add endpoint | 03-API-REFERENCE.md → Code | 30m |
| Change DB | 02-DATABASE-SCHEMA.md → Code → Migration | 1h |
| Debug 403 | DEBUGGING_403.md → Code | 15-30m |

### Git Commit Types

- `feat:` - New feature
- `fix:` - Bug fix
- `docs:` - Documentation only
- `refactor:` - Code refactor (no behavior change)
- `test:` - Add/update tests
- `chore:` - Maintenance tasks

### File Locations

```
docs/
├── 01-BUSINESS-LOGIC.md     ← Define all workflows here
├── 02-DATABASE-SCHEMA.md    ← Check DB models here
├── 03-API-REFERENCE.md      ← Document endpoints here
├── 04-IMPLEMENTATION-STATUS.md ← Track features here
├── 05-KNOWN-ISSUES.md       ← Track bugs here
├── 06-DEVELOPMENT-WORKFLOW.md ← This file (process guide)
└── CHANGELOG.md             ← Version history
```

---

## Support

**Khi gặp vấn đề:**
1. Check 05-KNOWN-ISSUES.md first
2. Check DEBUGGING_403.md if permissions issue
3. Re-read 01-BUSINESS-LOGIC.md for correct flow
4. Add detailed logging to trace issue
5. Update docs sau khi fix

**Remember:**
- 📖 Docs = Source of Truth
- 🧠 Memory ≠ Reliable
- ✅ Test = Mandatory
- 🔄 Update docs = Always

---

**Version History:**
- v1.0 (19/03/2026): Initial workflow definition
