# Fix: Cascade Delete UserTask khi Admin Xóa Task

## Root Cause

Khi admin xóa một UserTask của người phụ trách, `adminController.deleteUserTask()` chỉ xóa:
- ✅ UserTask của người phụ trách (được truyền vào `id`)
- ✅ StoreTask tương ứng

Nhưng **KHÔNG xóa** các UserTask của worker (được tạo tự động trong `assignChecklistItem()` khi người phụ trách giao item cho đồng nghiệp).

```
StoreTask
  ├── UserTask (người phụ trách) ← admin xóa cái này
  └── UserTask (worker)          ← BỊ BỎ LẠI → orphan → worker vẫn thấy task
```

## File cần sửa

`src/controllers/adminController.js` — hàm `deleteUserTask()` (~line 24)

## Fix

Trước khi xóa StoreTask, tìm và xóa **toàn bộ** UserTask cùng `storeTaskId`, đồng thời gửi notification cho tất cả.

### Thay đổi trong `deleteUserTask()`:

```javascript
// CŨ: chỉ xóa StoreTask, không dọn worker UserTasks
if (storeTask) {
  storeTask.assignedEmployees = storeTask.assignedEmployees.filter(
    empId => empId.toString() !== employeeId.toString()
  );
  await StoreTask.findByIdAndDelete(storeTask._id);
}

await UserTask.findByIdAndDelete(id);

await notificationService.createNotification(
  employeeId,
  'task_cancelled',
  'Task đã bị hủy',
  `Task "${broadcastTitle}" đã bị admin hủy`,
  { userTaskId: id }
);

// MỚI: tìm TẤT CẢ UserTask cùng storeTaskId, xóa hết + notify hết
if (storeTask) {
  // Lấy tất cả UserTask cùng storeTask (bao gồm cả worker được assignChecklistItem)
  const allUserTasks = await UserTask.find({ storeTaskId: storeTask._id });

  for (const ut of allUserTasks) {
    await notificationService.createNotification(
      ut.employeeId,
      'task_cancelled',
      'Task đã bị hủy',
      `Task "${broadcastTitle}" đã bị admin hủy`,
      { userTaskId: ut._id }
    );
  }

  // Xóa toàn bộ UserTask + StoreTask
  await UserTask.deleteMany({ storeTaskId: storeTask._id });
  await StoreTask.findByIdAndDelete(storeTask._id);
}
```

> **Lưu ý**: Bỏ `await UserTask.findByIdAndDelete(id)` riêng lẻ vì `deleteMany` đã bao gồm nó.

## Verification

1. **Happy path**: Admin xóa task → worker reload dashboard → task biến mất.
2. **Notification**: Worker nhận thông báo "Task đã bị hủy" sau khi bị xóa.
3. **No orphan**: Kiểm tra DB — không còn UserTask nào có `storeTaskId` trỏ đến StoreTask đã xóa.
4. **Flow khác không ảnh hưởng**: Xóa task không có worker vẫn hoạt động bình thường.