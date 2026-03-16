# Employee - Evidence Submission

> **Tính năng chính**: Báo cáo kết quả bằng ảnh, video, tài liệu

## 🎯 Tổng quan

Sau khi hoàn thành 100% checklist, nhân viên **BẮT BUỘC** phải nộp báo cáo (evidence) bao gồm:
- **Ảnh**: Chứng minh đã làm việc (min 1, max 10)
- **Video**: Minh họa chi tiết (optional, max 3)
- **Documents**: Tài liệu kèm theo (optional, max 5)
- **Notes**: Ghi chú chi tiết (required, min 20 ký tự)

---

## 📋 Evidence Requirements

### Được định nghĩa bởi Admin

Khi Admin tạo broadcast, có thể cấu hình:

```javascript
{
  requireEvidence: true,
  evidenceConfig: {
    photos: {
      min: 1,
      max: 10,
      required: true,
      formats: ['jpg', 'jpeg', 'png', 'heic'],
      maxSizePerFile: 10 * 1024 * 1024  // 10MB
    },
    videos: {
      min: 0,
      max: 3,
      required: false,
      formats: ['mp4', 'mov', 'avi'],
      maxSizePerFile: 50 * 1024 * 1024  // 50MB
    },
    documents: {
      min: 0,
      max: 5,
      required: false,
      formats: ['pdf', 'doc', 'docx', 'xls', 'xlsx'],
      maxSizePerFile: 20 * 1024 * 1024  // 20MB
    },
    notes: {
      required: true,
      minLength: 20,
      maxLength: 1000
    }
  }
}
```

### Hiển thị cho nhân viên

```
┌─────────────────────────────────────┐
│ 📋 Yêu cầu báo cáo:                 │
├─────────────────────────────────────┤
│ 📷 Ảnh: 1-10 (Bắt buộc)            │
│ 🎥 Video: 0-3 (Không bắt buộc)     │
│ 📄 Tài liệu: 0-5 (Không bắt buộc)  │
│ 📝 Ghi chú: Bắt buộc (20+ ký tự)   │
└─────────────────────────────────────┘
```

---

## 📸 Upload Ảnh

### UI

```
┌─────────────────────────────────────────────────┐
│ 📷 Ảnh (1-10 ảnh, bắt buộc)                     │
│                                                  │
│ [📸 Chụp ảnh] [🖼️ Chọn từ thư viện]           │
│                                                  │
│ ┌─────────┬─────────┬─────────┬─────────┐     │
│ │ [🖼️ #1] │ [🖼️ #2] │ [🖼️ #3] │ [+ Thêm]│    │
│ │ 2.3 MB  │ 1.8 MB  │ 3.1 MB  │         │     │
│ │ [🗑️]    │ [🗑️]    │ [🗑️]    │         │     │
│ └─────────┴─────────┴─────────┴─────────┘     │
│                                                  │
│ ✅ 3/10 ảnh (đạt yêu cầu tối thiểu)             │
└─────────────────────────────────────────────────┘
```

### Flow

**Option 1: Chụp ảnh trực tiếp**
```
1. Click [📸 Chụp ảnh]
   ↓
2. Mở camera
   ↓
3. Chụp → Preview
   ↓
4. [Chụp lại] | [Sử dụng ảnh này]
   ↓
5. Upload lên server:
   - Compress ảnh (nếu > 5MB)
   - Upload via Multer
   - Save URL to user_task.evidence.photos[]
   ↓
6. Hiển thị thumbnail
```

**Option 2: Chọn từ thư viện**
```
1. Click [🖼️ Chọn từ thư viện]
   ↓
2. Mở gallery (multi-select)
   ↓
3. Chọn tối đa 10 ảnh
   ↓
4. Upload tất cả
   ↓
5. Hiển thị thumbnails
```

### API Call

```javascript
POST /api/user-tasks/:id/evidence/photos

Content-Type: multipart/form-data

Body: {
  photo: File (binary)
}

Response: {
  success: true,
  file: {
    url: "/uploads/photos/1234567890-photo.jpg",
    filename: "1234567890-photo.jpg",
    size: 2345678,
    uploadedAt: "2026-03-18T14:30:00Z"
  },
  userTask: {
    evidence: {
      photos: [
        { url: "...", filename: "...", uploadedAt: "..." },
        { url: "...", filename: "...", uploadedAt: "..." },
        { url: "...", filename: "...", uploadedAt: "..." }
      ]
    }
  }
}
```

