# Technical - Business Logic

> Core business logic và workflows

## � Database Adapter Layer

### Mapping Schema cũ → Schema mới

Hệ thống hiện tại sử dụng collections `Employee` và `Brand`, cần adapter để map với logic mới.

```javascript
// Model adapters
const EmployeeModel = mongoose.model('Employee');  // Collection: Employee
const BrandModel = mongoose.model('Brand');        // Collection: Brand
const GroupUserModel = mongoose.model('GroupUser'); // Collection: GroupUser

// Helper: Get role từ ID_GroupUser
async function getEmployeeRole(employee) {
  // Tra bảng GroupUser để lấy tên chức vụ
  const groupUser = await GroupUserModel.findById(employee.ID_GroupUser);
  
  if (!groupUser || groupUser.Status !== '1') {
    return 'employee';  // Default role
  }
  
  const positionName = groupUser.Name;
  
  // Admin roles
  const adminPositions = [
    'Tổng giám đốc',
    'Kho tổng',
    'Phó tổng giám đốc',
    'Giám đốc khu vực',
    'Phó giám đốc'
  ];
  
  if (adminPositions.includes(positionName)) {
    return 'admin';
  }
  
  // Manager role
  if (positionName === 'Giám đốc chi nhánh') {
    return 'manager';
  }
  
  // Default: employee
  return 'employee';
}

// Helper: Check if employee is active
function isEmployeeActive(employee) {
  return employee.Status === 'Đang làm việc';
}

// Helper: Verify password (SHA-512 + Salt, không phải bcrypt)
const crypto = require('crypto');

function hashPassword(password, salt) {
  return crypto
    .createHash('sha512')
    .update(password + salt)
    .digest('hex');
}

function verifyPassword(employee, password) {
  const hashed = hashPassword(password, employee.Salt);
  return hashed === employee.Password;
}

// Helper: Get manager của brand
async function getBrandManager(brandId) {
  const manager = await EmployeeModel.findOne({
    ID_Branch: brandId,
    Status: 'Đang làm việc'
  });
  
  const role = await getEmployeeRole(manager);
  if (role !== 'manager') {
    return null;
  }
  
  return manager;
}
```

---

## �🔄 Broadcast Workflow

### 1. Admin tạo Broadcast

```javascript
async function createBroadcast(adminId, data) {
  // Validate
  validateBroadcastData(data);
  
  // Create broadcast
  const broadcast = await Broadcast.create({
    title: data.title,
    description: data.description,
    priority: data.priority,
    deadline: data.deadline,
    assignedStores: data.assignedStores,
    checklist: data.checklist,
    attachments: data.attachments,
    recurring: data.recurring,
    status: 'draft',
    createdBy: adminId
  });
  
  return broadcast;
}
```

### 2. Admin publish Broadcast

```javascript
async function publishBroadcast(broadcastId) {
  const broadcast = await Broadcast.findById(broadcastId);
  
  if (!broadcast || broadcast.status !== 'draft') {
    throw new Error('Invalid broadcast');
  }
  
  // Create store_tasks for each assigned brand
  const storeTasks = await Promise.all(
    broadcast.assignedStores.map(brandId => 
      StoreTask.create({
        broadcastId: broadcast._id,
        storeId: brandId,  // brandId nhưng field vẫn tên storeId
        status: 'pending'
      })
    )
  );
  
  // Send notifications to managers (từ Employee collection)
  const managers = await EmployeeModel.find({
    ID_Branch: { $in: broadcast.assignedStores },  // assignedStores = brandIds
    Status: 'Đang làm việc'
  });
  
  // Filter only managers by checking ID_GroupUser
  const actualManagers = [];
  for (const emp of managers) {
    const role = await getEmployeeRole(emp);
    if (role === 'manager') {
      actualManagers.push(emp);
    }
  }
  
  await Promise.all(
    actualManagers.map(manager =>
      Notification.create({
        userId: manager._id,
        type: 'broadcast_created',
        title: 'Broadcast mới',
        message: `Broadcast: ${broadcast.title}`,
        data: {
          broadcastId: broadcast._id,
          storeTaskId: storeTasks.find(st => 
            st.storeId.equals(manager.ID_Branch)
          )._id
        }
      })
    )
  );
  
  // Update broadcast status
  broadcast.status = 'active';
  broadcast.publishedAt = new Date();
  await broadcast.save();
  
  return {
    broadcast,
    tasksCreated: storeTasks.length,
    notificationsSent: actualManagers.length
  };
}
```

