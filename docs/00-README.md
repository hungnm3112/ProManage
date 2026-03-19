# 📚 PROMANAGE DOCUMENTATION

**Cập nhật:** 20/03/2026  
**Phiên bản:** 2.1 - Enhanced Documentation Complete  

---

## 📖 MỤC LỤC CHÍNH

### 📋 Core Documentation

1. **[01-BUSINESS-LOGIC.md](01-BUSINESS-LOGIC.md)** ⭐  
   **Logic nghiệp vụ chi tiết** - Source of Truth cho tất cả workflows
   - 9 quy trình nghiệp vụ hoàn chỉnh
   - Quy tắc, validation, state transitions
   - Đây là nguồn chân lý - Code PHẢI tuân theo file này

2. **[02-DATABASE-SCHEMA.md](02-DATABASE-SCHEMA.md)**  
   **Database schema hoàn chỉnh** - Tất cả models, relationships, indexes
   - 7 models (3 READ-ONLY, 4 writable)
   - Relationships và constraints
   - Example documents

3. **[03-API-REFERENCE.md](03-API-REFERENCE.md)**  
   **API Reference đầy đủ** - 46 endpoints với examples
   - Request/Response formats
   - Authentication & Authorization
   - cURL examples và test cases

4. **[04-IMPLEMENTATION-STATUS.md](04-IMPLEMENTATION-STATUS.md)**  
   **Trạng thái triển khai** - Features nào đã hoàn thành
   - ✅ Working features
   - ⚠️ Known bugs
   - 🚧 In progress
   - 📋 Planned

5. **[05-KNOWN-ISSUES.md](05-KNOWN-ISSUES.md)**  
   **Bug registry & tracking** - Lịch sử bugs đã sửa và chưa sửa
   - Recently fixed bugs
   - Active bugs
   - Known limitations
   - Workarounds

6. **[06-DEVELOPMENT-WORKFLOW.md](06-DEVELOPMENT-WORKFLOW.md)** ⭐  
   **Quy trình phát triển** - Workflow 6 bước bắt buộc
   - Logic MD → API Check → Code → Test → Debug → Update Docs
   - Rules: NEVER code without MD first
   - Templates và checklists

7. **[FEATURE-CHECKLIST.md](FEATURE-CHECKLIST.md)** 📝  
   **Template feature mới** - Checklist đầy đủ cho mọi feature
   - Copy template này khi bắt đầu feature
   - Track progress qua 6 bước
   - Example walkthrough thực tế

8. **[CHANGELOG.md](CHANGELOG.md)**  
   **Lịch sử thay đổi** - Track tất cả updates
   - Feature additions
   - Bug fixes
   - Breaking changes

---

## 🚀 QUICK START

### 📝 Đọc gì trước?

**Nếu bạn là Developer mới:**
1. Đọc [06-DEVELOPMENT-WORKFLOW.md](06-DEVELOPMENT-WORKFLOW.md) TRƯỚC TIÊN
2. Đọc [01-BUSINESS-LOGIC.md](01-BUSINESS-LOGIC.md) để hiểu hệ thống
3. Đọc [02-DATABASE-SCHEMA.md](02-DATABASE-SCHEMA.md) để hiểu data model
4. Đọc [03-API-REFERENCE.md](03-API-REFERENCE.md) khi cần gọi API

**Nếu bạn fix bug:**
1. Kiểm tra [05-KNOWN-ISSUES.md](05-KNOWN-ISSUES.md) xem bug đã biết chưa
2. Đọc workflow liên quan trong [01-BUSINESS-LOGIC.md](01-BUSINESS-LOGIC.md)
3. Fix theo quy trình trong [06-DEVELOPMENT-WORKFLOW.md](06-DEVELOPMENT-WORKFLOW.md)
4. Cập nhật [05-KNOWN-ISSUES.md](05-KNOWN-ISSUES.md) khi fix xong

