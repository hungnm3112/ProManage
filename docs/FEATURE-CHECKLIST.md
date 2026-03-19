# Feature Development Checklist

> **Template để track development của 1 feature mới**  
> Copy checklist này và điền vào khi bắt đầu feature mới

---

## Feature Information

**Feature Name:** [Tên feature]  
**Developer:** [Tên người làm]  
**Start Date:** [YYYY-MM-DD]  
**Target Completion:** [YYYY-MM-DD]  
**Priority:** [ ] High / [ ] Medium / [ ] Low  
**Status:** [ ] Planning / [ ] In Progress / [ ] Testing / [ ] Done

---

## Step 1: Define Logic in MD ✍️

**Estimated Time:** 15-30 phút  
**File:** `docs/01-BUSINESS-LOGIC.md`

### Checklist:
- [ ] 1.1 - Đọc requirements từ user/ticket
- [ ] 1.2 - Tìm workflow section liên quan trong 01-BUSINESS-LOGIC.md
- [ ] 1.3 - Viết logic mới trong MD:
  - [ ] **Endpoint:** Method + Path
  - [ ] **Quyền:** Role được phép (Admin/Manager/Employee)
  - [ ] **Dữ liệu đầu vào:** Fields, types, validations
  - [ ] **Quy trình:** Step-by-step flow
  - [ ] **Quy tắc nghiệp vụ:** Business rules, constraints
  - [ ] **Tác động:** DB changes, notifications, side effects
- [ ] 1.4 - Review logic với team/lead
- [ ] 1.5 - Get approval để tiếp tục

### Deliverable:
```markdown
#### [Feature Name]

**Endpoint:** [METHOD] /api/[path]

**Quyền:** [Admin/Manager/Employee]

**Dữ liệu đầu vào:**
- `field1` (type, required/optional): Description
- `field2` (type, required/optional): Description

**Quy trình:**
1. Step 1
2. Step 2
3. Step 3

**Quy tắc nghiệp vụ:**
- Rule 1
- Rule 2

**Tác động:**
- DB: Collections affected
- Notifications: Who gets notified
- Side effects: Other impacts
```

**Status:** [ ] Done

---

## Step 2: Check API Impact 🔌

**Estimated Time:** 5-10 phút  
**Files:** `docs/03-API-REFERENCE.md`, `docs/02-DATABASE-SCHEMA.md`

### Checklist:
- [ ] 2.1 - Mở `03-API-REFERENCE.md`
- [ ] 2.2 - Check endpoint đã tồn tại chưa?
  - [ ] Nếu **mới**: Thêm vào section phù hợp
  - [ ] Nếu **cũ**: Update Request/Response schema
- [ ] 2.3 - Document API endpoint:
  - [ ] HTTP Method + Path
  - [ ] Authentication required?
  - [ ] Request body schema
  - [ ] Response schema (success + errors)
  - [ ] Error codes
- [ ] 2.4 - Mở `02-DATABASE-SCHEMA.md`
- [ ] 2.5 - Check DB schema changes:
  - [ ] Thêm fields mới?
  - [ ] Update field types?
  - [ ] Thêm indexes?
  - [ ] Update refs?
- [ ] 2.6 - Document schema changes nếu có

### API Documentation Template:
```markdown
### [METHOD] /api/[path]

**Auth Required:** Yes/No  
**Roles:** [Admin/Manager/Employee]

**Request:**
\`\`\`json
{
  "field1": "value",
  "field2": 123
}
\`\`\`

**Response 200:**
\`\`\`json
{
  "data": {...}
}
\`\`\`

**Errors:**
- 400: Bad Request - Missing fields
- 403: Forbidden - Wrong role
- 404: Not Found - Resource not found
```

**Status:** [ ] Done

---

## Step 3: Implement Code 💻

**Estimated Time:** 30-90 phút  
**Files:** Controllers, Routes, Models, Services