---

## 👨‍💼 Manager Workflow

### 1. Accept broadcast

```javascript
async function acceptBroadcast(managerId, storeTaskId) {
  const manager = await EmployeeModel.findById(managerId);
  const storeTask = await StoreTask.findById(storeTaskId);
  
  // Validate role
  const role = await getEmployeeRole(manager);
  if (role !== 'manager') {
    throw new Error('Forbidden: Not a manager');
  }
  
  // Validate brand
  if (!storeTask.storeId.equals(manager.ID_Branch)) {
    throw new Error('Forbidden');
  }
  
  if (storeTask.status !== 'pending') {
    throw new Error('Task already processed');
  }
  
  // Update status
  storeTask.status = 'accepted';
  storeTask.acceptedAt = new Date();
  await storeTask.save();
  
  return storeTask;
}
```

### 2. Assign to employees

```javascript
async function assignToEmployees(managerId, storeTaskId, employeeIds, note) {
  const manager = await EmployeeModel.findById(managerId);
  const storeTask = await StoreTask.findById(storeTaskId).populate('broadcastId');
  
  // Validate
  if (!storeTask.storeId.equals(manager.ID_Branch)) {
    throw new Error('Forbidden');
  }
  
  // Get employees from Employee collection
  const employees = await EmployeeModel.find({
    _id: { $in: employeeIds },
    ID_Branch: manager.ID_Branch,
    Status: 'Đang làm việc'
  });
  
  if (employees.length !== employeeIds.length) {
    throw new Error('Invalid employees');
  }
  
  // Verify all are employees (not managers/admins)
  for (const emp of employees) {
    const role = await getEmployeeRole(emp);
    if (role !== 'employee') {
      throw new Error('Can only assign to employees');
    }
  }
  
  // Create user_tasks
  const userTasks = await Promise.all(
    employees.map(employee =>
      UserTask.create({
        storeTaskId: storeTask._id,
        employeeId: employee._id,
        broadcastId: storeTask.broadcastId._id,
        status: 'pending',
        checklist: storeTask.broadcastId.checklist.map(item => ({
          task: item.task,
          note: item.note,
          required: item.required,
          isCompleted: false
        }))
      })
    )
  );
  
  // Send notifications
  await Promise.all(
    employees.map(employee =>
      Notification.create({
        userId: employee._id,
        type: 'task_assigned',
        title: 'Task mới',
        message: `Task: ${storeTask.broadcastId.title}`,
        data: {
          taskId: userTasks.find(ut => 
            ut.employeeId.equals(employee._id)
          )._id
        }
      })
    )
  );
  
  // Update store_task
  storeTask.status = 'assigned';
  storeTask.assignedEmployees = employeeIds;
  await storeTask.save();
  
  return {
    userTasksCreated: userTasks.length,
    notifications: employees.length
  };
}
```

### 3. Approve employee task

```javascript
async function approveTask(managerId, userTaskId, feedback, rating) {
  const manager = await EmployeeModel.findById(managerId);
  const userTask = await UserTask.findById(userTaskId).populate('employeeId');
  
  // Validate
  if (!userTask.employeeId.ID_Branch.equals(manager.ID_Branch)) {
    throw new Error('Forbidden');
  }
  
  if (userTask.status !== 'completed') {
    throw new Error('Task not completed yet');
  }
  
  // Update status
  userTask.status = 'approved';
  userTask.approvedAt = new Date();
  userTask.managerFeedback = feedback;
  userTask.rating = rating;
  await userTask.save();
  
  // Send notification to employee
  await Notification.create({
    userId: userTask.employeeId._id,
    type: 'task_approved',
    title: 'Task được duyệt',
    message: `Task đã được duyệt với ${rating} sao`,
    data: {
      taskId: userTask._id,
      rating,
      feedback
    }
  });
  
  // Check if all employees completed
  await checkStoreTaskCompletion(userTask.storeTaskId);
  
  return userTask;
}
```