### Validation

**Client-side:**
- Check file format (jpg, jpeg, png, heic)
- Check file size (< 10MB)
- Check số lượng (max 10)

**Server-side (Multer):**
```javascript
const multer = require('multer');

const storage = multer.diskStorage({
  destination: 'uploads/photos/',
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const fileFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|heic/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);
  
  if (mimetype && extname) {
    return cb(null, true);
  }
  cb(new Error('Chỉ chấp nhận file ảnh (jpg, png, heic)'));
};

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter
});
```

---

## 🎥 Upload Video

### UI

```
┌─────────────────────────────────────────────────┐
│ 🎥 Video (0-3 video, không bắt buộc)            │
│                                                  │
│ [🎬 Quay video] [📹 Chọn từ thư viện]          │
│                                                  │
│ ┌─────────────────────────────────────┐        │
│ │ [▶️] video_20260318_143025.mp4      │        │
│ │ Duration: 00:45 | Size: 12.4 MB     │        │
│ │ [🗑️ Xóa]                            │        │
│ └─────────────────────────────────────┘        │
│                                                  │
│ ✅ 1/3 video (không bắt buộc)                   │
└─────────────────────────────────────────────────┘
```

### API Call

```javascript
POST /api/user-tasks/:id/evidence/videos

Content-Type: multipart/form-data

Body: {
  video: File (binary)
}

// Upload có thể mất thời gian
// Hiển thị progress bar:
// [████████░░░░░░░░] 65% Uploading...
```

### Validation

- Format: mp4, mov, avi
- Max size: 50MB per file
- Max files: 3
- Duration: Recommend < 2 minutes

---

## 📄 Upload Documents

### UI

```
┌─────────────────────────────────────────────────┐
│ 📄 Tài liệu (0-5 files, không bắt buộc)         │
│                                                  │
│ [📎 Upload file]                                │
│                                                  │
│ ┌─────────────────────────────────────┐        │
│ │ 📄 bao_cao_kiem_tra.pdf             │        │
│ │ 1.2 MB | Uploaded: 14:35 [🗑️]      │        │
│ └─────────────────────────────────────┘        │
│                                                  │
│ Formats: PDF, DOC, DOCX, XLS, XLSX               │
└─────────────────────────────────────────────────┘
```

### API Call

```javascript
POST /api/user-tasks/:id/evidence/documents

Content-Type: multipart/form-data

Body: {
  document: File (binary)
}
```

---

## 📝 Ghi chú (Notes)

### UI

```
┌─────────────────────────────────────────────────┐
│ 📝 Ghi chú (bắt buộc, tối thiểu 20 ký tự)       │
│                                                  │
│ ┌─────────────────────────────────────────┐    │
│ │ Đã kiểm tra tất cả các hạng mục:        │    │
│ │ - Tủ điện chính: OK, đã vệ sinh         │    │
│ │ - Dây nối đất: OK, không có vấn đề      │    │
│ │ - Cầu dao: OK, hoạt động bình thường    │    │
│ │                                          │    │
│ │ Mọi thứ đều an toàn.                    │    │
│ └─────────────────────────────────────────┘    │
│                                                  │
│ Character count: 156/20 ✅                      │
└─────────────────────────────────────────────────┘
```

### Validation

- **Client-side**: Real-time character count
- **Server-side**: 
  - Min length: 20 characters
  - Max length: 1000 characters
  - Required: true

---

## ✅ Submit Evidence

### UI Button

**Khi chưa đủ requirements:**
```
┌─────────────────────────────────────┐
│ [Hoàn thành & Nộp báo cáo] (Disabled)│
│                                      │
│ ⚠️ Chưa đủ yêu cầu:                 │
│ - Cần thêm ít nhất 1 ảnh            │
│ - Ghi chú quá ngắn (10/20 ký tự)    │
└─────────────────────────────────────┘
```

**Khi đủ requirements:**
```
┌─────────────────────────────────────┐
│ [Hoàn thành & Nộp báo cáo]          │
│                                      │
│ ✅ Đã đủ yêu cầu báo cáo            │
└─────────────────────────────────────┘
```

### Confirmation Modal