### Checklist:
- [ ] 3.1 - Mở MD file để reference logic
- [ ] 3.2 - **Models** (nếu cần):
  - [ ] Create/Update model in `src/models/`
  - [ ] Define schema theo 02-DATABASE-SCHEMA.md
  - [ ] Add virtuals, methods, statics nếu cần
- [ ] 3.3 - **Routes**:
  - [ ] Add route trong `src/routes/[domain]Routes.js`
  - [ ] Apply middleware: `auth`, `authorize([roles])`
  - [ ] Link to controller function
- [ ] 3.4 - **Controller**:
  - [ ] Create/Update controller in `src/controllers/`
  - [ ] Implement logic theo MD step-by-step:
    - [ ] Step 1: Validate inputs
    - [ ] Step 2: Check permissions
    - [ ] Step 3: Process business logic
    - [ ] Step 4: Update database
    - [ ] Step 5: Handle side effects (notifications, etc)
    - [ ] Step 6: Return response
  - [ ] Add error handling
  - [ ] Add logging (console.log tạm thời OK)
- [ ] 3.5 - **Services** (nếu cần):
  - [ ] Extract complex logic vào services
  - [ ] Keep controllers thin
- [ ] 3.6 - Follow coding patterns:
  - [ ] Consistent naming
  - [ ] Error handling với try/catch
  - [ ] Return proper status codes
  - [ ] Use async/await

### Code Quality Checks:
- [ ] Code follows logic trong MD?
- [ ] All validations implemented?
- [ ] Permissions checked correctly?
- [ ] Error cases handled?
- [ ] No hardcoded values?
- [ ] Comments added cho complex logic?

**Files Modified:**
- [ ] `src/models/[Name].js`
- [ ] `src/routes/[domain]Routes.js`
- [ ] `src/controllers/[domain]Controller.js`
- [ ] `src/services/[name]Service.js` (optional)

**Status:** [ ] Done

---

## Step 4: Test in UI 🧪

**Estimated Time:** 10-20 phút

### Pre-Testing Checklist:
- [ ] 4.1 - Start server: `npm run dev`
- [ ] 4.2 - Server starts without errors?
- [ ] 4.3 - No route conflicts?

### Happy Path Testing:
- [ ] 4.4 - Login với role phù hợp
- [ ] 4.5 - Execute feature action
- [ ] 4.6 - Verify response đúng format
- [ ] 4.7 - Check DB data updated correctly
- [ ] 4.8 - Verify notifications created (nếu có)
- [ ] 4.9 - Check UI reflects changes

### Error Cases Testing:
- [ ] 4.10 - Test **missing fields** → 400 Bad Request
- [ ] 4.11 - Test **wrong role** → 403 Forbidden
- [ ] 4.12 - Test **invalid data** → Validation errors
- [ ] 4.13 - Test **not found cases** → 404 Not Found

### Edge Cases Testing:
- [ ] 4.14 - Test boundary values
- [ ] 4.15 - Test special scenarios từ MD
- [ ] 4.16 - Test concurrent operations (nếu relevant)

### Testing Tools:
```bash
# Browser DevTools
# Network tab → Check request/response

# Postman/cURL
curl -X POST http://localhost:5000/api/[path] \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"field":"value"}'

# MongoDB Compass
# Check DB collections for data changes
```

### Test Results:
- [ ] Happy path: ✅ Pass / ❌ Fail
- [ ] Error cases: ✅ Pass / ❌ Fail
- [ ] Edge cases: ✅ Pass / ❌ Fail

**Status:** [ ] Done (all tests pass) / [ ] Bugs Found (go to Step 5)

---

## Step 5: Debug Loop 🐛

**Triggered if:** Tests fail in Step 4

### Debug Checklist:
- [ ] 5.1 - **Identify bug:**
  - [ ] What's the expected behavior? (check MD)
  - [ ] What's the actual behavior?
  - [ ] What's the difference?
- [ ] 5.2 - **Root cause analysis:**
  - [ ] Add console.log to trace flow
  - [ ] Check request data
  - [ ] Check DB state
  - [ ] Check middleware execution