### 4. Reject employee task

```javascript
async function rejectTask(managerId, userTaskId, reason, details) {
  const manager = await EmployeeModel.findById(managerId);
  const userTask = await UserTask.findById(userTaskId).populate('employeeId');
  
  // Validate
  if (!userTask.employeeId.ID_Branch.equals(manager.ID_Branch)) {
    throw new Error('Forbidden');
  }
  
  // Update status
  userTask.status = 'rejected';
  userTask.rejectedAt = new Date();
  userTask.managerFeedback = details;
  
  // Add to revision history
  userTask.revisionHistory.push({
    version: userTask.revisionHistory.length + 1,
    rejectedAt: new Date(),
    reason: reason
  });
  
  await userTask.save();
  
  // Send notification
  await Notification.create({
    userId: userTask.employeeId._id,
    type: 'task_rejected',
    title: 'Task cần làm lại',
    message: reason,
    data: {
      taskId: userTask._id,
      reason,
      details
    }
  });
  
  return userTask;
}
```

---

## 👤 Employee Workflow

### 1. Upload evidence

```javascript
async function uploadEvidence(employeeId, userTaskId, checklistId, files, note) {
  const userTask = await UserTask.findById(userTaskId);
  
  // Validate
  if (!userTask.employeeId.equals(employeeId)) {
    throw new Error('Forbidden');
  }
  
  // Find checklist item
  const checklistItem = userTask.checklist.id(checklistId);
  if (!checklistItem) {
    throw new Error('Checklist item not found');
  }
  
  // Upload files
  const uploadedPhotos = await Promise.all(
    files.photos.map(file => uploadPhoto(file))
  );
  
  const uploadedVideos = await Promise.all(
    files.videos.map(file => uploadVideo(file))
  );
  
  // Update checklist item
  checklistItem.evidence = {
    photos: uploadedPhotos,
    videos: uploadedVideos,
    note: note
  };
  checklistItem.isCompleted = true;
  
  // Update task status
  if (userTask.status === 'pending') {
    userTask.status = 'in_progress';
  }
  
  await userTask.save();
  
  return checklistItem;
}
```

### 2. Submit task

```javascript
async function submitTask(employeeId, userTaskId, overallNote) {
  const userTask = await UserTask.findById(userTaskId).populate('broadcastId storeTaskId');
  
  // Validate
  if (!userTask.employeeId.equals(employeeId)) {
    throw new Error('Forbidden');
  }
  
  // Check all required items completed
  const requiredItems = userTask.checklist.filter(item => item.required);
  const incompletedItems = requiredItems.filter(item => !item.isCompleted);
  
  if (incompletedItems.length > 0) {
    throw new Error('All required items must be completed');
  }
  
  // Update status
  userTask.status = 'completed';
  userTask.completedAt = new Date();
  userTask.overallNote = overallNote;
  await userTask.save();
  
  // Get manager của brand
  const employee = await EmployeeModel.findById(employeeId);
  const manager = await EmployeeModel.findOne({
    ID_Branch: employee.ID_Branch,
    Status: 'Đang làm việc'
  });
  
  // Verify is manager
  const managerRole = await getEmployeeRole(manager);
  if (managerRole !== 'manager') {
    throw new Error('Manager not found for this branch');
  }
  
  // Send notification to manager
  await Notification.create({
    userId: manager._id,
    type: 'task_completed',
    title: 'Employee hoàn thành task',
    message: `${employee.FullName} hoàn thành: ${userTask.broadcastId.title}`,
    data: {
      taskId: userTask._id,
      employeeId
    }
  });
  
  return userTask;
}
```

---

## 🔄 Helper Functions

### Check store task completion

