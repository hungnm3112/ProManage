/**
 * TESTING INSTRUCTIONS - Admin Dashboard 403 Error
 * 
 * Vấn đề: Lỗi 403 Forbidden khi truy cập /admin/dashboard
 * 
 * Nguyên nhân có thể:
 * 1. User đăng nhập KHÔNG có role 'admin'
 * 2. Token không đúng format hoặc expired
 * 3. Employee không thuộc GroupUser admin positions
 * 
 * ADMIN POSITIONS (theo authHelper.js):
 * - Tổng giám đốc
 * - Kho tổng
 * - Phó tổng giám đốc
 * - Giám đốc khu vực
 * - Phó giám đốc
 * 
 * CÁCH DEBUG:
 * 
 * 1. Mở Chrome DevTools (F12) → Console tab
 * 
 * 2. Đăng nhập lại và kiểm tra:
 *    - Token có được lưu không?
 *    - Employee role là gì?
 * 
 * 3. Check console logs:
 *    [Admin Dashboard] Token: exists
 *    [Admin Dashboard] Employee data: {...}
 *    [Admin Dashboard] Employee role: employee  ← NẾU KHÔNG PHẢI 'admin' → LỖI
 * 
 * 4. Nếu role !== 'admin', cần:
 *    a) Đăng nhập bằng account có GroupUser là 1 trong 5 chức vụ admin
 *    b) HOẶC test với Manager/Employee dashboard
 * 
 * TESTING STEPS:
 * 
 * Bước 1: Check employee trong database
 * ```javascript
 * // Trong MongoDB Compass hoặc mongosh
 * db.employees.aggregate([
 *   {
 *     $lookup: {
 *       from: 'groupusers',
 *       localField: 'ID_GroupUser',
 *       foreignField: '_id',
 *       as: 'groupUser'
 *     }
 *   },
 *   { $unwind: '$groupUser' },
 *   {
 *     $match: {
 *       'groupUser.Name': {
 *         $in: [
 *           'Tổng giám đốc',
 *           'Kho tổng',
 *           'Phó tổng giám đốc',
 *           'Giám đốc khu vực',
 *           'Phó giám đốc'
 *         ]
 *       },
 *       Status: 'Đang hoạt động'
 *     }
 *   },
 *   {
 *     $project: {
 *       Phone: 1,
 *       FullName: 1,
 *       'groupUser.Name': 1
 *     }
 *   }
 * ])
 * ```
 * 
 * Bước 2: Login với admin account
 * ```bash
 * curl -X POST http://localhost:5000/api/auth/login \
 *   -H "Content-Type: application/json" \
 *   -d '{
 *     "phone": "0393588269",
 *     "password": "123456"
 *   }'
 * ```
 * 
 * Bước 3: Check response
 * ```json
 * {
 *   "success": true,
 *   "token": "eyJhbGciOiJIUzI1NiIs...",
 *   "employee": {
 *     "role": "admin",  ← PHẢI LÀ 'admin'
 *     "fullName": "...",
 *     "groupUser": "Tổng giám đốc"  ← Confirm position
 *   }
 * }
 * ```
 * 
 * Bước 4: Test API trực tiếp
 * ```bash
 * # Thay YOUR_TOKEN bằng token từ bước 2
 * curl -X GET http://localhost:5000/api/dashboard/admin \
 *   -H "Authorization: Bearer YOUR_TOKEN"
 * ```
 * 
 * NẾU VẪN BỊ 403:
 * - Check JWT token decode: https://jwt.io/
 * - Verify payload có field 'role': 'admin'
 * - Check ACCESS_TOKEN_SECRET trong .env match với token
 * 
 * WORKAROUND TẠM THỜI (CHỈ ĐỂ TEST):
 * - Truy cập /manager/dashboard hoặc /employee/dashboard thay vì /admin/dashboard
 * - Hoặc tạo test account với admin position trong DB
 * 
 * VÍ DỤ TẠO ADMIN USER (MongoDB):
 * ```javascript
 * // 1. Tìm hoặc tạo GroupUser admin
 * db.groupusers.insertOne({
 *   Name: 'Tổng giám đốc',
 *   Status: '1'
 * });
 * 
 * // 2. Lấy _id của GroupUser vừa tạo
 * const adminGroupId = db.groupusers.findOne({ Name: 'Tổng giám đốc' })._id;
 * 
 * // 3. Update employee test
 * db.employees.updateOne(
 *   { Phone: '0393588269' },
 *   { 
 *     $set: { 
 *       ID_GroupUser: adminGroupId,
 *       Status: 'Đang hoạt động'
 *     } 
 *   }
 * );
 * ```
 * 
 * SAU KHI FIX:
 * 1. Clear localStorage: localStorage.clear()
 * 2. Đăng nhập lại
 * 3. Truy cập /admin/dashboard
 * 4. Check console không còn lỗi 403
 */

// Quick test function - Paste vào browser console
function debugAuth() {
  const token = localStorage.getItem('token');
  const employee = JSON.parse(localStorage.getItem('employee') || '{}');
  
  console.log('=== AUTH DEBUG ===');
  console.log('Token:', token ? 'EXISTS' : 'MISSING');
  console.log('Employee:', employee);
  console.log('Role:', employee.role);
  console.log('Expected role:', 'admin');
  console.log('Match:', employee.role === 'admin');
  
  if (!token) {
    console.error('❌ No token found - Please login first');
  } else if (employee.role !== 'admin') {
    console.error(`❌ Role mismatch - Current: ${employee.role}, Required: admin`);
    console.log('💡 Solution: Login with admin account (Tổng giám đốc, Kho tổng, etc.)');
  } else {
    console.log('✅ Authentication OK - Role is admin');
  }
}

// Auto-run on page load
if (typeof window !== 'undefined') {
  console.log('📋 Paste debugAuth() vào console để check authentication status');
}