- [ ] 5.3 - **Decision: MD or Code?**
  - [ ] **MD logic is WRONG:**
    - [ ] Update MD first
    - [ ] Then update code to match MD
    - [ ] Document why logic was wrong
  - [ ] **Code doesn't follow MD:**
    - [ ] Fix code to match MD
    - [ ] Keep MD as-is
- [ ] 5.4 - **Apply fixes**
- [ ] 5.5 - **Return to Step 4** (test again)

### Common Debug Scenarios:

**Scenario 1: 403 Forbidden Error**
- [ ] Check JWT token valid?
- [ ] Check user role correct?
- [ ] Check middleware applied?
- [ ] See: `docs/DEBUGGING_403.md`

**Scenario 2: 400 Bad Request**
- [ ] Check request body matches schema?
- [ ] Check required fields present?
- [ ] Check data types correct?

**Scenario 3: 500 Internal Error**
- [ ] Check server logs
- [ ] Check for null/undefined errors
- [ ] Check DB connection
- [ ] Check async/await usage

**Scenario 4: Logic Error (wrong result)**
- [ ] Re-read MD logic step-by-step
- [ ] Compare code vs MD
- [ ] Find divergence point
- [ ] Fix code or update MD

### Debug Log:
```
Bug #1:
- Expected: [behavior]
- Actual: [behavior]
- Cause: [root cause]
- Fix: [what was changed]
- MD updated? Yes/No
```

**Status:** [ ] All Bugs Fixed (return to Step 4)

---

## Step 6: Update Documentation 📝

**Estimated Time:** 5-15 phút  
**Files:** Multiple docs

### Checklist:
- [ ] 6.1 - Update `docs/04-IMPLEMENTATION-STATUS.md`:
  - [ ] Mark feature as ✅ Done
  - [ ] Or mark as 🐛 Buggy nếu còn issues
  - [ ] Update percentage complete
- [ ] 6.2 - Update `docs/CHANGELOG.md`:
  - [ ] Add entry vào `[Unreleased]` section
  - [ ] Format: `- [TYPE] Description`
  - [ ] Types: ADDED, CHANGED, FIXED, REMOVED
- [ ] 6.3 - Update `docs/05-KNOWN-ISSUES.md`:
  - [ ] Nếu fix bug → Move to "Fixed Bugs" section
  - [ ] Nếu phát hiện bug mới → Add to "Known Issues"