```
┌─────────────────────────────────────┐
│ Xác nhận nộp báo cáo                 │
├─────────────────────────────────────┤
│                                      │
│ Task: Kiểm tra hệ thống điện        │
│                                      │
│ Evidence:                            │
│ ✅ 3 ảnh                            │
│ ✅ 1 video                          │
│ ✅ Ghi chú (156 ký tự)              │
│                                      │
│ ⚠️ Sau khi nộp, bạn sẽ chờ TCN      │
│ duyệt. Nếu cần sửa, TCN sẽ yêu cầu  │
│ làm lại.                             │
│                                      │
│ [Hủy]          [Xác nhận nộp]       │
└─────────────────────────────────────┘
```

### API Call

```javascript
POST /api/user-tasks/:id/submit

Body: {
  notes: "Đã kiểm tra tất cả..."
}

Response: {
  success: true,
  userTask: {
    _id: "...",
    status: "submitted",
    submittedAt: "2026-03-18T15:00:00Z",
    completionRate: 100,
    evidence: {
      photos: [{ url: "...", ... }],
      videos: [{ url: "...", ... }],
      documents: [],
      notes: "Đã kiểm tra tất cả...",
      submittedAt: "2026-03-18T15:00:00Z"
    }
  }
}
```

### Hệ thống xử lý

```javascript
// 1. Validation
if (userTask.completionRate < 100) {
  throw new Error('Phải hoàn thành 100% checklist');
}

const config = broadcast.evidenceConfig;

// Check photos
if (config.photos.required && evidence.photos.length < config.photos.min) {
  throw new Error(`Cần ít nhất ${config.photos.min} ảnh`);
}

// Check notes
if (config.notes.required && notes.length < config.notes.minLength) {
  throw new Error(`Ghi chú phải có tối thiểu ${config.notes.minLength} ký tự`);
}

// 2. Update user_task
userTask.status = 'submitted';
userTask.submittedAt = new Date();
userTask.evidence.notes = notes;
userTask.evidence.submittedAt = new Date();

// 3. Update store_task
storeTask.employeesCompleted += 1;

// 4. Notification cho TCN
createNotification({
  userId: storeTask.managerId,
  type: 'employee_submitted',
  title: 'Nhân viên hoàn thành task',
  message: `${user.name} đã hoàn thành và nộp báo cáo`
});
```

---

## 🔄 Revision (Làm lại)

### Khi TCN yêu cầu làm lại

**Notification:**
```
🔔 Cần làm lại task

Task: Kiểm tra hệ thống điện

Phản hồi từ TCN:
"Ảnh bị mờ, chụp lại rõ hơn. Video test cầu dao thiếu."
```

**Evidence bị reset:**
```javascript
// Hệ thống tự động xóa evidence cũ
userTask.evidence = {
  photos: [],
  videos: [],
  documents: [],
  notes: ''
};

// Lưu evidence cũ vào revisions
userTask.revisions.push({
  submittedAt: oldSubmittedAt,
  evidence: oldEvidence,
  review: {
    status: 'rejected',
    comment: "Ảnh bị mờ...",
    reviewedAt: new Date()
  }
});
```

**Nhân viên upload lại:**
- Vào task → Tab "Báo cáo"
- Upload ảnh/video mới
- Nhập notes mới
- Submit lại

---

## 📱 Mobile Considerations

### Camera Integration

**iOS:**
```javascript
// React Native Camera
import { Camera } from 'expo-camera';

const [hasPermission, setHasPermission] = useState(null);

useEffect(() => {
  (async () => {
    const { status } = await Camera.requestCameraPermissionsAsync();
    setHasPermission(status === 'granted');
  })();
}, []);
```

**Android:**
```xml
<!-- AndroidManifest.xml -->
<uses-permission android:name="android.permission.CAMERA" />
<uses-permission android:name="android.permission.READ_EXTERNAL_STORAGE" />
<uses-permission android:name="android.permission.WRITE_EXTERNAL_STORAGE" />
```

### Upload Progress

```
Uploading video...
[████████████░░░░░░░░] 65%
12.4 MB / 19.2 MB
Estimated: 15 seconds remaining
```

---

## 🔗 Liên quan

- **API Reference**: [api-reference.md](api-reference.md#evidence)
- **Task Completion**: [task-completion.md](task-completion.md)
- **Manager Review**: [../manager/employee-review.md](../manager/employee-review.md)
- **Technical Security**: [../technical/security.md](../technical/security.md#file-upload)