```javascript
async function checkStoreTaskCompletion(storeTaskId) {
  const storeTask = await StoreTask.findById(storeTaskId);
  
  // Get all user tasks
  const userTasks = await UserTask.find({
    storeTaskId: storeTask._id
  });
  
  // Check if all approved
  const allApproved = userTasks.every(ut => ut.status === 'approved');
  
  if (allApproved) {
    storeTask.status = 'completed';
    storeTask.completedAt = new Date();
    await storeTask.save();
    
    // Check broadcast completion
    await checkBroadcastCompletion(storeTask.broadcastId);
  }
}
```

### Check broadcast completion

```javascript
async function checkBroadcastCompletion(broadcastId) {
  const broadcast = await Broadcast.findById(broadcastId);
  
  // Get all store tasks
  const storeTasks = await StoreTask.find({
    broadcastId: broadcast._id
  });
  
  // Check if all completed
  const allCompleted = storeTasks.every(st => st.status === 'completed');
  
  if (allCompleted) {
    broadcast.status = 'completed';
    broadcast.completedAt = new Date();
    await broadcast.save();
    
    // Send notification to admin
    await Notification.create({
      userId: broadcast.createdBy,
      type: 'broadcast_completed',
      title: 'Broadcast hoàn thành',
      message: `${broadcast.title} đã hoàn thành`,
      data: {
        broadcastId: broadcast._id
      }
    });
  }
}
```

### Calculate progress

```javascript
function calculateProgress(userTask) {
  const totalItems = userTask.checklist.length;
  const completedItems = userTask.checklist.filter(item => item.isCompleted).length;
  
  return (completedItems / totalItems) * 100;
}

function calculateStoreTaskProgress(userTasks) {
  const totalEmployees = userTasks.length;
  const completedEmployees = userTasks.filter(ut => 
    ut.status === 'approved'
  ).length;
  
  return (completedEmployees / totalEmployees) * 100;
}
```

---

## ⏰ Recurring Broadcasts

### Cron job handler

```javascript
// Chạy mỗi ngày 00:00
async function handleRecurringBroadcasts() {
  const today = new Date();
  const dayOfWeek = today.getDay();
  const dayOfMonth = today.getDate();
  
  // Find recurring broadcasts
  const broadcasts = await Broadcast.find({
    'recurring.enabled': true,
    status: 'active'
  });
  
  for (const broadcast of broadcasts) {
    let shouldCreate = false;
    
    if (broadcast.recurring.frequency === 'daily') {
      shouldCreate = true;
    } else if (broadcast.recurring.frequency === 'weekly') {
      shouldCreate = (dayOfWeek === broadcast.recurring.dayOfWeek);
    } else if (broadcast.recurring.frequency === 'monthly') {
      shouldCreate = (dayOfMonth === broadcast.recurring.dayOfMonth);
    }
    
    if (shouldCreate) {
      // Clone broadcast
      const newBroadcast = await Broadcast.create({
        ...broadcast.toObject(),
        _id: undefined,
        status: 'draft',
        createdAt: new Date()
      });
      
      // Auto-publish
      await publishBroadcast(newBroadcast._id);
    }
  }
}
```

---

## 📊 Analytics Calculations

### Brand performance

```javascript
async function calculateBrandPerformance(brandId, startDate, endDate) {
  // Get all employees for this brand
  const employees = await EmployeeModel.find({ 
    ID_Branch: brandId,
    Status: 'Đang làm việc'
  }).distinct('_id');
  
  const userTasks = await UserTask.find({
    employeeId: {
      $in: employees
    },
    completedAt: {
      $gte: startDate,
      $lte: endDate
    }
  });
  
  const totalTasks = userTasks.length;
  const approvedTasks = userTasks.filter(ut => ut.status === 'approved').length;
  const avgRating = userTasks.reduce((sum, ut) => sum + (ut.rating || 0), 0) / approvedTasks;
  
  return {
    totalTasks,
    approvedTasks,
    completionRate: (approvedTasks / totalTasks) * 100,
    avgRating
  };
}
```

---

## 🔗 Liên quan

- **Database Schema**: [database-schema.md](database-schema.md)
- **Architecture**: [architecture.md](architecture.md)
- **Security**: [security.md](security.md)