- [ ] 6.4 - **Cleanup code:**
  - [ ] Remove debug console.log statements
  - [ ] Or document in Known Issues (#6) để cleanup sau
  - [ ] Remove commented code
  - [ ] Format code properly
- [ ] 6.5 - **Git commit:**
  - [ ] Stage all changes: `git add .`
  - [ ] Commit với message tiếng Việt
  - [ ] Push to GitHub

### Git Commit Template:
```bash
git commit -m "[type]: Mô tả ngắn gọn feature

- Detail 1: What was implemented
- Detail 2: Files changed
- Detail 3: Testing results
- Update docs: 04-IMPLEMENTATION-STATUS.md, CHANGELOG.md"
```

**Commit Types:**
- `feat:` - New feature
- `fix:` - Bug fix
- `docs:` - Documentation only
- `refactor:` - Code restructure
- `test:` - Add tests

### CHANGELOG Entry:
```markdown
## [Unreleased]

### Added
- [Feature name]: Brief description
- New endpoint: [METHOD] /api/[path]
- Updated [model] schema with [fields]

### Changed
- Updated [workflow] to include [behavior]

### Fixed
- Fixed [bug description] in [component]
```

**Status:** [ ] Done

---

## Final Review ✅

### Quality Checklist:
- [ ] Feature works 100% as specified in MD
- [ ] All test cases pass
- [ ] Documentation updated (MD, API, Status, Changelog)
- [ ] Code follows project patterns
- [ ] No console.log left (or documented in Known Issues)
- [ ] Git committed with clear message
- [ ] Pushed to GitHub

### Files Changed Summary:
```
Modified:
- docs/01-BUSINESS-LOGIC.md
- docs/02-DATABASE-SCHEMA.md (if applicable)
- docs/03-API-REFERENCE.md
- docs/04-IMPLEMENTATION-STATUS.md
- docs/CHANGELOG.md
- src/models/[Name].js (if applicable)
- src/routes/[domain]Routes.js
- src/controllers/[domain]Controller.js
- src/services/[name]Service.js (if applicable)
```

### Time Tracking:
- Step 1 (Define Logic): _____ min
- Step 2 (Check API): _____ min
- Step 3 (Implement): _____ min
- Step 4 (Test): _____ min
- Step 5 (Debug): _____ min (nếu có bugs)
- Step 6 (Update Docs): _____ min
- **Total:** _____ min

### Lessons Learned:
- What went well:
- What could be improved:
- Notes for next feature:

---

## Example: Real Feature Walkthrough

### Feature: Schedule Broadcast

**Step 1: Define Logic**
```markdown
#### Schedule Broadcast

**Endpoint:** POST /api/broadcasts

**Quyền:** Admin only

**Dữ liệu đầu vào:**
- `title` (string, required): Broadcast title
- `content` (string, required): Broadcast content
- `publishAt` (ISO8601 date, optional): Future publish time

**Quy trình:**
1. Validate title, content required
2. Validate publishAt phải là thời gian tương lai
3. Check user is Admin
4. If publishAt exists → status = 'scheduled'
5. If no publishAt → status = 'draft'
6. Create broadcast in DB
7. Return broadcast object

**Quy tắc nghiệp vụ:**
- publishAt phải > current time
- Only Admin can create broadcasts
- Scheduled broadcasts auto-publish at publishAt time (cron job)

**Tác động:**
- DB: Creates Broadcast document
- Notifications: None (notifications created on publish)
- Side effects: Cron job will publish at scheduled time
```

**Step 2: API Impact**
```markdown
### POST /api/broadcasts

**Request:**
{
  "title": "string",
  "content": "string",
  "publishAt": "2026-03-20T10:00:00Z" // optional
}

**Response 201:**
{
  "broadcast": {
    "_id": "...",
    "status": "scheduled",
    "publishAt": "2026-03-20T10:00:00Z"
  }
}

**Errors:**
- 400: publishAt must be future time
- 403: Admin only
```

**Step 3: Code**
```javascript
// controllers/broadcastController.js
exports.createBroadcast = async (req, res) => {
  const { title, content, publishAt } = req.body;
  
  // Step 1: Validate
  if (!title || !content) {
    return res.status(400).json({ error: 'Title and content required' });
  }
  
  // Step 2: Validate publishAt
  let status = 'draft';
  if (publishAt) {
    const publishDate = new Date(publishAt);
    if (publishDate <= new Date()) {
      return res.status(400).json({ error: 'publishAt must be future' });
    }
    status = 'scheduled';
  }
  
  // Step 3: Check Admin
  if (req.user.role !== 'Admin') {
    return res.status(403).json({ error: 'Admin only' });
  }
  
  // Step 4: Create broadcast
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

**Step 4-6:** Test, debug, update docs, commit ✅

---

## Tips & Best Practices

### 🎯 Always:
- ✅ Define logic in MD **before** coding
- ✅ Follow the 6-step workflow
- ✅ Test both happy path & error cases
- ✅ Update docs immediately after feature done
- ✅ Commit with clear Vietnamese messages

### ❌ Never:
- ❌ Skip Step 1 (defining logic in MD)
- ❌ Code without understanding requirements
- ❌ Trust memory - always check docs
- ❌ Skip testing
- ❌ Forget to update documentation

### 💡 Pro Tips:
- Keep MD and Code in sync always
- When in doubt, update MD first
- Test early, test often
- Document edge cases
- Learn from previous bugs

---

**Template Version:** 1.0  
**Created:** 19/03/2026  
**Reference:** [06-DEVELOPMENT-WORKFLOW.md](06-DEVELOPMENT-WORKFLOW.md)