**Nếu bạn develop feature mới:**
1. ĐỌC [06-DEVELOPMENT-WORKFLOW.md](06-DEVELOPMENT-WORKFLOW.md) - QUY TẮC VÀNG
2. Viết logic trong [01-BUSINESS-LOGIC.md](01-BUSINESS-LOGIC.md) TRƯỚC
3. Update [03-API-REFERENCE.md](03-API-REFERENCE.md) nếu có API mới
4. Code theo MD
5. Test
6. Update [04-IMPLEMENTATION-STATUS.md](04-IMPLEMENTATION-STATUS.md)
7. Update [CHANGELOG.md](CHANGELOG.md)

---

## 🎯 QUY TẮC VÀNG

### ⛔ RULES - BẮT BUỘC TUÂN THỦ

1. **NEVER code without updating MD docs first**
   - Logic PHẢI được viết trong [01-BUSINESS-LOGIC.md](01-BUSINESS-LOGIC.md) trước
   - Code chỉ là implementation của MD
   - Nếu code khác MD → Code sai, không phải MD sai

2. **NEVER trust memory - trust docs**
   - Đọc docs trước khi code
   - Docs là Source of Truth duy nhất
   - Code có thể sai, docs mới đúng (sau khi audit)

3. **ALWAYS update docs when fixing bugs**
   - Fix bug → Cập nhật [05-KNOWN-ISSUES.md](05-KNOWN-ISSUES.md)
   - Fix bug → Cập nhật [CHANGELOG.md](CHANGELOG.md)
   - Fix bug → Review logic trong [01-BUSINESS-LOGIC.md](01-BUSINESS-LOGIC.md)

4. **ALWAYS test after changes**
   - Test theo scenarios trong [01-BUSINESS-LOGIC.md](01-BUSINESS-LOGIC.md)
   - Document test results trong [04-IMPLEMENTATION-STATUS.md](04-IMPLEMENTATION-STATUS.md)

5. **ALWAYS follow the workflow**
   - Xem [06-DEVELOPMENT-WORKFLOW.md](06-DEVELOPMENT-WORKFLOW.md)
   - 6 bước: Logic MD → API → Code → Test → Debug → Update Docs
   - Không skip bước nào

---

## 📂 CẤU TRÚC THƯ MỤC

```
docs/
├── 00-README.md                    ← BẠN ĐANG Ở ĐÂY
├── 01-BUSINESS-LOGIC.md            ← ⭐ SOURCE OF TRUTH - Logic nghiệp vụ
├── 02-DATABASE-SCHEMA.md           ← Database models & relationships
├── 03-API-REFERENCE.md             ← API endpoints với examples
├── 04-IMPLEMENTATION-STATUS.md     ← Feature status tracking
├── 05-KNOWN-ISSUES.md              ← Bug registry
├── 06-DEVELOPMENT-WORKFLOW.md      ← ⭐ QUY TRÌNH PHÁT TRIỂN
├── CHANGELOG.md                    ← Lịch sử changes
│
├── README.md                       ← Project overview (general)
├── TESTING_GUIDE.md                ← Testing strategies
├── UI-GUIDELINES.md                ← UI/UX guidelines
├── DEBUGGING_403.md                ← Debug 403 errors
├── ACCOUNT_SWITCHER.md             ← Account switching feature
│
└── archive/                        ← Old docs (backup)
    ├── TODO.md
    ├── QUICK_REFERENCE.md
    ├── BROADCAST_API.md
    ├── admin/, manager/, employee/
    └── ...
```

---

## 🔍 TÌM KIẾM NHANH

### "Tôi muốn biết workflow X hoạt động thế nào?"
→ [01-BUSINESS-LOGIC.md](01-BUSINESS-LOGIC.md) - Section tương ứng

### "API endpoint Y nhận params gì?"
→ [03-API-REFERENCE.md](03-API-REFERENCE.md) - Tìm endpoint

### "Model Z có fields gì?"
→ [02-DATABASE-SCHEMA.md](02-DATABASE-SCHEMA.md) - Tìm model

### "Feature này đã done chưa?"
→ [04-IMPLEMENTATION-STATUS.md](04-IMPLEMENTATION-STATUS.md)

### "Bug này đã biết chưa?"
→ [05-KNOWN-ISSUES.md](05-KNOWN-ISSUES.md)

### "Làm sao để develop feature mới?"
→ [06-DEVELOPMENT-WORKFLOW.md](06-DEVELOPMENT-WORKFLOW.md)

---

## 🎓 HỌC TỪ HISTORY

### Lesson 1: Code Drift Problem (Đã giải quyết)

**Vấn đề trước đây:**
- Code logic khác docs
- AI generate sai vì đọc outdated docs
- Developer confused, không biết tin code hay docs

**Giải pháp hiện tại:**
- Audit code → Viết docs khớp với reality
- Docs là Source of Truth
- Workflow: MD first, code second
- AI PHẢI đọc docs trước khi generate

### Lesson 2: ID Confusion Bugs (Đã sửa 18/03/2026)

**Vấn đề:**
- Dashboard trả về StoreTask._id
- API reassign cần UserTask._id
- Bug: 404 error khi reassign

**Lesson learned:**
- Document rõ ràng ID types trong [02-DATABASE-SCHEMA.md](02-DATABASE-SCHEMA.md)
- Document API contracts trong [03-API-REFERENCE.md](03-API-REFERENCE.md)
- Test với real data

### Lesson 3: Read-Only Collections (Đã enforce 19/03/2026)

**Vấn đề:**
- Employee, Brand, GroupUser từ hệ thống ngoài
- ProManage chỉ READ, không được WRITE
- Nhưng code có CREATE/UPDATE/DELETE endpoints

**Lesson learned:**
- Document constraints rõ ràng
- Xóa code vi phạm constraints
- AI phải nhớ constraints (lưu trong memory)

---

## 📞 SUPPORT

### "Docs này do ai maintain?"

**Owners:**
- hungnm3112 (Primary)
- AI Agent (Generator & Maintainer)

**Update schedule:**
- Sau mỗi feature mới
- Sau mỗi bug fix
- Sau mỗi refactor

### "Tôi thấy docs sai, làm sao?"

1. Verify code vs docs
2. Nếu code đúng, docs sai → Update docs
3. Nếu docs đúng, code sai → Fix code theo docs
4. Commit với message rõ ràng
5. Update [CHANGELOG.md](CHANGELOG.md)

### "Tôi muốn propose thay đổi lớn?"

1. Tạo document trong `docs/proposals/` (archived)
2. Discuss với team
3. Approve → Update [01-BUSINESS-LOGIC.md](01-BUSINESS-LOGIC.md)
4. Implement theo workflow
5. Update tất cả docs liên quan

---

## ✅ VERIFICATION

**Docs này complete khi:**
- [x] Tất cả 7 core files tồn tại
- [x] 100% workflows documented in 01-BUSINESS-LOGIC.md
- [x] 100% APIs documented in 03-API-REFERENCE.md
- [x] 100% models documented in 02-DATABASE-SCHEMA.md
- [x] Known issues registry hoàn chỉnh
- [x] Workflow được follow nghiêm ngặt
- [x] Code khớp với docs

**Last verified:** 19/03/2026

---

## 📜 VERSION HISTORY

**v2.0 (19/03/2026)** - Tái cấu trúc hoàn toàn
- Archive old docs
- Create Source of Truth documentation
- New workflow: MD → Code → Test → Fix
- 4 audit files complete

**v1.0 (16/03/2026)** - Initial docs
- Basic API documentation
- Scattered docs across multiple folders
- No clear workflow

---

**🎯 HÃY BẮT ĐẦU VỚI [06-DEVELOPMENT-WORKFLOW.md](06-DEVELOPMENT-WORKFLOW.md)**
