// Admin Dashboard Logic

// ==================== DEBUG CONFIGURATION ====================
const DEBUG = true; // Set to true to enable debug logs

// Override console.log to respect DEBUG flag (except errors)
const originalLog = console.log;
const originalError = console.error;

if (!DEBUG) {
  console.log = () => {}; // Disable all console.log when DEBUG = false
  // Keep console.error for actual errors
}

const debugLog = (...args) => originalLog(...args); // Always use original for manual debugging
const debugError = (...args) => originalError(...args);
// =============================================================

// Check authentication
const token = localStorage.getItem('token');
const employee = JSON.parse(localStorage.getItem('employee') || '{}');

// Debug: Log authentication data

if (!token) {
  console.error('[Admin Dashboard] No token found, redirecting to login');
  window.location.href = '/login';
}

if (employee.role !== 'admin') {
  alert(`Bạn không có quyền truy cập trang này. Role hiện tại: ${employee.role}`);
  window.location.href = '/login';
}

// Display user name and position
document.getElementById('userName').textContent = employee.fullName || 'Admin';
document.getElementById('userPosition').textContent = employee.groupUser || 'Quản trị viên';

function logout() {
  localStorage.removeItem('token');
  localStorage.removeItem('employee');
  window.location.href = '/login';
}

// Bind logout button event
document.getElementById('logoutBtn').addEventListener('click', logout);

// Load dashboard data
async function loadDashboard() {
  try {
    const response = await fetch('/api/dashboard/admin', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });


    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('[Admin Dashboard] API Error:', errorData);
      throw new Error(errorData.message || `HTTP ${response.status}: Không thể tải dữ liệu dashboard`);
    }

    const result = await response.json();
    const data = result.data;

    // Update NEW statistics - 4 main KPIs
    const overview = data.overview || data;
    document.getElementById('completedTasks').textContent = overview.completedTasks || 0;
    document.getElementById('overdueTasks').textContent = overview.overdueTasks || 0;
    document.getElementById('inProgressTasks').textContent = overview.inProgressTasks || 0;
    document.getElementById('pendingConfirmTasks').textContent = overview.pendingConfirmTasks || 0;

    // Hide loading, show dashboard
    document.getElementById('loading').classList.add('hidden');
    document.getElementById('dashboard').classList.remove('hidden');

    // Load completed tasks by default
    loadTaskList('completed');

  } catch (error) {
    console.error('Error loading dashboard:', error);
    document.getElementById('loading').innerHTML = `
      <div class="text-red-600">
        <p class="text-xl font-bold">Lỗi khi tải dữ liệu</p>
        <p class="mt-2">${error.message}</p>
        <button onclick="location.reload()" class="mt-4 bg-purple-600 text-white px-4 py-2 rounded">
          Thử lại
        </button>
      </div>
    `;
  }
}

// Translation functions
function translateStatus(status) {
  const translations = {
    'draft': 'Nháp',
    'active': 'Đang chạy',
    'completed': 'Hoàn thành',
    'archived': 'Đã lưu trữ',
    'pending': 'Chờ xử lý',
    'in_progress': 'Đang thực hiện'
  };
  return translations[status] || status;
}

function translatePriority(priority) {
  const translations = {
    'low': 'Thấp',
    'medium': 'Trung bình',
    'high': 'Cao',
    'urgent': 'Khẩn cấp'
  };
  return translations[priority] || priority;
}

function getPriorityColor(priority) {
  const colors = {
    'low': 'text-gray-600',
    'medium': 'text-blue-600',
    'high': 'text-orange-600',
    'urgent': 'text-red-600'
  };
  return colors[priority] || 'text-gray-600';
}

function getStatusColor(status) {
  const colors = {
    'draft': 'bg-gray-200 text-gray-800',
    'active': 'bg-green-200 text-green-800',
    'completed': 'bg-blue-200 text-blue-800',
    'archived': 'bg-gray-200 text-gray-600'
  };
  return colors[status] || 'bg-gray-200 text-gray-800';
}

// ==================== TASK LIST LOGIC ====================

let currentTaskFilter = 'completed';

async function loadTaskList(status) {
  const taskListContainer = document.getElementById('taskListContainer');
  const taskListTitle = document.getElementById('taskListTitle');
  taskListContainer.innerHTML = '<p class="text-center text-gray-500 py-8">Đang tải...</p>';
  
  currentTaskFilter = status;
  
  // Update title based on status
  const titles = {
    'completed': '✅ Đã hoàn thành',
    'overdue': '⚠️ Quá hạn',
    'in-progress': '🔄 Đang làm',
    'pending-confirm': '⏳ Chưa xác nhận'
  };
  taskListTitle.textContent = titles[status] || 'Tasks cần ưu tiên';
  
  try {
    const response = await fetch(`/api/dashboard/admin/tasks/${status}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    if (!response.ok) throw new Error('Không thể tải dữ liệu');
    
    const result = await response.json();
    const tasks = result.data || [];
    
    if (tasks.length === 0) {
      taskListContainer.innerHTML = '<p class="text-center text-gray-500 py-8">Không có công việc nào</p>';
      return;
    }
    
    taskListContainer.innerHTML = tasks.map(task => {
      const completionPercent = calculateCompletionPercent(task);
      const statusBadge = getTaskStatusBadge(task.status);
      const canEdit = task.status !== 'approved'; // Cannot edit completed tasks
      const hasUserTask = !!task.userTaskId; // Check if task has been assigned to employee
      
      // Debug logging
      if (!hasUserTask) {
        console.log('[Task without UserTask]', { 
          broadcastTitle: task.broadcastTitle, 
          status: task.status, 
          userTaskId: task.userTaskId,
          employeeName: task.employeeName 
        });
      }
      
      return `
        <div class="bg-gray-50 border border-gray-200 rounded-lg p-4 hover:bg-gray-100 transition-colors">
          <div class="flex justify-between items-start mb-2">
            <h4 class="font-semibold text-base text-gray-900 flex-1">${task.broadcastTitle || task.title}</h4>
            <div class="flex gap-2 ml-3">
              <span class="px-2 py-1 rounded-full text-xs font-semibold ${getPriorityBadge(task.priority)}">${translatePriority(task.priority).toUpperCase()}</span>
              ${statusBadge}
            </div>
          </div>
          <div class="text-sm text-gray-600 mb-2">
            <p><span class="font-medium">Chi nhánh:</span> ${task.storeName || 'N/A'}</p>
            ${task.managerName ? `<p><span class="font-medium">Quản lý:</span> ${task.managerName}</p>` : ''}
            ${task.employeeName ? `<p><span class="font-medium">Nhân viên:</span> ${task.employeeName}</p>` : '<p class="text-amber-600 italic font-medium">⚠️ Chưa giao cho nhân viên</p>'}
          </div>
          <div class="flex items-center justify-between">
            <div class="flex-1">
              <div class="flex items-center justify-between text-xs text-gray-600 mb-1">
                <span>Completion: ${completionPercent}%</span>
                ${hasUserTask && canEdit ? `
                  <div class="flex gap-2">
                    <button class="edit-details-btn text-blue-600 hover:text-blue-800 font-medium" data-task-id="${task.userTaskId}" title="Sửa hoặc giao lại công việc">
                      <i class="fas fa-edit"></i> Sửa/Giao lại
                    </button>
                    <button class="delete-task-btn text-red-600 hover:text-red-800 font-medium" data-task-id="${task.userTaskId}" title="Xóa task">
                      <i class="fas fa-trash"></i> Xóa
                    </button>
                  </div>
                ` : !hasUserTask && canEdit ? `
                  <span class="text-amber-600 text-xs font-medium italic">
                    <i class="fas fa-info-circle"></i> Vui lòng giao task cho nhân viên từ modal "Giao việc" trước
                  </span>
                ` : ''}
              </div>
              <div class="w-full bg-gray-200 rounded-full h-2">
                <div class="bg-gradient-to-r from-purple-500 to-blue-500 h-2 rounded-full transition-all" style="width: ${completionPercent}%"></div>
              </div>
            </div>
            ${status === 'overdue' ? `<span class="ml-3 text-xs text-red-600 font-medium">Quá hạn ${calculateOverdueDays(task.deadline)} ngày</span>` : ''}
          </div>
        </div>
      `;
    }).join('');
    
    // Attach event listeners to edit buttons
    document.querySelectorAll('.edit-details-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const taskId = btn.getAttribute('data-task-id');
        const task = tasks.find(t => t.userTaskId === taskId);
        
        console.log('[Edit Button Click]', { taskId, task, hasUserTaskId: !!task?.userTaskId });
        
        if (!task) {
          alert('Không tìm thấy task. Vui lòng refresh trang.');
          return;
        }
        
        if (!task.userTaskId) {
          alert('Task này chưa được giao cho nhân viên nào. Vui lòng dùng modal "Giao việc" để giao task trước.');
          return;
        }
        
        openEditTaskDetailsModal(task);
      });
    });
    
    document.querySelectorAll('.delete-task-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const taskId = btn.getAttribute('data-task-id');
        const task = tasks.find(t => t.userTaskId === taskId);
        
        if (!task) {
          alert('Không tìm thấy task. Vui lòng refresh trang.');
          return;
        }
        
        if (!task.userTaskId) {
          alert('Task này chưa được giao cho nhân viên nào. Không thể xóa.');
          return;
        }
        
        handleDeleteTask(task);
      });
    });
    
  } catch (error) {
    console.error('Error loading task list:', error);
    taskListContainer.innerHTML = '<p class="text-center text-red-500 py-8">Lỗi khi tải dữ liệu</p>';
  }
}

function calculateCompletionPercent(task) {
  if (task.completionPercent !== undefined) {
    return Math.round(task.completionPercent);
  }
  // Fallback calculation if not provided by backend
  if (task.status === 'completed') return 100;
  if (task.status === 'in_progress') return 50;
  if (task.status === 'pending') return 0;
  return 0;
}

function getTaskStatusBadge(status) {
  const badges = {
    'pending': '<span class="px-2 py-1 rounded-full text-xs font-semibold bg-yellow-100 text-yellow-800">CHƯA NHẬN</span>',
    'accepted': '<span class="px-2 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-800">ĐÃ NHẬN</span>',
    'in_progress': '<span class="px-2 py-1 rounded-full text-xs font-semibold bg-indigo-100 text-indigo-800">ĐANG LÀM</span>',
    'completed': '<span class="px-2 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-800">HOÀN THÀNH</span>',
    'overdue': '<span class="px-2 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-800">QUÁ HẠN</span>'
  };
  return badges[status] || '';
}

// Load dashboard on page load
loadDashboard();

// Refresh every 30 seconds
setInterval(loadDashboard, 30000);

// ==================== BROADCAST MODAL LOGIC ====================

// Modal elements
const createBroadcastBtn = document.getElementById('createBroadcastBtn');
const createBroadcastModal = document.getElementById('createBroadcastModal');
const closeBroadcastModal = document.getElementById('closeBroadcastModal');
const cancelBroadcastBtn = document.getElementById('cancelBroadcastBtn');
const broadcastForm = document.getElementById('broadcastForm');
const addChecklistBtn = document.getElementById('addChecklistBtn');
const checklistContainer = document.getElementById('checklistContainer');
const saveDraftBtn = document.getElementById('saveDraftBtn');

// NEW: Task type and deadline elements
const taskTypeSelector = document.getElementById('taskType');
const onetimeSettings = document.getElementById('onetimeSettings');
const dailySettings = document.getElementById('dailySettings');
const weeklySettings = document.getElementById('weeklySettings');
const monthlySettings = document.getElementById('monthlySettings');
const yearlySettings = document.getElementById('yearlySettings');
const deadlinePreview = document.getElementById('deadlinePreview');

// Success modal elements
const successModal = document.getElementById('successModal');
const successMessage = document.getElementById('successMessage');
const successOkButton = document.getElementById('successOkButton');

// Error modal elements
const errorModal = document.getElementById('errorModal');
const errorMessage = document.getElementById('errorMessage');
const errorOkButton = document.getElementById('errorOkButton');

// NEW: Assign broadcast elements
const assignBroadcastBtn = document.getElementById('assignBroadcastBtn');
const selectBroadcastModal = document.getElementById('selectBroadcastModal');
const closeSelectBroadcastModal = document.getElementById('closeSelectBroadcastModal');
const broadcastTemplateList = document.getElementById('broadcastTemplateList');
const broadcastSearch = document.getElementById('broadcastSearch');

const assignModal = document.getElementById('assignModal');
const closeAssignModal = document.getElementById('closeAssignModal');
const cancelAssignBtn = document.getElementById('cancelAssignBtn');
const confirmAssignBtn = document.getElementById('confirmAssignBtn');
const assignBroadcastTitle = document.getElementById('assignBroadcastTitle');

const storesTab = document.getElementById('storesTab');
const employeesTab = document.getElementById('employeesTab');
const storesContent = document.getElementById('storesContent');
const employeesContent = document.getElementById('employeesContent');
const storesList = document.getElementById('storesList');
const employeesList = document.getElementById('employeesList');
const storeSearch = document.getElementById('storeSearch');
const employeeSearch = document.getElementById('employeeSearch');

// NEW: Task details modal
const taskDetailsModal = document.getElementById('taskDetailsModal');
const closeTaskDetailsModal = document.getElementById('closeTaskDetailsModal');
const taskDetailsTitle = document.getElementById('taskDetailsTitle');
const taskDetailsList = document.getElementById('taskDetailsList');

// Store Employees Modal elements
const storeEmployeesModal = document.getElementById('storeEmployeesModal');
const closeStoreEmployeesModal = document.getElementById('closeStoreEmployeesModal');
const cancelStoreEmployeesBtn = document.getElementById('cancelStoreEmployeesBtn');
const confirmStoreEmployeesBtn = document.getElementById('confirmStoreEmployeesBtn');
const storeEmployeesStoreName = document.getElementById('storeEmployeesStoreName');
const storeEmployeesList = document.getElementById('storeEmployeesList');
const storeEmployeeSearch = document.getElementById('storeEmployeeSearch');
const storeEmployeesCount = document.getElementById('storeEmployeesCount');

// Global variables for assign flow
let selectedBroadcastId = null;
let selectedStores = []; // Keep for individual employees tab
let selectedEmployees = [];
let allStores = [];
let allEmployees = [];

// NEW: Store assignments mapping { storeId: [employeeIds] }
let storeAssignments = {};
let currentSelectingStore = null; // Currently selecting employees for this store
let storeEmployeesModalContext = 'assign'; // Track whether modal is opened from 'assign' or 'reassign' context
let currentStoreEmployees = []; // All employees of current store
let selectedStoreEmployees = []; // Selected employees for current store

// Set minimum date to today for one-time deadline
const today = new Date().toISOString().split('T')[0];
document.getElementById('onetimeDate').setAttribute('min', today);
document.getElementById('onetimeDate').value = today;

// Open modal
createBroadcastBtn.addEventListener('click', () => {
  createBroadcastModal.classList.remove('hidden');
  resetForm();
});

// Close modal
closeBroadcastModal.addEventListener('click', () => {
  createBroadcastModal.classList.add('hidden');
});

cancelBroadcastBtn.addEventListener('click', () => {
  createBroadcastModal.classList.add('hidden');
});

// NEW: Stats cards click handlers - Load tasks in task list section
document.querySelectorAll('[data-status]').forEach(card => {
  card.addEventListener('click', function() {
    const status = this.getAttribute('data-status');
    loadTaskList(status);
    
    // Scroll to task list section
    document.getElementById('taskListContainer').scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  });
});

// NEW: Assign broadcast button
assignBroadcastBtn.addEventListener('click', () => {
  selectBroadcastModal.classList.remove('hidden');
  loadBroadcastTemplates();
});

// NEW: Close modals
closeSelectBroadcastModal.addEventListener('click', () => {
  selectBroadcastModal.classList.add('hidden');
});

closeAssignModal.addEventListener('click', () => {
  assignModal.classList.add('hidden');
  selectedBroadcastId = null;
  selectedStores = [];
  selectedEmployees = [];
});

cancelAssignBtn.addEventListener('click', () => {
  assignModal.classList.add('hidden');
  selectedBroadcastId = null;
  selectedStores = [];
  selectedEmployees = [];
});

closeTaskDetailsModal.addEventListener('click', () => {
  taskDetailsModal.classList.add('hidden');
});

// Store Employees Modal event listeners
closeStoreEmployeesModal.addEventListener('click', () => {
  storeEmployeesModal.classList.add('hidden');
  storeEmployeesModalContext = 'assign'; // Reset context
  currentSelectingStore = null;
  selectedStoreEmployees = [];
});

cancelStoreEmployeesBtn.addEventListener('click', () => {
  storeEmployeesModal.classList.add('hidden');
  storeEmployeesModalContext = 'assign'; // Reset context
  currentSelectingStore = null;
  selectedStoreEmployees = [];
});

confirmStoreEmployeesBtn.addEventListener('click', () => {
  if (currentSelectingStore && selectedStoreEmployees.length > 0) {
    if (storeEmployeesModalContext === 'assign') {
      // Assign context: save to storeAssignments
      storeAssignments[currentSelectingStore._id] = selectedStoreEmployees;
      
      // Close modal and re-render stores list
      storeEmployeesModal.classList.add('hidden');
      currentSelectingStore = null;
      selectedStoreEmployees = [];
      renderStores(allStores);
      
    } else if (storeEmployeesModalContext === 'reassign') {
      // Reassign context: save to selectedReassignTarget
      selectedReassignTarget = {
        type: 'both',
        storeId: currentSelectingStore._id,
        storeName: currentSelectingStore.Name,
        employeeIds: selectedStoreEmployees
      };     
      
      // Close modal - user is back in reassign modal
      storeEmployeesModal.classList.add('hidden');
      currentSelectingStore = null;
      selectedStoreEmployees = [];
    }
  } else {
    alert('Vui lòng chọn ít nhất 1 nhân viên');
  }
});

storeEmployeeSearch.addEventListener('input', filterStoreEmployees);

// NEW: Tab switching in assign modal
storesTab.addEventListener('click', () => {
  storesTab.classList.add('active', 'border-blue-600', 'text-blue-600');
  storesTab.classList.remove('border-transparent', 'text-gray-600');
  employeesTab.classList.remove('active', 'border-blue-600', 'text-blue-600');
  employeesTab.classList.add('border-transparent', 'text-gray-600');
  storesContent.classList.remove('hidden');
  employeesContent.classList.add('hidden');
  
  // Clear employee selections when switching to stores tab
  selectedEmployees = [];
  if (typeof renderEmployeesList === 'function') renderEmployeesList();
});

employeesTab.addEventListener('click', () => {
  employeesTab.classList.add('active', 'border-blue-600', 'text-blue-600');
  employeesTab.classList.remove('border-transparent', 'text-gray-600');
  storesTab.classList.remove('active', 'border-blue-600', 'text-blue-600');
  storesTab.classList.add('border-transparent', 'text-gray-600');
  employeesContent.classList.remove('hidden');
  storesContent.classList.add('hidden');
  
  // Clear store selections when switching to employees tab
  storeAssignments = {};
  renderStores(allStores);
});

// NEW: Search handlers
broadcastSearch.addEventListener('input', filterBroadcastTemplates);
storeSearch.addEventListener('input', filterStores);
employeeSearch.addEventListener('input', filterEmployees);

// NEW: Confirm assign button
confirmAssignBtn.addEventListener('click', handleAssignBroadcast);

// Close modal on outside click
createBroadcastModal.addEventListener('click', (e) => {
  if (e.target === createBroadcastModal) {
    createBroadcastModal.classList.add('hidden');
  }
});

// Success modal OK button - close modals and reload dashboard
successOkButton.addEventListener('click', () => {
  successModal.classList.add('hidden');
  createBroadcastModal.classList.add('hidden');
  loadDashboard(); // Reload dashboard data
});

// Error modal OK button - close error modal only
errorOkButton.addEventListener('click', () => {
  errorModal.classList.add('hidden');
});

// Add checklist item
addChecklistBtn.addEventListener('click', () => {
  const itemDiv = document.createElement('div');
  itemDiv.className = 'flex gap-2';
  itemDiv.innerHTML = `
    <input type="text" class="checklist-item flex-1 px-3 sm:px-4 py-3 sm:py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-base min-h-[48px]" placeholder="Nhập nội dung checklist..." required>
    <button type="button" class="remove-checklist-btn bg-red-500 hover:bg-red-600 text-white px-3 rounded-lg min-w-[48px] min-h-[48px]">
      <svg class="w-5 h-5 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
      </svg>
    </button>
  `;
  checklistContainer.appendChild(itemDiv);
  
  // Bind remove button
  const removeBtn = itemDiv.querySelector('.remove-checklist-btn');
  removeBtn.addEventListener('click', () => {
    itemDiv.remove();
    updateRemoveButtons();
  });
  
  updateRemoveButtons();
});

// Update remove button visibility
function updateRemoveButtons() {
  const items = checklistContainer.querySelectorAll('.flex');
  const removeButtons = checklistContainer.querySelectorAll('.remove-checklist-btn');
  removeButtons.forEach((btn, index) => {
    if (items.length > 1) {
      btn.classList.remove('hidden');
    } else {
      btn.classList.add('hidden');
    }
  });
}

// Task Type Selector - Show/Hide appropriate settings
taskTypeSelector.addEventListener('change', () => {
  const taskType = taskTypeSelector.value;
  
  // Hide all settings
  onetimeSettings.classList.add('hidden');
  dailySettings.classList.add('hidden');
  weeklySettings.classList.add('hidden');
  monthlySettings.classList.add('hidden');
  yearlySettings.classList.add('hidden');
  
  // Show selected setting
  switch(taskType) {
    case 'onetime':
      onetimeSettings.classList.remove('hidden');
      break;
    case 'daily':
      dailySettings.classList.remove('hidden');
      break;
    case 'weekly':
      weeklySettings.classList.remove('hidden');
      break;
    case 'monthly':
      monthlySettings.classList.remove('hidden');
      break;
    case 'yearly':
      yearlySettings.classList.remove('hidden');
      break;
  }
  
  updateDeadlinePreview();
});

// Update preview when any deadline input changes
document.getElementById('onetimeDate').addEventListener('change', updateDeadlinePreview);
document.getElementById('onetimeTime').addEventListener('change', updateDeadlinePreview);
document.getElementById('dailyTime').addEventListener('change', updateDeadlinePreview);
document.getElementById('weeklyDay').addEventListener('change', updateDeadlinePreview);
document.getElementById('weeklyTime').addEventListener('change', updateDeadlinePreview);
document.getElementById('monthlyDate').addEventListener('change', updateDeadlinePreview);
document.getElementById('monthlyTime').addEventListener('change', updateDeadlinePreview);
document.getElementById('yearlyDate').addEventListener('change', updateDeadlinePreview);
document.getElementById('yearlyTime').addEventListener('change', updateDeadlinePreview);

// Update Deadline Preview
function updateDeadlinePreview() {
  const taskType = taskTypeSelector.value;
  const now = new Date();
  let nextDeadline;
  let description = '';
  
  try {
    switch(taskType) {
      case 'onetime':
        const onetimeDate = document.getElementById('onetimeDate').value;
        const onetimeTime = document.getElementById('onetimeTime').value;
        
        if (!onetimeDate || !onetimeTime) {
          deadlinePreview.textContent = 'Vui lòng chọn ngày và giờ';
          return;
        }
        
        nextDeadline = new Date(`${onetimeDate}T${onetimeTime}`);
        description = '(Làm một lần)';
        break;
        
      case 'daily':
        const dailyTime = document.getElementById('dailyTime').value;
        const [dailyHours, dailyMinutes] = dailyTime.split(':');
        
        nextDeadline = new Date();
        nextDeadline.setHours(parseInt(dailyHours), parseInt(dailyMinutes), 0, 0);
        
        // If time already passed today, show tomorrow
        if (nextDeadline <= now) {
          nextDeadline.setDate(nextDeadline.getDate() + 1);
        }
        
        description = `(Hàng ngày lúc ${dailyTime})`;
        break;
        
      case 'weekly':
        const weeklyDay = parseInt(document.getElementById('weeklyDay').value);
        const weeklyTime = document.getElementById('weeklyTime').value;
        const [weeklyHours, weeklyMinutes] = weeklyTime.split(':');
        
        nextDeadline = new Date();
        nextDeadline.setHours(parseInt(weeklyHours), parseInt(weeklyMinutes), 0, 0);
        
        const currentDay = now.getDay();
        let daysUntil = weeklyDay - currentDay;
        
        if (daysUntil <= 0 || (daysUntil === 0 && nextDeadline <= now)) {
          daysUntil += 7;
        }
        
        nextDeadline.setDate(now.getDate() + daysUntil);
        
        const dayNames = ['Chủ nhật', 'Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7'];
        description = `(${dayNames[weeklyDay]} hàng tuần lúc ${weeklyTime})`;
        break;
        
      case 'monthly':
        const monthlyDate = document.getElementById('monthlyDate').value;
        const monthlyTime = document.getElementById('monthlyTime').value;
        
        if (!monthlyDate || !monthlyTime) {
          deadlinePreview.textContent = 'Vui lòng chọn ngày và giờ';
          return;
        }
        
        const monthlySelected = new Date(`${monthlyDate}T${monthlyTime}`);
        const monthlyDayOfMonth = monthlySelected.getDate();
        const [monthlyHours, monthlyMinutes] = monthlyTime.split(':');
        
        nextDeadline = new Date();
        nextDeadline.setHours(parseInt(monthlyHours), parseInt(monthlyMinutes), 0, 0);
        nextDeadline.setDate(monthlyDayOfMonth);
        
        // If deadline passed this month, move to next month
        if (nextDeadline <= now) {
          nextDeadline.setMonth(nextDeadline.getMonth() + 1);
        }
        
        description = `(ngày ${monthlyDayOfMonth} hàng tháng lúc ${monthlyTime})`;
        break;
        
      case 'yearly':
        const yearlyDate = document.getElementById('yearlyDate').value;
        const yearlyTime = document.getElementById('yearlyTime').value;
        
        if (!yearlyDate || !yearlyTime) {
          deadlinePreview.textContent = 'Vui lòng chọn ngày và giờ';
          return;
        }
        
        const yearlySelected = new Date(`${yearlyDate}T${yearlyTime}`);
        const yearlyMonth = yearlySelected.getMonth() + 1; // 1-based
        const yearlyDayOfMonth = yearlySelected.getDate();
        const [yearlyHours, yearlyMinutes] = yearlyTime.split(':');
        
        nextDeadline = new Date();
        nextDeadline.setMonth(yearlyMonth - 1); // Convert to 0-based
        nextDeadline.setDate(yearlyDayOfMonth);
        nextDeadline.setHours(parseInt(yearlyHours), parseInt(yearlyMinutes), 0, 0);
        
        // If date already passed this year, move to next year
        if (nextDeadline <= now) {
          nextDeadline.setFullYear(nextDeadline.getFullYear() + 1);
        }
        
        description = `(ngày ${yearlyDayOfMonth}/tháng ${yearlyMonth} hàng năm lúc ${yearlyTime})`;
        break;
    }
    
    // Format and display
    if (nextDeadline) {
      const formatted = nextDeadline.toLocaleString('vi-VN', {
        weekday: 'short',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
      });
      
      deadlinePreview.innerHTML = `<strong>${formatted}</strong><br><span class="text-xs">${description}</span>`;
    }
  } catch (error) {
    console.error('[Deadline Preview] Error:', error);
    deadlinePreview.textContent = 'Dữ liệu không hợp lệ';
  }
}

// Initialize preview on page load
updateDeadlinePreview();

// Save draft
// Save draft (now the only submission method)
saveDraftBtn.addEventListener('click', async () => {
  if (!broadcastForm.checkValidity()) {
    broadcastForm.reportValidity();
    return;
  }
  await saveBroadcast('draft');
});

// Save broadcast function
async function saveBroadcast(status = 'draft') {
  try {
    showAlert('info', 'Đang lưu công việc...');
    
    // Get checklist items
    const checklistInputs = checklistContainer.querySelectorAll('.checklist-item');
    const checklistItems = Array.from(checklistInputs)
      .map(input => input.value.trim())
      .filter(value => value !== '');
    
    if (checklistItems.length === 0) {
      showAlert('error', 'Vui lòng thêm ít nhất 1 checklist item');
      return;
    }
    
    // Convert checklist to required format: array of objects with 'task' field
    const checklist = checklistItems.map(item => ({ task: item }));
    
    // Calculate deadline based on task type
    const taskType = taskTypeSelector.value;
    let deadline;
    const recurringData = {
      enabled: false
    };
    
    switch(taskType) {
      case 'onetime':
        const onetimeDate = document.getElementById('onetimeDate').value;
        const onetimeTime = document.getElementById('onetimeTime').value;
        deadline = new Date(`${onetimeDate}T${onetimeTime}`);
        break;
        
      case 'daily':
        const dailyTime = document.getElementById('dailyTime').value;
        const [dailyHours, dailyMinutes] = dailyTime.split(':');
        deadline = new Date();
        deadline.setHours(parseInt(dailyHours), parseInt(dailyMinutes), 0, 0);
        if (deadline <= new Date()) {
          deadline.setDate(deadline.getDate() + 1);
        }
        
        recurringData.enabled = true;
        recurringData.frequency = 'daily';
        recurringData.pattern = { time: dailyTime };
        break;
        
      case 'weekly':
        const weeklyDay = parseInt(document.getElementById('weeklyDay').value);
        const weeklyTime = document.getElementById('weeklyTime').value;
        const [weeklyHours, weeklyMinutes] = weeklyTime.split(':');
        
        deadline = new Date();
        deadline.setHours(parseInt(weeklyHours), parseInt(weeklyMinutes), 0, 0);
        
        const currentDay = new Date().getDay();
        let daysUntil = weeklyDay - currentDay;
        if (daysUntil <= 0 || (daysUntil === 0 && deadline <= new Date())) {
          daysUntil += 7;
        }
        deadline.setDate(deadline.getDate() + daysUntil);
        
        recurringData.enabled = true;
        recurringData.frequency = 'weekly';
        recurringData.pattern = {
          dayOfWeek: weeklyDay,
          time: weeklyTime
        };
        break;
        
      case 'monthly':
        const monthlyDate = document.getElementById('monthlyDate').value;
        const monthlyTime = document.getElementById('monthlyTime').value;
        
        if (!monthlyDate || !monthlyTime) {
          alert('Vui lòng chọn ngày và giờ cho deadline lặp lại theo tháng');
          return;
        }
        
        const monthlySelected = new Date(`${monthlyDate}T${monthlyTime}`);
        const monthlyDayOfMonth = monthlySelected.getDate();
        const [monthlyHours, monthlyMinutes] = monthlyTime.split(':');
        
        deadline = new Date();
        deadline.setHours(parseInt(monthlyHours), parseInt(monthlyMinutes), 0, 0);
        deadline.setDate(monthlyDayOfMonth);
        
        if (deadline <= new Date()) {
          deadline.setMonth(deadline.getMonth() + 1);
        }
        
        recurringData.enabled = true;
        recurringData.frequency = 'monthly';
        recurringData.pattern = {
          dayOfMonth: monthlyDayOfMonth,
          time: monthlyTime
        };
        break;
        
      case 'yearly':
        const yearlyDate = document.getElementById('yearlyDate').value;
        const yearlyTime = document.getElementById('yearlyTime').value;
        
        if (!yearlyDate || !yearlyTime) {
          alert('Vui lòng chọn ngày và giờ cho deadline lặp lại theo năm');
          return;
        }
        
        const yearlySelected = new Date(`${yearlyDate}T${yearlyTime}`);
        const yearlyMonth = yearlySelected.getMonth() + 1; // 1-based for backend
        const yearlyDayOfMonth = yearlySelected.getDate();
        const [yearlyHours, yearlyMinutes] = yearlyTime.split(':');
        
        deadline = new Date();
        deadline.setMonth(yearlyMonth - 1); // Convert to 0-based
        deadline.setDate(yearlyDayOfMonth);
        deadline.setHours(parseInt(yearlyHours), parseInt(yearlyMinutes), 0, 0);
        
        if (deadline <= new Date()) {
          deadline.setFullYear(deadline.getFullYear() + 1);
        }
        
        recurringData.enabled = true;
        recurringData.frequency = 'yearly';
        recurringData.pattern = {
          month: yearlyMonth,
          dayOfMonth: yearlyDayOfMonth,
          time: yearlyTime
        };
        break;
    }
    
    // Build payload
    const payload = {
      title: document.getElementById('broadcastTitle').value.trim(),
      description: document.getElementById('broadcastDescription').value.trim(),
      priority: document.getElementById('broadcastPriority').value,
      deadline: deadline.toISOString(),
      checklist: checklist,
      assignedStores: [], // Empty for draft, will be filled when publishing
      status: status,
      recurring: recurringData
    };
    
    
    // API call
    const response = await fetch('/api/broadcasts', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(payload)
    });
    
    
    const result = await response.json();
    
    if (!response.ok) {
      console.error('[Create Broadcast] Failed:', result);
      throw new Error(result.message || 'Không thể tạo công việc');
    }
    
    
    // Show success modal instead of auto-redirect
    const message = status === 'draft' ? 'Lưu nháp thành công!' : 'Công việc đã được tạo!';
    successMessage.textContent = message;
    successModal.classList.remove('hidden');
    
    // Don't auto-redirect - wait for user to click OK button
    
  } catch (error) {
    console.error('[Create Broadcast] Error:', error);
    showAlert('error', error.message || 'Có lỗi xảy ra khi tạo công việc');
  }
}

// Show alert message
function showAlert(type, message) {
  const alertDiv = document.getElementById('broadcastAlert');
  const colors = {
    'info': 'bg-blue-50 text-blue-800 border-blue-200',
    'success': 'bg-green-50 text-green-800 border-green-200',
    'error': 'bg-red-50 text-red-800 border-red-200'
  };
  
  alertDiv.className = `p-4 rounded-lg border ${colors[type] || colors.info}`;
  alertDiv.textContent = message;
  alertDiv.classList.remove('hidden');
  
  if (type === 'success') {
    setTimeout(() => {
      alertDiv.classList.add('hidden');
    }, 3000);
  }
}

// Reset form
function resetForm() {
  broadcastForm.reset();
  
  // Reset task type to onetime
  taskTypeSelector.value = 'onetime';
  
  // Reset deadline inputs
  document.getElementById('onetimeDate').value = today;
  document.getElementById('onetimeTime').value = '14:00';
  document.getElementById('dailyTime').value = '09:00';
  document.getElementById('weeklyDay').value = '6';
  document.getElementById('weeklyTime').value = '17:00';
  document.getElementById('monthlyDay').value = '2';
  document.getElementById('monthlyDay').disabled = false;
  document.getElementById('monthlyLastDay').checked = false;
  document.getElementById('monthlyTime').value = '10:00';
  document.getElementById('yearlyMonth').value = '1';
  document.getElementById('yearlyDay').value = '15';
  document.getElementById('yearlyTime').value = '17:00';
  
  // Show onetime settings by default
  onetimeSettings.classList.remove('hidden');
  dailySettings.classList.add('hidden');
  weeklySettings.classList.add('hidden');
  monthlySettings.classList.add('hidden');
  yearlySettings.classList.add('hidden');
  
  updateDeadlinePreview();
  
  // Reset checklist to 1 item
  checklistContainer.innerHTML = `
    <div class="flex gap-2">
      <input type="text" class="checklist-item flex-1 px-3 sm:px-4 py-3 sm:py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-base min-h-[48px]" placeholder="1. Kiểm tra máy in bill" required>
      <button type="button" class="remove-checklist-btn hidden bg-red-500 hover:bg-red-600 text-white px-3 rounded-lg min-w-[48px] min-h-[48px]">
        <svg class="w-5 h-5 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
        </svg>
      </button>
    </div>
  `;
  
  // Hide alert
  document.getElementById('broadcastAlert').classList.add('hidden');
}

// ==================== TASK DETAILS MODAL ====================

async function showTaskDetails(status) {
  taskDetailsModal.classList.remove('hidden');
  taskDetailsList.innerHTML = '<p class="text-center text-gray-500 py-8">Đang tải...</p>';
  
  const titles = {
    'completed': '✅ Công việc đã hoàn thành',
    'overdue': '⚠️ Công việc quá hạn',
    'in-progress': '🔄 Công việc đang làm',
    'pending-confirm': '⏳ Công việc chưa xác nhận'
  };
  
  taskDetailsTitle.textContent = titles[status] || 'Chi tiết công việc';
  
  try {
    const response = await fetch(`/api/dashboard/admin/tasks/${status}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    if (!response.ok) throw new Error('Không thể tải dữ liệu');
    
    const result = await response.json();
    const tasks = result.data || [];
    
    if (tasks.length === 0) {
      taskDetailsList.innerHTML = '<p class="text-center text-gray-500 py-8">Không có công việc nào</p>';
      return;
    }
    
    taskDetailsList.innerHTML = tasks.map(task => `
      <div class="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
        <div class="flex justify-between items-start mb-3">
          <h4 class="font-semibold text-lg text-gray-900">${task.broadcastTitle || task.title}</h4>
          <span class="px-3 py-1 rounded-full text-xs font-semibold ${getPriorityBadge(task.priority)}">${translatePriority(task.priority)}</span>
        </div>
        <div class="space-y-2 text-sm text-gray-600">
          <p><span class="font-medium">Chi nhánh:</span> ${task.storeName || 'N/A'}</p>
          <p><span class="font-medium">Quản lý:</span> ${task.managerName || 'N/A'}</p>
          <p><span class="font-medium">Deadline:</span> ${new Date(task.deadline).toLocaleString('vi-VN')}</p>
          ${status === 'overdue' ? `<p class="text-red-600 font-medium">Quá hạn: ${calculateOverdueDays(task.deadline)} ngày</p>` : ''}
          <p><span class="font-medium">Trạng thái:</span> <span class="${getStatusColorText(task.status)}">${translateStatus(task.status)}</span></p>
        </div>
      </div>
    `).join('');
    
  } catch (error) {
    console.error('Error loading task details:', error);
    taskDetailsList.innerHTML = '<p class="text-center text-red-500 py-8">Lỗi khi tải dữ liệu</p>';
  }
}

function calculateOverdueDays(deadline) {
  const now = new Date();
  const deadlineDate = new Date(deadline);
  const diffTime = now - deadlineDate;
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
}

function getPriorityBadge(priority) {
  const badges = {
    'low': 'bg-gray-100 text-gray-800',
    'medium': 'bg-blue-100 text-blue-800',
    'high': 'bg-orange-100 text-orange-800',
    'urgent': 'bg-red-100 text-red-800'
  };
  return badges[priority] || 'bg-gray-100 text-gray-800';
}

function getStatusColorText(status) {
  const colors = {
    'pending': 'text-yellow-600',
    'in_progress': 'text-blue-600',
    'completed': 'text-green-600',
    'overdue': 'text-red-600'
  };
  return colors[status] || 'text-gray-600';
}

// ==================== ASSIGN BROADCAST WORKFLOW ====================

async function loadBroadcastTemplates() {
  broadcastTemplateList.innerHTML = '<p class="text-center text-gray-500 py-8">Đang tải...</p>';
  
  try {
    // Lấy cả broadcast draft và active để có thể giao nhiều lần
    const response = await fetch('/api/broadcasts', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    if (!response.ok) throw new Error('Không thể tải danh sách công việc');
    
    const result = await response.json();
    let broadcasts = result.data?.broadcasts || result.broadcasts || [];
    
    // Chỉ hiển thị broadcast draft hoặc active (bỏ completed, archived)
    broadcasts = broadcasts.filter(b => b.status === 'draft' || b.status === 'active');
    
    if (broadcasts.length === 0) {
      broadcastTemplateList.innerHTML = '<p class="text-center text-gray-500 py-8">Chưa có công việc nào. Hãy tạo công việc trước!</p>';
      return;
    }
    
    window.allBroadcasts = broadcasts; // Store for search
    renderBroadcastTemplates(broadcasts);
    
  } catch (error) {
    console.error('Error loading broadcasts:', error);
    broadcastTemplateList.innerHTML = '<p class="text-center text-red-500 py-8">Lỗi khi tải dữ liệu</p>';
  }
}

function renderBroadcastTemplates(broadcasts) {
  broadcastTemplateList.innerHTML = broadcasts.map(broadcast => `
    <div class="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer broadcast-item" data-id="${broadcast._id}">
      <div class="flex justify-between items-start">
        <div class="flex-1">
          <h4 class="font-semibold text-lg text-gray-900 mb-2">${broadcast.title}</h4>
          <p class="text-sm text-gray-600 line-clamp-2 mb-2">${broadcast.description}</p>
          <div class="flex flex-wrap gap-2 text-xs">
            ${broadcast.status === 'draft' 
              ? '<span class="px-2 py-1 rounded bg-purple-100 text-purple-700">📝 Nháp - Chưa giao</span>' 
              : '<span class="px-2 py-1 rounded bg-green-100 text-green-700">✅ Đã giao - Có thể giao thêm</span>'}
            <span class="px-2 py-1 rounded ${getPriorityBadge(broadcast.priority)}">${translatePriority(broadcast.priority)}</span>
            <span class="px-2 py-1 rounded bg-gray-100 text-gray-700">📝 ${broadcast.checklist?.length || 0} checklist items</span>
            ${broadcast.recurring?.enabled ? '<span class="px-2 py-1 rounded bg-green-100 text-green-700">🔄 Lặp lại</span>' : '<span class="px-2 py-1 rounded bg-blue-100 text-blue-700">📅 Một lần</span>'}
          </div>
        </div>
        <button class="select-broadcast-btn ml-4 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded font-semibold min-h-[44px]" data-id="${broadcast._id}" data-title="${broadcast.title}">
          Chọn
        </button>
      </div>
    </div>
  `).join('');
  
  // Bind click events
  document.querySelectorAll('.select-broadcast-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const id = btn.getAttribute('data-id');
      const title = btn.getAttribute('data-title');
      openAssignModal(id, title);
    });
  });
}

function filterBroadcastTemplates() {
  const searchTerm = broadcastSearch.value.toLowerCase();
  const filtered = window.allBroadcasts.filter(b => 
    b.title.toLowerCase().includes(searchTerm) || 
    b.description.toLowerCase().includes(searchTerm)
  );
  renderBroadcastTemplates(filtered);
}

async function openAssignModal(broadcastId, broadcastTitle) {
  selectedBroadcastId = broadcastId;
  selectedStores = [];
  selectedEmployees = [];
  
  assignBroadcastTitle.textContent = `Mẫu: ${broadcastTitle}`;
  selectBroadcastModal.classList.add('hidden');
  assignModal.classList.remove('hidden');
  
  // Load stores and employees
  await Promise.all([loadStores(), loadEmployees()]);
}

async function loadStores(searchQuery = '') {
  storesList.innerHTML = '<p class="text-center text-gray-500 py-8">Đang tải...</p>';
  
  try {
    // Build query params: load up to 100 records (enough for all branches)
    const params = new URLSearchParams({
      limit: '100',
      page: '1'
    });
    
    if (searchQuery) {
      params.set('search', searchQuery);
    }
    
    const response = await fetch(`/api/brands?${params.toString()}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    if (!response.ok) throw new Error('Không thể tải danh sách chi nhánh');
    
    const result = await response.json();
    allStores = result.data?.brands || result.brands || [];
    
    renderStores(allStores);
    
  } catch (error) {
    console.error('Error loading stores:', error);
    storesList.innerHTML = '<p class="text-center text-red-500 py-8">Lỗi khi tải dữ liệu</p>';
  }
}

function renderStores(stores) {
  if (stores.length === 0) {
    storesList.innerHTML = '<p class="text-center text-gray-500 py-8">Không có chi nhánh nào</p>';
    return;
  }
  
  storesList.innerHTML = stores.map(store => {
    const employeeCount = storeAssignments[store._id]?.length || 0;
    const isSelected = employeeCount > 0;
    
   return `
      <div class="store-card p-4 bg-white border ${isSelected ? 'border-blue-500 bg-blue-50' : 'border-gray-200'} rounded-lg hover:border-blue-400 hover:shadow-md transition-all cursor-pointer"
           data-store-id="${store._id}">
        <div class="flex items-start gap-3">
          <div class="flex-shrink-0 mt-1">
            ${isSelected 
              ? '<i class="fas fa-check-circle text-blue-600 text-xl"></i>' 
              : '<i class="far fa-circle text-gray-400 text-xl"></i>'
            }
          </div>
          <div class="flex-1 min-w-0">
            <div class="flex items-center gap-2 mb-2">
              <i class="fas fa-store text-blue-600"></i>
              <p class="font-semibold text-gray-900 truncate">${store.Name}</p>
            </div>
            ${isSelected 
              ? `<div class="flex items-center gap-2 text-sm">
                   <i class="fas fa-users text-blue-600"></i>
                   <span class="font-medium text-blue-700">${employeeCount} nhân viên được chọn</span>
                 </div>`
              : '<p class="text-sm text-gray-500 italic">Click để chọn nhân viên giao việc</p>'
            }
          </div>
        </div>
      </div>
    `;
  }).join('');
  
  // Bind click events to store cards
  const storeCards = document.querySelectorAll('.store-card');
  
  storeCards.forEach(card => {
    card.addEventListener('click', async () => {
      const storeId = card.dataset.storeId;
      const store = allStores.find(s => s._id === storeId);
      if (store) {
        await openStoreEmployeesModal(store);
      } else {
        console.warn('[store-card click] Store not found:', storeId);
      }
    });
  });
}

// Open store employees selection modal
async function openStoreEmployeesModal(store) {
  
  storeEmployeesModalContext = 'assign'; // Set context for assign modal
  currentSelectingStore = store;
  storeEmployeesStoreName.textContent = `Chi nhánh: ${store.Name}`;
  
  // If store has previously selected employees, load them
  selectedStoreEmployees = storeAssignments[store._id] || [];
  
  // Show modal
  if (!storeEmployeesModal) {
    console.error('[openStoreEmployeesModal] Modal element not found!');
    return;
  }
  
  storeEmployeesModal.classList.remove('hidden');
  
  // Load employees for this store
  await loadStoreEmployees(store._id);
}

// Load employees for a specific store
async function loadStoreEmployees(storeId, searchQuery = '') {
  try {
    storeEmployeesList.innerHTML = '<p class="text-center text-gray-500 py-8">Đang tải...</p>';
    
    const params = new URLSearchParams({
      limit: '800',
      page: '1'
    });
    
    if (searchQuery) {
      params.append('search', searchQuery);
    }
    
    const response = await fetch(`/api/employees?${params.toString()}`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (!response.ok) throw new Error('Không thể tải danh sách nhân viên');
    
    const result = await response.json();
    let employees = result.data || [];
    
    // Filter employees by storeId and active status
    currentStoreEmployees = employees.filter(emp => {
      if (!emp.ID_Branch) return false;
      if (emp.Status !== 'Đang hoạt động') return false;
      const branchId = typeof emp.ID_Branch === 'string' ? emp.ID_Branch : emp.ID_Branch._id;
      return branchId === storeId;
    });
    
    
    renderStoreEmployees(currentStoreEmployees);
    
  } catch (error) {
    console.error('Error loading store employees:', error);
    storeEmployeesList.innerHTML = '<p class="text-center text-red-500 py-8">Lỗi khi tải dữ liệu</p>';
  }
}

// Render store employees with selection
function renderStoreEmployees(employees) {
  if (employees.length === 0) {
    storeEmployeesList.innerHTML = '<p class="text-center text-gray-500 py-8">Không có nhân viên nào trong chi nhánh này</p>';
    storeEmployeesCount.textContent = '0';
    return;
  }
  
  storeEmployeesList.innerHTML = employees.map(emp => `
    <label class="flex items-center gap-4 p-4 bg-white border border-gray-200 rounded-lg hover:border-blue-400 hover:shadow-md transition-all cursor-pointer">
      <input type="checkbox" 
             class="store-employee-checkbox w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500 flex-shrink-0" 
             value="${emp._id}" 
             ${selectedStoreEmployees.includes(emp._id) ? 'checked' : ''}>
      <div class="flex-1 min-w-0">
        <div class="flex items-center gap-2 mb-1">
          <i class="fas fa-user-circle text-blue-600"></i>
          <p class="font-semibold text-gray-900">${emp.FullName}</p>
        </div>
        <div class="flex flex-col gap-1 text-sm text-gray-600">
          ${emp.Phone ? `<div class="flex items-center gap-2">
            <i class="fas fa-phone text-gray-400"></i>
            <span>${emp.Phone}</span>
          </div>` : ''}
          ${emp.ID_GroupUser?.Name ? `<div class="flex items-center gap-2">
            <i class="fas fa-briefcase text-gray-400"></i>
            <span>${emp.ID_GroupUser.Name}</span>
          </div>` : ''}
        </div>
      </div>
    </label>
  `).join('');
  
  // Update count
  storeEmployeesCount.textContent = selectedStoreEmployees.length;
  
  // Bind checkbox events
  document.querySelectorAll('.store-employee-checkbox').forEach(checkbox => {
    checkbox.addEventListener('change', (e) => {
      const employeeId = e.target.value;
      if (e.target.checked) {
        if (!selectedStoreEmployees.includes(employeeId)) {
          selectedStoreEmployees.push(employeeId);
        }
      } else {
        selectedStoreEmployees = selectedStoreEmployees.filter(id => id !== employeeId);
      }
      
      // Update count
      storeEmployeesCount.textContent = selectedStoreEmployees.length;
    });
  });
}

// Filter store employees with debounce
let storeEmployeeSearchTimer = null;

function filterStoreEmployees() {
  const searchTerm = storeEmployeeSearch.value.trim();
  
  // Clear previous timer
  if (storeEmployeeSearchTimer) {
    clearTimeout(storeEmployeeSearchTimer);
  }
  
  // Local filter (since we already loaded all employees for this store)
  storeEmployeeSearchTimer = setTimeout(() => {
    if (!searchTerm) {
      renderStoreEmployees(currentStoreEmployees);
      return;
    }
    
    const filtered = currentStoreEmployees.filter(emp => 
      emp.FullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      emp.Phone?.includes(searchTerm) ||
      emp.ID_GroupUser?.Name?.toLowerCase().includes(searchTerm.toLowerCase())
    );
    
    renderStoreEmployees(filtered);
  }, 300);
}

// Debounce timer for search
let storeSearchTimer = null;

function filterStores() {
  const searchTerm = storeSearch.value.trim();
  
  // Clear previous timer
  if (storeSearchTimer) {
    clearTimeout(storeSearchTimer);
  }
  
  // Debounce: wait 300ms after user stops typing
  storeSearchTimer = setTimeout(() => {
    loadStores(searchTerm);
  }, 300);
}

async function loadEmployees(searchQuery = '') {
  employeesList.innerHTML = '<p class="text-center text-gray-500 py-8">Đang tải...</p>';
  
  try {
    // Build query params: load up to 800 records (enough for all employees)
    const params = new URLSearchParams({
      limit: '800',
      page: '1'
    });
    
    if (searchQuery) {
      params.set('search', searchQuery);
    }
    
    const response = await fetch(`/api/employees?${params.toString()}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    if (!response.ok) throw new Error('Không thể tải danh sách nhân viên');
    
    const result = await response.json();
    allEmployees = result.data || result.employees || [];
    
    renderEmployees(allEmployees);
    
  } catch (error) {
    console.error('Error loading employees:', error);
    employeesList.innerHTML = '<p class="text-center text-red-500 py-8">Lỗi khi tải dữ liệu</p>';
  }
}

function renderEmployees(employees) {
  if (employees.length === 0) {
    employeesList.innerHTML = '<p class="text-center text-gray-500 py-8">Không có nhân viên nào</p>';
    return;
  }
  
  employeesList.innerHTML = employees.map(emp => `
    <label class="flex items-center gap-4 p-4 bg-white border border-gray-200 rounded-lg hover:border-blue-400 hover:shadow-md transition-all cursor-pointer">
      <input type="checkbox" class="employee-checkbox w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500 flex-shrink-0" value="${emp._id}" ${selectedEmployees.includes(emp._id) ? 'checked' : ''}>
      <div class="flex-1 min-w-0">
        <div class="flex items-center gap-2 mb-2">
          <i class="fas fa-user-circle text-blue-600 text-lg"></i>
          <p class="font-semibold text-gray-900">${emp.FullName}</p>
        </div>
        <div class="space-y-1.5 text-sm">
          <div class="flex items-center gap-2 text-gray-600">
            <i class="fas fa-phone text-green-500 w-4"></i>
            <span>${emp.Phone}</span>
            <span class="text-gray-400">•</span>
            <i class="fas fa-briefcase text-purple-500 w-4"></i>
            <span>${emp.ID_GroupUser?.Name || 'Chưa xác định'}</span>
          </div>
          <div class="flex items-center gap-2 text-gray-600">
            <i class="fas fa-building text-orange-500 w-4"></i>
            <span>${emp.ID_Branch?.Name || 'Chưa có chi nhánh'}</span>
          </div>
        </div>
      </div>
    </label>
  `).join('');
  
  // Bind checkbox events
  document.querySelectorAll('.employee-checkbox').forEach(checkbox => {
    checkbox.addEventListener('change', (e) => {
      const empId = e.target.value;
      if (e.target.checked) {
        if (!selectedEmployees.includes(empId)) selectedEmployees.push(empId);
      } else {
        selectedEmployees = selectedEmployees.filter(id => id !== empId);
      }
    });
  });
}

// Debounce timer for search
let employeeSearchTimer = null;

function filterEmployees() {
  const searchTerm = employeeSearch.value.trim();
  
  // Clear previous timer
  if (employeeSearchTimer) {
    clearTimeout(employeeSearchTimer);
  }
  
  // Debounce: wait 300ms after user stops typing
  employeeSearchTimer = setTimeout(() => {
    loadEmployees(searchTerm);
  }, 300);
}

async function handleAssignBroadcast() {
  if (!selectedBroadcastId) {
    alert('Vui lòng chọn công việc');
    return;
  }
  
  // Validate: Must have either storeAssignments OR individual employees, not both, not neither
  const hasStoreAssignments = Object.keys(storeAssignments).length > 0;
  const hasIndividualEmployees = selectedEmployees.length > 0;
  
  if (!hasStoreAssignments && !hasIndividualEmployees) {
    alert('Vui lòng chọn ít nhất 1 chi nhánh (và nhân viên) HOẶC 1 nhân viên cá nhân');
    return;
  }
  
  if (hasStoreAssignments && hasIndividualEmployees) {
    alert('Chỉ được chọn chi nhánh HOẶC nhân viên cá nhân, không được chọn cả 2 cùng lúc');
    return;
  }
  
  confirmAssignBtn.disabled = true;
  confirmAssignBtn.textContent = 'Đang xử lý...';
  
  try {
    // Prepare request body based on selection
    const requestBody = {};
    
    if (hasStoreAssignments) {
      // Convert storeAssignments { storeId: [empIds] } to array format
      requestBody.storeAssignments = Object.entries(storeAssignments).map(([storeId, employeeIds]) => ({
        storeId,
        employeeIds
      }));
    } else if (hasIndividualEmployees) {
      requestBody.employeeIds = selectedEmployees;
    }
    
    
    const response = await fetch(`/api/broadcasts/${selectedBroadcastId}/assign`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestBody)
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Không thể giao việc');
    }
    
    const result = await response.json();
    
    // Check if there are errors/warnings in the response
    if (result.data?.errors && result.data.errors.length > 0) {
      // Show error modal for business validation errors (duplicate assignments)
      errorMessage.textContent = result.data.errors.join('\n');
      errorModal.classList.remove('hidden');
      
      // Close assign modal and reset
      assignModal.classList.add('hidden');
      selectedBroadcastId = null;
      storeAssignments = {};
      selectedEmployees = [];
      
      // Reload dashboard
      loadDashboard();
      return;
    }
    
    // Show success message only if no errors
    let successText = '';
    if (hasStoreAssignments) {
      const totalEmployees = Object.values(storeAssignments).reduce((sum, arr) => sum + arr.length, 0);
      successText = `Đã giao việc thành công cho ${Object.keys(storeAssignments).length} chi nhánh (${totalEmployees} nhân viên)!`;
    } else {
      successText = `Đã giao việc thành công cho ${selectedEmployees.length} nhân viên!`;
    }
    
    successMessage.textContent = successText;
    successModal.classList.remove('hidden');
    
    // Close assign modal
    assignModal.classList.add('hidden');
    selectedBroadcastId = null;
    storeAssignments = {};
    selectedEmployees = [];
    
    // Reload dashboard
    loadDashboard();
    
  } catch (error) {
    console.error('Error assigning broadcast:', error);
    // Show error modal instead of alert
    errorMessage.textContent = error.message;
    errorModal.classList.remove('hidden');
  } finally {
    confirmAssignBtn.disabled = false;
    confirmAssignBtn.textContent = 'Xác nhận';
  }
}

// ==================== ALL BROADCASTS MODAL ====================

const allBroadcastsModal = document.getElementById('allBroadcastsModal');
const closeAllBroadcastsModal = document.getElementById('closeAllBroadcastsModal');
const allBroadcastsList = document.getElementById('allBroadcastsList');
const filterBtns = document.querySelectorAll('.broadcast-filter-btn');

let currentFilter = 'all';
let allBroadcastsData = [];

// Close modal
closeAllBroadcastsModal.addEventListener('click', () => {
  allBroadcastsModal.classList.add('hidden');
});

// Filter buttons
filterBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    // Update active button
    filterBtns.forEach(b => b.classList.remove('active', 'bg-purple-600', 'text-white'));
    btn.classList.add('active', 'bg-purple-600', 'text-white');
    
    // Update filter
    currentFilter = btn.dataset.status;
    renderBroadcastsList();
  });
});

// Load all broadcasts
async function loadAllBroadcasts() {
  try {
    allBroadcastsList.innerHTML = '<p class="text-gray-500 text-center py-8">Loading...</p>';
    
    const response = await fetch('/api/broadcasts', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (!response.ok) {
      throw new Error('Failed to load broadcasts');
    }
    
    const result = await response.json();
    allBroadcastsData = result.data.broadcasts || [];
    
    renderBroadcastsList();
  } catch (error) {
    console.error('[Load All Broadcasts] Error:', error);
    allBroadcastsList.innerHTML = '<p class="text-red-500 text-center py-8">Failed to load broadcasts</p>';
  }
}

// Render broadcasts list
function renderBroadcastsList() {
  const filtered = currentFilter === 'all' 
    ? allBroadcastsData 
    : allBroadcastsData.filter(b => b.status === currentFilter);
  
  if (filtered.length === 0) {
    allBroadcastsList.innerHTML = '<p class="text-gray-500 text-center py-8">No broadcasts found</p>';
    return;
  }
  
  allBroadcastsList.innerHTML = filtered.map(broadcast => `
    <div class="border border-gray-200 rounded-lg p-4 hover:shadow-md transition">
      <div class="flex justify-between items-start">
        <div class="flex-1">
          <div class="flex items-center gap-3 mb-2">
            <h4 class="font-bold text-lg">${broadcast.title}</h4>
            <span class="inline-block px-3 py-1 text-xs rounded ${getStatusColor(broadcast.status)}">${broadcast.status}</span>
            <span class="text-sm ${getPriorityColor(broadcast.priority)}">${broadcast.priority}</span>
          </div>
          <p class="text-gray-600 text-sm mb-3">${broadcast.description}</p>
          <div class="flex gap-4 text-sm text-gray-600">
            <span>📅 Created: ${new Date(broadcast.createdAt).toLocaleDateString('vi-VN')}</span>
            <span>⏰ Deadline: ${new Date(broadcast.deadline).toLocaleDateString('vi-VN')}</span>
            <span>📋 ${broadcast.checklist?.length || 0} checklist items</span>
            ${broadcast.recurring?.enabled ? '<span>🔄 Recurring</span>' : ''}
          </div>
        </div>
        <div class="flex gap-2 ml-4">
          ${broadcast.status === 'draft' ? `
            <button onclick="publishBroadcast('${broadcast._id}')" class="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-sm font-semibold">
              📤 Publish
            </button>
          ` : ''}
          <button onclick="viewBroadcastDetails('${broadcast._id}')" class="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-lg text-sm">
            👁️ View
          </button>
        </div>
      </div>
    </div>
  `).join('');
}

// Publish broadcast (will be implemented)
window.publishBroadcast = async (broadcastId) => {
  alert(`Publish broadcast ${broadcastId} - Coming soon: Select stores and publish`);
  // TODO: Open store selection modal and publish
};

// View broadcast details (will be implemented)
window.viewBroadcastDetails = async (broadcastId) => {
  alert(`View broadcast ${broadcastId} details - Coming soon`);
  // TODO: Show broadcast details modal
};

// ==================== EDIT TASK DETAILS FUNCTIONS ====================

const editTaskDetailsModal = document.getElementById('editTaskDetailsModal');
const closeEditTaskDetailsModal = document.getElementById('closeEditTaskDetailsModal');
const cancelEditDetailsBtn = document.getElementById('cancelEditDetailsBtn');
const saveEditDetailsBtn = document.getElementById('saveEditDetailsBtn');
const editDetailsChecklistContainer = document.getElementById('editDetailsChecklistContainer');
const addEditDetailsChecklistBtn = document.getElementById('addEditDetailsChecklistBtn');
const editTaskType = document.getElementById('editTaskType');
const editOnetimeSettings = document.getElementById('editOnetimeSettings');
const editDailySettings = document.getElementById('editDailySettings');
const editWeeklySettings = document.getElementById('editWeeklySettings');
const editMonthlySettings = document.getElementById('editMonthlySettings');
const editYearlySettings = document.getElementById('editYearlySettings');
const editOnetimeDate = document.getElementById('editOnetimeDate');
const editOnetimeTime = document.getElementById('editOnetimeTime');
const editDailyTime = document.getElementById('editDailyTime');
const editWeeklyDay = document.getElementById('editWeeklyDay');
const editWeeklyTime = document.getElementById('editWeeklyTime');
const editMonthlyDate = document.getElementById('editMonthlyDate');
const editMonthlyTime = document.getElementById('editMonthlyTime');
const editYearlyDate = document.getElementById('editYearlyDate');
const editYearlyTime = document.getElementById('editYearlyTime');
const editDeadlinePreview = document.getElementById('editDeadlinePreview');

let currentEditingTask = null;
let currentEditingTaskRecurring = null;

// Close modal handlers
closeEditTaskDetailsModal.addEventListener('click', () => {
  editTaskDetailsModal.classList.add('hidden');
  currentEditingTask = null;
  currentEditingTaskRecurring = null;
});

cancelEditDetailsBtn.addEventListener('click', () => {
  editTaskDetailsModal.classList.add('hidden');
  currentEditingTask = null;
  currentEditingTaskRecurring = null;
});

// Add checklist item
addEditDetailsChecklistBtn.addEventListener('click', (e) => {
  e.preventDefault();
  const itemHtml = `
    <div class="flex gap-2 checklist-item-wrapper">
      <input type="text" class="checklist-item flex-1 px-3 sm:px-4 py-3 sm:py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 text-base min-h-[48px]" placeholder="Nhập nội dung checklist..." required>
      <button type="button" class="remove-checklist-btn bg-red-500 hover:bg-red-600 text-white px-3 rounded-lg min-w-[48px] min-h-[48px]">
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
        </svg>
      </button>
    </div>
  `;
  editDetailsChecklistContainer.insertAdjacentHTML('beforeend', itemHtml);
  
  // Attach remove handler
  const lastItem = editDetailsChecklistContainer.lastElementChild;
  lastItem.querySelector('.remove-checklist-btn').addEventListener('click', (e) => {
    e.preventDefault();
    lastItem.remove();
  });
});

// Task type change handler - show/hide deadline sections
editTaskType.addEventListener('change', (e) => {
  const type = e.target.value;
  
  // Hide all sections
  editOnetimeSettings.classList.add('hidden');
  editDailySettings.classList.add('hidden');
  editWeeklySettings.classList.add('hidden');
  editMonthlySettings.classList.add('hidden');
  editYearlySettings.classList.add('hidden');
  
  // Show appropriate section
  if (type === 'onetime') {
    editOnetimeSettings.classList.remove('hidden');
  } else if (type === 'daily') {
    editDailySettings.classList.remove('hidden');
  } else if (type === 'weekly') {
    editWeeklySettings.classList.remove('hidden');
  } else if (type === 'monthly') {
    editMonthlySettings.classList.remove('hidden');
  } else if (type === 'yearly') {
    editYearlySettings.classList.remove('hidden');
  }
  
  // Update preview
  updateEditDeadlinePreview();
});

// Update deadline preview
function updateEditDeadlinePreview() {
  const type = editTaskType.value;
  let deadline = null;
  
  if (type === 'onetime') {
    const date = editOnetimeDate.value;
    const time = editOnetimeTime.value || '00:00';
    
    if (date) {
      const [datePart, timePart] = [date, time];
      deadline = new Date(`${datePart}T${timePart}:00`);
    }
  } else if (type === 'daily') {
    const time = editDailyTime.value || '08:00';
    const today = new Date();
    today.setHours(parseInt(time.split(':')[0]), parseInt(time.split(':')[1]), 0, 0);
    deadline = today;
  } else if (type === 'weekly') {
    const dayOfWeek = parseInt(editWeeklyDay.value);
    const time = editWeeklyTime.value || '08:00';
    
    const today = new Date();
    let daysUntilTarget = (dayOfWeek - today.getDay() + 7) % 7;
    if (daysUntilTarget === 0) daysUntilTarget = 7;
    
    deadline = new Date(today);
    deadline.setDate(deadline.getDate() + daysUntilTarget);
    deadline.setHours(parseInt(time.split(':')[0]), parseInt(time.split(':')[1]), 0, 0);
  } else if (type === 'monthly') {
    const monthlyDate = editMonthlyDate.value;
    const time = editMonthlyTime.value || '08:00';
    
    if (!monthlyDate) {
      editDeadlinePreview.textContent = 'Vui lòng chọn ngày';
      return;
    }
    
    const selectedDate = new Date(`${monthlyDate}T${time}`);
    const dayOfMonth = selectedDate.getDate();
    
    const today = new Date();
    let nextDate = new Date(today.getFullYear(), today.getMonth(), dayOfMonth);
    nextDate.setHours(parseInt(time.split(':')[0]), parseInt(time.split(':')[1]), 0, 0);
    
    if (nextDate <= today) {
      nextDate = new Date(today.getFullYear(), today.getMonth() + 1, dayOfMonth);
      nextDate.setHours(parseInt(time.split(':')[0]), parseInt(time.split(':')[1]), 0, 0);
    }
    
    deadline = nextDate;
  } else if (type === 'yearly') {
    const yearlyDate = editYearlyDate.value;
    const time = editYearlyTime.value || '08:00';
    
    if (!yearlyDate) {
      editDeadlinePreview.textContent = 'Vui lòng chọn ngày';
      return;
    }
    
    const selectedDate = new Date(`${yearlyDate}T${time}`);
    const month = selectedDate.getMonth(); // 0-based
    const dayOfMonth = selectedDate.getDate();
    
    const today = new Date();
    let nextDate = new Date(today.getFullYear(), month, dayOfMonth);
    nextDate.setHours(parseInt(time.split(':')[0]), parseInt(time.split(':')[1]), 0, 0);
    
    if (nextDate <= today) {
      nextDate = new Date(today.getFullYear() + 1, month, dayOfMonth);
      nextDate.setHours(parseInt(time.split(':')[0]), parseInt(time.split(':')[1]), 0, 0);
    }
    
    deadline = nextDate;
  }
  
  if (deadline) {
    const previewText = deadline.toLocaleString('vi-VN');
    editDeadlinePreview.textContent = previewText;
  } else {
    editDeadlinePreview.textContent = 'Chưa đặt';
  }
}

// Event listeners for deadline fields
editOnetimeDate.addEventListener('change', updateEditDeadlinePreview);
editOnetimeTime.addEventListener('change', updateEditDeadlinePreview);
editDailyTime.addEventListener('change', updateEditDeadlinePreview);
editWeeklyDay.addEventListener('change', updateEditDeadlinePreview);
editWeeklyTime.addEventListener('change', updateEditDeadlinePreview);
editMonthlyDate.addEventListener('change', updateEditDeadlinePreview);
editMonthlyTime.addEventListener('change', updateEditDeadlinePreview);
editYearlyDate.addEventListener('change', updateEditDeadlinePreview);
editYearlyTime.addEventListener('change', updateEditDeadlinePreview);

// Open edit task details modal
async function openEditTaskDetailsModal(task) {
  
  // Log all possible ID fields
  
  // Log checklist and recurring
  
  // Determine which ID to use for API call
  const userTaskId = task.storeTaskId || task._id;
  
  // Fetch full task details from API
  try {
    const taskId = task._id || task.storeTaskId;
    
    // List of endpoints to try in order
    const endpointsToTry = [
      `/api/store-tasks/${taskId}`,           // Endpoint 1: Store tasks
      `/api/tasks/${taskId}`,                 // Endpoint 2: General tasks
      `/api/user-tasks/${taskId}`,            // Endpoint 3: User tasks
      `/api/broadcasts/store-tasks/${taskId}` // Endpoint 4: Broadcast store tasks
    ];
    
    let fullTaskData = null;
    let successfulEndpoint = null;
    
    // Try each endpoint
    for (const endpoint of endpointsToTry) {
      try {
        const response = await fetch(endpoint, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (response.ok) {
          const result = await response.json();
          
          // Check if response has the data we need
          if (result.data) {
            let responseData = result.data;
            
            // Normalize storeTask response: { storeTask: { broadcastId: {...} }, stats, isOverdue }
            // The checklist and recurring are inside storeTask.broadcastId (the populated Broadcast)
            if (responseData.storeTask && responseData.storeTask.broadcastId && typeof responseData.storeTask.broadcastId === 'object') {
              const storeTask = responseData.storeTask;
              const broadcast = storeTask.broadcastId;
              responseData = {
                _id: storeTask._id,
                broadcastId: broadcast._id,
                broadcastTitle: broadcast.title,
                broadcastDescription: broadcast.description,
                priority: broadcast.priority,
                deadline: broadcast.deadline,
                checklist: broadcast.checklist || [],
                recurring: broadcast.recurring,
                status: storeTask.status,
                completionRate: storeTask.completionRate
              };
            }
            
            
            // Accept this endpoint's data (it returned 200 with normalized data)
            // Prefer endpoints that have checklist or recurring, but always use the first 200 as fallback
            if (responseData.checklist?.length > 0 || responseData.recurring?.enabled) {
              fullTaskData = responseData;
              successfulEndpoint = endpoint;
              break;
            } else if (!fullTaskData) {
              // Keep as candidate in case no better endpoint found
              fullTaskData = responseData;
              successfulEndpoint = endpoint;
            }
          }
        } else {
        }
      } catch (error) {
      }
    }
    
    if (fullTaskData) {
      // Merge fullTaskData with original task to preserve employee info from dashboard API
      // Original task has: employeeId, employeeName, employeePhone, employeeBranch, userTaskId
      // fullTaskData has: checklist, recurring, broadcast details
      task = { ...task, ...fullTaskData };
    } else {
    }
  } catch (error) {
    console.error('[openEditTaskDetailsModal] ❌ Unexpected error while fetching:', error.message);
  }
  
  currentEditingTask = task;
  
  // Fill form with task data
  // IMPORTANT: Use userTaskId if available (from dashboard API), otherwise fallback to _id
  const taskId = task.userTaskId || task._id;
  document.getElementById('editTaskDetailsId').value = taskId;
  document.getElementById('editBroadcastId').value = task.broadcastId || '';
  
  // Try broadcastTitle first, then fallback to title
  const title = task.broadcastTitle || task.title || '';
  document.getElementById('editDetailsTitle').value = title;
  
  // Try broadcastDescription first, then fallback to description
  const description = task.broadcastDescription || task.description || '';
  document.getElementById('editDetailsDescription').value = description;
  
  document.getElementById('editDetailsPriority').value = task.priority || 'medium';
  
  
  // Determine task type from recurring data
  let taskType = 'onetime';
  currentEditingTaskRecurring = task.recurring || { enabled: false, frequency: 'onetime', pattern: {} };
  
  
  if (currentEditingTaskRecurring.enabled && currentEditingTaskRecurring.frequency) {
    taskType = currentEditingTaskRecurring.frequency;
  } else {
  }
  
  
  // Set task type
  editTaskType.value = taskType;
  
  // Load deadline data based on task type
  const pattern = currentEditingTaskRecurring.pattern || {};
  
  if (taskType === 'onetime' && task.deadline) {
    const deadline = new Date(task.deadline);
    editOnetimeDate.value = deadline.toISOString().split('T')[0];
    editOnetimeTime.value = deadline.toTimeString().slice(0, 5);
  } else if (taskType === 'daily') {
    editDailyTime.value = pattern.time || '08:00';
  } else if (taskType === 'weekly') {
    editWeeklyDay.value = pattern.dayOfWeek || 1;
    editWeeklyTime.value = pattern.time || '08:00';
  } else if (taskType === 'monthly') {
    // Set date input from pattern.dayOfMonth
    const dayOfMonth = pattern.dayOfMonth || 1;
    const today = new Date();
    const targetDate = new Date(today.getFullYear(), today.getMonth(), dayOfMonth);
    editMonthlyDate.value = targetDate.toISOString().split('T')[0];
    editMonthlyTime.value = pattern.time || '08:00';
  } else if (taskType === 'yearly') {
    // Set date input from pattern.month and pattern.dayOfMonth
    const month = (pattern.month || 1) - 1; // Convert to 0-based
    const dayOfMonth = pattern.dayOfMonth || pattern.day || 1; // Support both field names
    const today = new Date();
    const targetDate = new Date(today.getFullYear(), month, dayOfMonth);
    editYearlyDate.value = targetDate.toISOString().split('T')[0];
    editYearlyTime.value = pattern.time || '08:00';
  }
  
  // Trigger task type change to show correct section
  editTaskType.dispatchEvent(new Event('change'));
  
  // Update preview with loaded data
  updateEditDeadlinePreview();
  
  // Load checklist
  editDetailsChecklistContainer.innerHTML = '';
  if (task.checklist && task.checklist.length > 0) {
    task.checklist.forEach((item, index) => {
      const itemHtml = `
        <div class="flex gap-2 checklist-item-wrapper">
          <input type="text" class="checklist-item flex-1 px-3 sm:px-4 py-3 sm:py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 text-base min-h-[48px]" value="${item.task || item}" required>
          <button type="button" class="remove-checklist-btn bg-red-500 hover:bg-red-600 text-white px-3 rounded-lg min-w-[48px] min-h-[48px]">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
            </svg>
          </button>
        </div>
      `;
      editDetailsChecklistContainer.insertAdjacentHTML('beforeend', itemHtml);
    });
  } else {
    // Add one empty item if no checklist
    const itemHtml = `
      <div class="flex gap-2 checklist-item-wrapper">
        <input type="text" class="checklist-item flex-1 px-3 sm:px-4 py-3 sm:py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 text-base min-h-[48px]" placeholder="Nhập nội dung checklist..." required>
        <button type="button" class="remove-checklist-btn bg-red-500 hover:bg-red-600 text-white px-3 rounded-lg min-w-[48px] min-h-[48px]">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
          </svg>
        </button>
      </div>
    `;
    editDetailsChecklistContainer.insertAdjacentHTML('beforeend', itemHtml);
  }
  
  // Attach remove handlers
  document.querySelectorAll('#editDetailsChecklistContainer .remove-checklist-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      btn.closest('.checklist-item-wrapper').remove();
    });
  });
  
  // Populate current employee information
  console.log('[populateCurrentEmployee] Task data:', {
    employeeId: task.employeeId,
    employeeName: task.employeeName,
    employeePhone: task.employeePhone,
    employeeBranch: task.employeeBranch,
    userTaskId: task.userTaskId
  });
  populateCurrentEmployee(task);
  
  // Initialize employee selector
  initializeEmployeeSelector();
  
  // Show modal
  editTaskDetailsModal.classList.remove('hidden');
}

// Helper function to calculate deadline based on task type
function calculateEditDeadline(taskType) {
  let deadline = null;
  
  if (taskType === 'onetime') {
    const date = editOnetimeDate.value;
    const time = editOnetimeTime.value || '00:00';
    
    if (date) {
      deadline = new Date(`${date}T${time}:00`);
    }
  } else if (taskType === 'daily') {
    const time = editDailyTime.value || '08:00';
    const today = new Date();
    today.setHours(parseInt(time.split(':')[0]), parseInt(time.split(':')[1]), 0, 0);
    deadline = today;
  } else if (taskType === 'weekly') {
    const dayOfWeek = parseInt(editWeeklyDay.value);
    const time = editWeeklyTime.value || '08:00';
    
    const today = new Date();
    let daysUntilTarget = (dayOfWeek - today.getDay() + 7) % 7;
    if (daysUntilTarget === 0) daysUntilTarget = 7;
    
    deadline = new Date(today);
    deadline.setDate(deadline.getDate() + daysUntilTarget);
    deadline.setHours(parseInt(time.split(':')[0]), parseInt(time.split(':')[1]), 0, 0);
  } else if (taskType === 'monthly') {
    const monthlyDate = editMonthlyDate.value;
    const time = editMonthlyTime.value || '08:00';
    
    if (!monthlyDate) {
      return null;
    }
    
    const selectedDate = new Date(`${monthlyDate}T${time}`);
    const dayOfMonth = selectedDate.getDate();
    
    const today = new Date();
    let nextDate = new Date(today.getFullYear(), today.getMonth(), dayOfMonth);
    nextDate.setHours(parseInt(time.split(':')[0]), parseInt(time.split(':')[1]), 0, 0);
    
    if (nextDate <= today) {
      nextDate = new Date(today.getFullYear(), today.getMonth() + 1, dayOfMonth);
      nextDate.setHours(parseInt(time.split(':')[0]), parseInt(time.split(':')[1]), 0, 0);
    }
    
    deadline = nextDate;
  } else if (taskType === 'yearly') {
    const yearlyDate = editYearlyDate.value;
    const time = editYearlyTime.value || '08:00';
    
    if (!yearlyDate) {
      return null;
    }
    
    const selectedDate = new Date(`${yearlyDate}T${time}`);
    const month = selectedDate.getMonth(); // 0-based
    const dayOfMonth = selectedDate.getDate();
    
    const today = new Date();
    let nextDate = new Date(today.getFullYear(), month, dayOfMonth);
    nextDate.setHours(parseInt(time.split(':')[0]), parseInt(time.split(':')[1]), 0, 0);
    
    if (nextDate <= today) {
      nextDate = new Date(today.getFullYear() + 1, month, dayOfMonth);
      nextDate.setHours(parseInt(time.split(':')[0]), parseInt(time.split(':')[1]), 0, 0);
    }
    
    deadline = nextDate;
  }
  
  return deadline;
}

// Helper function to build recurring data
function buildEditRecurringData(taskType) {
  const recurringData = {
    enabled: taskType !== 'onetime',
    frequency: taskType,
    pattern: {}
  };
  
  if (taskType === 'daily') {
    recurringData.pattern.time = editDailyTime.value || '08:00';
  } else if (taskType === 'weekly') {
    recurringData.pattern.dayOfWeek = parseInt(editWeeklyDay.value);
    recurringData.pattern.time = editWeeklyTime.value || '08:00';
  } else if (taskType === 'monthly') {
    const monthlyDate = editMonthlyDate.value;
    const time = editMonthlyTime.value || '08:00';
    
    if (monthlyDate) {
      const selectedDate = new Date(`${monthlyDate}T${time}`);
      recurringData.pattern.dayOfMonth = selectedDate.getDate();
    } else {
      recurringData.pattern.dayOfMonth = 1;
    }
    
    recurringData.pattern.time = time;
  } else if (taskType === 'yearly') {
    const yearlyDate = editYearlyDate.value;
    const time = editYearlyTime.value || '08:00';
    
    if (yearlyDate) {
      const selectedDate = new Date(`${yearlyDate}T${time}`);
      recurringData.pattern.month = selectedDate.getMonth() + 1; // 1-based for backend
      recurringData.pattern.dayOfMonth = selectedDate.getDate();
    } else {
      recurringData.pattern.month = 1;
      recurringData.pattern.dayOfMonth = 1;
    }
    
    recurringData.pattern.time = time;
  }
  
  return recurringData;
}

// ==================== POPULATE CURRENT EMPLOYEE ====================
// Display current employee information in the edit modal

function populateCurrentEmployee(task) {
  const currentEmployeeNameEl = document.getElementById('editCurrentEmployeeName');
  const currentEmployeeInfoEl = document.getElementById('editCurrentEmployeeInfo');
  
  if (!task.employeeId || !task.employeeName || task.employeeName === 'Chưa giao') {
    // Task not assigned to any employee yet
    currentEmployeeNameEl.textContent = 'Chưa giao cho nhân viên';
    currentEmployeeInfoEl.textContent = 'Task này chưa được giao cho ai';
    currentEmployeeNameEl.classList.add('text-gray-500');
  } else {
    // Task is assigned to an employee
    currentEmployeeNameEl.textContent = task.employeeName;
    currentEmployeeNameEl.classList.remove('text-gray-500');
    
    // Build info string: Phone • Branch
    const infoParts = [];
    if (task.employeePhone) {
      infoParts.push(`📞 ${task.employeePhone}`);
    }
    if (task.employeeBranch) {
      infoParts.push(`🏪 ${task.employeeBranch}`);
    }
    
    currentEmployeeInfoEl.textContent = infoParts.join(' • ') || 'Thông tin không đầy đủ';
  }
}

// ==================== EMPLOYEE SELECTOR FOR EDIT MODAL ====================
// NEW (20/03/2026): Tabbed interface with Store and Employee tabs
// Reuses data loading from Assign Modal (loadStores, loadEmployees functions)

let editStoreEmployeesData = []; // Store employees for popup modal
let editSelectedStoreForEmployees = null; // Currently selected store

async function initializeEmployeeSelector() {
  // Clear previous state
  document.getElementById('editNewEmployeeId').value = '';
  document.getElementById('editStoreSearch').value = '';
  document.getElementById('editEmployeeSearch').value = '';
  document.getElementById('editSelectedEmployeeDisplay').classList.add('hidden');
  
  // Reuse data from Assign Modal (global arrays: allStores, allEmployees)
  // If not loaded yet, load using existing functions
  if (!allStores || allStores.length === 0) {
    await loadStores(); // Reuse Assign Modal's loadStores function
  }
  
  if (!allEmployees || allEmployees.length === 0) {
    await loadEmployees(); // Reuse Assign Modal's loadEmployees function
  }
  
  // Render stores list for Edit Modal (default tab)
  renderEditStoresList(allStores);
}

// Tab Switching Logic
document.getElementById('editStoresTab')?.addEventListener('click', () => {
  const storesTab = document.getElementById('editStoresTab');
  const employeesTab = document.getElementById('editEmployeesTab');
  const storesContent = document.getElementById('editStoresContent');
  const employeesContent = document.getElementById('editEmployeesContent');
  
  storesTab.classList.add('active', 'border-purple-600', 'text-purple-600');
  storesTab.classList.remove('border-transparent', 'text-gray-600');
  employeesTab.classList.remove('active', 'border-purple-600', 'text-purple-600');
  employeesTab.classList.add('border-transparent', 'text-gray-600');
  storesContent.classList.remove('hidden');
  employeesContent.classList.add('hidden');
});

document.getElementById('editEmployeesTab')?.addEventListener('click', () => {
  const storesTab = document.getElementById('editStoresTab');
  const employeesTab = document.getElementById('editEmployeesTab');
  const storesContent = document.getElementById('editStoresContent');
  const employeesContent = document.getElementById('editEmployeesContent');
  
  employeesTab.classList.add('active', 'border-purple-600', 'text-purple-600');
  employeesTab.classList.remove('border-transparent', 'text-gray-600');
  storesTab.classList.remove('active', 'border-purple-600', 'text-purple-600');
  storesTab.classList.add('border-transparent', 'text-gray-600');
  employeesContent.classList.remove('hidden');
  storesContent.classList.add('hidden');
  
  // Render employees list when switching to this tab
  renderEditEmployeesList(allEmployees);
});

// Render Stores List (for Chi nhánh tab)
function renderEditStoresList(stores) {
  const listContainer = document.getElementById('editStoresList');
  
  if (!stores || stores.length === 0) {
    listContainer.innerHTML = '<p class="text-center text-gray-500 py-4">Không có chi nhánh nào</p>';
    return;
  }
  
  listContainer.innerHTML = stores.map(store => `
    <div class="edit-store-item p-3 border border-gray-200 rounded-lg hover:bg-purple-50 hover:border-purple-400 cursor-pointer transition-all"
         data-store-id="${store._id}"
         data-store-name="${store.Name}">
      <div class="flex items-center gap-2">
        <i class="fas fa-store text-purple-600"></i>
        <div class="flex-1">
          <p class="font-semibold text-gray-900 text-sm">${store.Name}</p>
          <p class="text-xs text-gray-600">${store.Map_Address || 'N/A'}</p>
        </div>
        <i class="fas fa-chevron-right text-gray-400"></i>
      </div>
    </div>
  `).join('');
  
  // Attach click handlers to open popup
  document.querySelectorAll('.edit-store-item').forEach(item => {
    item.addEventListener('click', () => {
      const storeId = item.getAttribute('data-store-id');
      const storeName = item.getAttribute('data-store-name');
      openEditStoreEmployeesModal(storeId, storeName);
    });
  });
}

// Store Search Handler
document.getElementById('editStoreSearch')?.addEventListener('input', (e) => {
  const searchTerm = e.target.value.trim().toLowerCase();
  const filtered = allStores.filter(store => 
    store.Name.toLowerCase().includes(searchTerm) ||
    (store.Map_Address && store.Map_Address.toLowerCase().includes(searchTerm))
  );
  renderEditStoresList(filtered);
});

// Render Employees List (for Nhân viên tab - direct selection)
function renderEditEmployeesList(employees) {
  const listContainer = document.getElementById('editEmployeeList');
  
  if (!employees || employees.length === 0) {
    listContainer.innerHTML = '<p class="text-center text-gray-500 py-4">Không có nhân viên nào</p>';
    return;
  }
  
  listContainer.innerHTML = employees.map(emp => `
    <div class="edit-employee-item p-3 border border-gray-200 rounded-lg hover:bg-purple-50 hover:border-purple-400 cursor-pointer transition-all"
         data-employee-id="${emp._id}"
         data-employee-name="${emp.FullName}"
         data-employee-phone="${emp.Phone}"
         data-branch-name="${emp.ID_Branch?.Name || 'N/A'}">
      <div class="flex items-center gap-2">
        <i class="fas fa-user-circle text-purple-600"></i>
        <div class="flex-1">
          <p class="font-semibold text-gray-900 text-sm">${emp.FullName}</p>
          <p class="text-xs text-gray-600">${emp.Phone} • ${emp.ID_Branch?.Name || 'N/A'}</p>
        </div>
      </div>
    </div>
  `).join('');
  
  // Attach click handlers for direct selection
  document.querySelectorAll('.edit-employee-item').forEach(item => {
    item.addEventListener('click', () => {
      selectEditEmployee(
        item.getAttribute('data-employee-id'),
        item.getAttribute('data-employee-name'),
        item.getAttribute('data-employee-phone'),
        item.getAttribute('data-branch-name')
      );
    });
  });
}

// Employee Search Handler (Nhân viên tab)
document.getElementById('editEmployeeSearch')?.addEventListener('input', (e) => {
  const searchTerm = e.target.value.trim().toLowerCase();
  const filtered = allEmployees.filter(emp => 
    emp.FullName.toLowerCase().includes(searchTerm) ||
    emp.Phone.includes(searchTerm)
  );
  renderEditEmployeesList(filtered);
});

// Select Employee (Single Select)
function selectEditEmployee(employeeId, employeeName, employeePhone, branchName) {
  // Set hidden input
  document.getElementById('editNewEmployeeId').value = employeeId;
  
  // Show selected display
  document.getElementById('editSelectedEmployeeName').textContent = employeeName;
  document.getElementById('editSelectedEmployeeInfo').textContent = `${employeePhone} • ${branchName}`;
  document.getElementById('editSelectedEmployeeDisplay').classList.remove('hidden');
  
  // Clear search fields
  document.getElementById('editStoreSearch').value = '';
  document.getElementById('editEmployeeSearch').value = '';
}

// Clear Selected Employee
document.getElementById('clearEditSelectedEmployee')?.addEventListener('click', () => {
  document.getElementById('editNewEmployeeId').value = '';
  document.getElementById('editSelectedEmployeeDisplay').classList.add('hidden');
  document.getElementById('editStoreSearch').value = '';
  document.getElementById('editEmployeeSearch').value = '';
});

// ==================== POPUP MODAL: STORE EMPLOYEES SELECTION ====================

function openEditStoreEmployeesModal(storeId, storeName) {
  editSelectedStoreForEmployees = { id: storeId, name: storeName };
  
  // Set store name in modal header
  document.getElementById('editStoreEmployeesStoreName').textContent = storeName;
  
  // Filter employees by store
  editStoreEmployeesData = allEmployees.filter(emp => emp.ID_Branch?._id === storeId);
  
  // Render employees list
  renderEditStoreEmployees(editStoreEmployeesData);
  
  // Show modal
  document.getElementById('editStoreEmployeesModal').classList.remove('hidden');
  
  // Clear search
  document.getElementById('editStoreEmployeeSearch').value = '';
  document.getElementById('editStoreEmployeesSelection').textContent = 'Chưa chọn nhân viên';
}

function renderEditStoreEmployees(employees) {
  const listContainer = document.getElementById('editStoreEmployeesList');
  
  if (!employees || employees.length === 0) {
    listContainer.innerHTML = '<p class="text-center text-gray-500 py-4">Không có nhân viên nào trong chi nhánh này</p>';
    return;
  }
  
  const currentSelectedId = document.getElementById('editNewEmployeeId').value;
  
  listContainer.innerHTML = employees.map(emp => {
    const isSelected = emp._id === currentSelectedId;
    return `
      <label class="edit-store-employee-item p-3 border ${isSelected ? 'border-purple-500 bg-purple-50' : 'border-gray-200'} rounded-lg hover:bg-purple-50 hover:border-purple-400 cursor-pointer transition-all flex items-center gap-3">
        <input type="radio" name="editStoreEmployee" value="${emp._id}" 
               data-employee-name="${emp.FullName}"
               data-employee-phone="${emp.Phone}"
               data-branch-name="${emp.ID_Branch?.Name || 'N/A'}"
               ${isSelected ? 'checked' : ''}
               class="w-5 h-5 text-purple-600">
        <div class="flex items-center gap-2 flex-1">
          <i class="fas fa-user-circle text-purple-600"></i>
          <div class="flex-1">
            <p class="font-semibold text-gray-900 text-sm">${emp.FullName}</p>
            <p class="text-xs text-gray-600">${emp.Phone} • ${emp.ID_Branch?.Name || 'N/A'}</p>
          </div>
        </div>
      </label>
    `;
  }).join('');
  
  // Update selection display when radio changes
  document.querySelectorAll('input[name="editStoreEmployee"]').forEach(radio => {
    radio.addEventListener('change', () => {
      if (radio.checked) {
        const empName = radio.getAttribute('data-employee-name');
        document.getElementById('editStoreEmployeesSelection').textContent = empName;
      }
    });
  });
}

// Store Employee Search Handler
document.getElementById('editStoreEmployeeSearch')?.addEventListener('input', (e) => {
  const searchTerm = e.target.value.trim().toLowerCase();
  const filtered = editStoreEmployeesData.filter(emp => 
    emp.FullName.toLowerCase().includes(searchTerm) ||
    emp.Phone.includes(searchTerm)
  );
  renderEditStoreEmployees(filtered);
});

// Confirm Store Employee Selection
document.getElementById('confirmEditStoreEmployeesBtn')?.addEventListener('click', () => {
  const selectedRadio = document.querySelector('input[name="editStoreEmployee"]:checked');
  
  if (!selectedRadio) {
    alert('Vui lòng chọn một nhân viên');
    return;
  }
  
  const employeeId = selectedRadio.value;
  const employeeName = selectedRadio.getAttribute('data-employee-name');
  const employeePhone = selectedRadio.getAttribute('data-employee-phone');
  const branchName = selectedRadio.getAttribute('data-branch-name');
  
  // Select employee
  selectEditEmployee(employeeId, employeeName, employeePhone, branchName);
  
  // Close popup
  document.getElementById('editStoreEmployeesModal').classList.add('hidden');
});

// Cancel Store Employees Selection
document.getElementById('cancelEditStoreEmployeesBtn')?.addEventListener('click', () => {
  document.getElementById('editStoreEmployeesModal').classList.add('hidden');
});

// Close Store Employees Modal
document.getElementById('closeEditStoreEmployeesModal')?.addEventListener('click', () => {
  document.getElementById('editStoreEmployeesModal').classList.add('hidden');
});

// Save edited task details
saveEditDetailsBtn.addEventListener('click', async () => {
  try {
    const taskId = document.getElementById('editTaskDetailsId').value;
    const broadcastId = document.getElementById('editBroadcastId').value;
    const title = document.getElementById('editDetailsTitle').value.trim();
    const description = document.getElementById('editDetailsDescription').value.trim();
    const priority = document.getElementById('editDetailsPriority').value;
    const taskType = editTaskType.value;
    
    if (!title || !description) {
      errorMessage.textContent = 'Vui lòng điền đầy đủ tiêu đề và mô tả';
      errorModal.classList.remove('hidden');
      return;
    }
    
    // Collect checklist
    const checklistItems = [];
    document.querySelectorAll('#editDetailsChecklistContainer .checklist-item').forEach(input => {
      const value = input.value.trim();
      if (value) {
        checklistItems.push({ task: value, required: true });
      }
    });
    
    if (checklistItems.length === 0) {
      errorMessage.textContent = 'Vui lòng thêm ít nhất 1 checklist item';
      errorModal.classList.remove('hidden');
      return;
    }
    
    // Validate deadline based on task type
    const deadline = calculateEditDeadline(taskType);
    if (!deadline) {
      errorMessage.textContent = 'Vui lòng đặt deadline hợp lệ';
      errorModal.classList.remove('hidden');
      return;
    }
    
    saveEditDetailsBtn.disabled = true;
    saveEditDetailsBtn.innerHTML = '<svg class="w-5 h-5 inline mr-2 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path></svg> Đang lưu...';
    
    // Build recurring data
    const recurringData = buildEditRecurringData(taskType);
    
    // Get new employee ID if reassigning
    const newEmployeeId = document.getElementById('editNewEmployeeId').value;
    
    const requestBody = {
      title,
      description,
      priority,
      checklist: checklistItems,
      deadline: deadline.toISOString(),
      recurring: recurringData
    };
    
    // Add employeeId if reassigning
    if (newEmployeeId) {
      requestBody.employeeId = newEmployeeId;
    }
    
    // Use unified admin endpoint for UserTask updates (supports both edit and reassign)
    // taskId already contains the correct userTaskId from editTaskDetailsId input field
    const response = await fetch(`/api/admin/user-tasks/${taskId}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestBody)
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Không thể cập nhật task');
    }
    
    const result = await response.json();
    
    const actionText = newEmployeeId ? 'cập nhật và giao lại' : 'cập nhật';
    successMessage.textContent = `Đã ${actionText} công việc thành công!`;
    successModal.classList.remove('hidden');
    editTaskDetailsModal.classList.add('hidden');
    currentEditingTask = null;
    currentEditingTaskRecurring = null;
    
    // Reload task list
    loadTaskList(currentTaskFilter);
    
  } catch (error) {
    console.error('Error updating task details:', error);
    errorMessage.textContent = error.message || 'Đã xảy ra lỗi';
    errorModal.classList.remove('hidden');
  } finally {
    saveEditDetailsBtn.disabled = false;
    saveEditDetailsBtn.innerHTML = '<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg> Lưu thay đổi';
  }
});

// ==================== DELETE TASK FUNCTION ====================

/*
 * DEPRECATED: Edit Task Reassign functions removed (merged into Edit Task Details modal)
 * Date: 20/03/2026
 * Reason: Unified edit and reassign into single modal per business logic § 2.8
 */

/*
const editTaskReassignModal = document.getElementById('editTaskReassignModal');
const closeEditReassignModal = document.getElementById('closeEditReassignModal');
const reassignStoresTab = document.getElementById('reassignStoresTab');
const reassignEmployeesTab = document.getElementById('reassignEmployeesTab');
const reassignStoresContent = document.getElementById('reassignStoresContent');
const reassignEmployeesContent = document.getElementById('reassignEmployeesContent');
const reassignStoreSearch = document.getElementById('reassignStoreSearch');
const reassignEmployeeSearch = document.getElementById('reassignEmployeeSearch');
const reassignStoresList = document.getElementById('reassignStoresList');
const reassignEmployeesList = document.getElementById('reassignEmployeesList');
const cancelEditReassignBtn = document.getElementById('cancelEditReassignBtn');
const confirmEditReassignBtn = document.getElementById('confirmEditReassignBtn');

let selectedReassignTarget = null; // { type: 'store'|'employee', id, name }

// Tab switching
reassignStoresTab.addEventListener('click', () => {
  reassignStoresContent.classList.remove('hidden');
  reassignEmployeesContent.classList.add('hidden');
  reassignStoresTab.classList.add('border-blue-600', 'text-blue-600');
  reassignStoresTab.classList.remove('border-transparent', 'text-gray-600');
  reassignEmployeesTab.classList.remove('border-blue-600', 'text-blue-600');
  reassignEmployeesTab.classList.add('border-transparent', 'text-gray-600');
});

reassignEmployeesTab.addEventListener('click', () => {
  reassignEmployeesContent.classList.remove('hidden');
  reassignStoresContent.classList.add('hidden');
  reassignEmployeesTab.classList.add('border-blue-600', 'text-blue-600');
  reassignEmployeesTab.classList.remove('border-transparent', 'text-gray-600');
  reassignStoresTab.classList.remove('border-blue-600', 'text-blue-600');
  reassignStoresTab.classList.add('border-transparent', 'text-gray-600');
});

// Close modal
closeEditReassignModal.addEventListener('click', () => {
  editTaskReassignModal.classList.add('hidden');
  selectedReassignTarget = null;
});

cancelEditReassignBtn.addEventListener('click', () => {
  editTaskReassignModal.classList.add('hidden');
  selectedReassignTarget = null;
});

// Store search with debounce (reuses loadReassignStores)
let reassignStoreSearchTimer = null;
reassignStoreSearch.addEventListener('input', (e) => {
  const searchTerm = e.target.value.trim();
  
  // Clear previous timer
  if (reassignStoreSearchTimer) {
    clearTimeout(reassignStoreSearchTimer);
  }
  
  // Debounce: wait 300ms after user stops typing
  reassignStoreSearchTimer = setTimeout(() => {
    loadReassignStores(searchTerm);
  }, 300);
});

// Employee search with debounce (reuses loadReassignEmployees)
let reassignEmployeeSearchTimer = null;
reassignEmployeeSearch.addEventListener('input', (e) => {
  const searchTerm = e.target.value.trim();
  
  // Clear previous timer
  if (reassignEmployeeSearchTimer) {
    clearTimeout(reassignEmployeeSearchTimer);
  }
  
  // Debounce: wait 300ms after user stops typing
  reassignEmployeeSearchTimer = setTimeout(() => {
    loadReassignEmployees(searchTerm);
  }, 300);
});

// Open edit task reassign modal
async function openEditTaskReassignModal(task) {
  currentEditingTask = task;
  selectedReassignTarget = null;
  
  document.getElementById('reassignTaskTitle').textContent = task.broadcastTitle || task.title || '';
  
  // Reset search
  reassignStoreSearch.value = '';
  reassignEmployeeSearch.value = '';
  
  // Show store tab by default
  reassignStoresTab.click();
  
  editTaskReassignModal.classList.remove('hidden');
  
  // Load full lists just like assignModal (reuse same functions)
  await Promise.all([
    loadReassignStores(),
    loadReassignEmployees()
  ]);
}

// Load stores for reassignment (reuses loadStores logic but renders for single selection)
async function loadReassignStores(searchQuery = '') {
  reassignStoresList.innerHTML = '<p class="text-center text-gray-500 py-8">Đang tải...</p>';
  
  try {
    const params = new URLSearchParams({
      limit: '100',
      page: '1'
    });
    
    if (searchQuery) {
      params.set('search', searchQuery);
    }
    
    const response = await fetch(`/api/brands?${params.toString()}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    if (!response.ok) throw new Error('Không thể tải danh sách chi nhánh');
    
    const result = await response.json();
    const stores = result.data?.brands || result.brands || [];
    
    // Save to global allStores for later use when clicking on store
    allStores = stores;
    
    if (stores.length === 0) {
      reassignStoresList.innerHTML = '<p class="text-center text-gray-500 py-8">Không có chi nhánh nào</p>';
      return;
    }
    
    // Render stores with radio selection mode (single choice)
    reassignStoresList.innerHTML = stores.map(store => `
      <div class="reassign-store-item p-4 border border-gray-200 rounded-lg hover:bg-blue-50 hover:border-blue-400 cursor-pointer transition-all" 
           data-store-id="${store._id}" 
           data-store-name="${store.Name}">
        <div class="flex items-start gap-3">
          <div class="flex-shrink-0 mt-1">
            <i class="far fa-circle text-gray-400 text-xl"></i>
          </div>
          <div class="flex-1 min-w-0">
            <div class="flex items-center gap-2">
              <i class="fas fa-store text-blue-600"></i>
              <p class="font-semibold text-gray-900">${store.Name}</p>
            </div>
          </div>
        </div>
      </div>
    `).join('');
    
    // Attach click handlers for single selection
    document.querySelectorAll('.reassign-store-item').forEach(item => {
      item.addEventListener('click', async () => {
        const storeId = item.getAttribute('data-store-id');
        const storeName = item.getAttribute('data-store-name');
        
        // Find store object
        const store = allStores.find(s => s._id === storeId);
        
        if (store) {
          // Open employee selection modal (same as assign modal logic)
          storeEmployeesModalContext = 'reassign'; // Track context
          currentSelectingStore = store;
          storeEmployeesStoreName.textContent = `Chi nhánh: ${store.Name}`;
          selectedStoreEmployees = [];
          
          if (!storeEmployeesModal) {
            console.error('❌ Modal element not found!');
            return;
          }
          
          storeEmployeesModal.classList.remove('hidden');
          await loadStoreEmployees(store._id);
        }
      });
    });
    
  } catch (error) {
    console.error('Error loading reassign stores:', error);
    reassignStoresList.innerHTML = '<p class="text-center text-red-500 py-8">Lỗi khi tải dữ liệu</p>';
  }
}

// Load employees for reassignment (reuses loadEmployees logic but renders for single selection)
async function loadReassignEmployees(searchQuery = '') {
  reassignEmployeesList.innerHTML = '<p class="text-center text-gray-500 py-8">Đang tải...</p>';
  
  try {
    const params = new URLSearchParams({
      limit: '800',
      page: '1',
      status: 'Đang hoạt động'
    });
    
    if (searchQuery) {
      params.set('search', searchQuery);
    }
    
    const response = await fetch(`/api/employees?${params.toString()}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    if (!response.ok) throw new Error('Không thể tải danh sách nhân viên');
    
    const result = await response.json();
    const employees = result.data || result.employees || [];
    
    if (employees.length === 0) {
      reassignEmployeesList.innerHTML = '<p class="text-center text-gray-500 py-8">Không có nhân viên nào</p>';
      return;
    }
    
    // Render employees with radio selection mode (single choice)
    reassignEmployeesList.innerHTML = employees.map(emp => `
      <div class="reassign-employee-item p-4 border border-gray-200 rounded-lg hover:bg-blue-50 hover:border-blue-400 cursor-pointer transition-all" 
           data-employee-id="${emp._id}" 
           data-employee-name="${emp.FullName}">
        <div class="flex items-start gap-3">
          <div class="flex-shrink-0 mt-1">
            <i class="far fa-circle text-gray-400 text-xl"></i>
          </div>
          <div class="flex-1 min-w-0">
            <div class="flex items-center gap-2 mb-2">
              <i class="fas fa-user-circle text-blue-600 text-lg"></i>
              <p class="font-semibold text-gray-900">${emp.FullName}</p>
            </div>
            <div class="space-y-1.5 text-sm">
              <div class="flex items-center gap-2 text-gray-600">
                <i class="fas fa-phone text-green-500 w-4"></i>
                <span>${emp.Phone}</span>
                <span class="text-gray-400">•</span>
                <i class="fas fa-briefcase text-purple-500 w-4"></i>
                <span>${emp.ID_GroupUser?.Name || 'Chưa xác định'}</span>
              </div>
              <div class="flex items-center gap-2 text-gray-600">
                <i class="fas fa-building text-orange-500 w-4"></i>
                <span>${emp.ID_Branch?.Name || 'Chưa có chi nhánh'}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    `).join('');
    
    // Attach click handlers for single selection
    document.querySelectorAll('.reassign-employee-item').forEach(item => {
      item.addEventListener('click', () => {
        // Deselect all
        document.querySelectorAll('.reassign-employee-item').forEach(i => {
          i.classList.remove('bg-blue-50', 'border-blue-600');
          i.querySelector('i.fa-circle').classList.remove('fa-check-circle', 'fas', 'text-blue-600');
          i.querySelector('i.fa-circle').classList.add('far', 'text-gray-400');
        });
        
        // Select this one
        item.classList.add('bg-blue-50', 'border-blue-600');
        const icon = item.querySelector('i.fa-circle');
        icon.classList.remove('far', 'text-gray-400');
        icon.classList.add('fas', 'fa-check-circle', 'text-blue-600');
        
        selectedReassignTarget = {
          type: 'employee',
          id: item.getAttribute('data-employee-id'),
          name: item.getAttribute('data-employee-name')
        };
      });
    });
    
  } catch (error) {
    console.error('Error loading reassign employees:', error);
    reassignEmployeesList.innerHTML = '<p class="text-center text-red-500 py-8">Lỗi khi tải dữ liệu</p>';
  }
}

// Confirm reassign
confirmEditReassignBtn.addEventListener('click', async () => {
  if (!selectedReassignTarget) {
    errorMessage.textContent = 'Vui lòng chọn ' + (reassignStoresContent.classList.contains('hidden') ? 'nhân viên' : 'chi nhánh');
    errorModal.classList.remove('hidden');
    return;
  }
  
  // Check if task has userTaskId
  if (!currentEditingTask.userTaskId) {
    errorMessage.textContent = 'Không thể giao lại task chưa được giao cho nhân viên';
    errorModal.classList.remove('hidden');
    return;
  }
  
  try {
    confirmEditReassignBtn.disabled = true;
    confirmEditReassignBtn.innerHTML = '<svg class="w-5 h-5 inline mr-2 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path></svg> Đang xác nhận...';
    
    const requestBody = {};
    if (selectedReassignTarget.type === 'store') {
      requestBody.storeId = selectedReassignTarget.id;
    } else if (selectedReassignTarget.type === 'both') {
      // When selecting store with employees
      if (selectedReassignTarget.employeeIds && selectedReassignTarget.employeeIds.length > 0) {
        requestBody.employeeId = selectedReassignTarget.employeeIds[0];
      }
    } else {
      requestBody.employeeId = selectedReassignTarget.id;
    }
    
    
    const response = await fetch(`/api/broadcasts/user-tasks/${currentEditingTask.userTaskId}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestBody)
    });
    
    const result = await response.json();
    
    if (!response.ok) {
      if (result.errors && result.errors.length > 0) {
        errorMessage.innerHTML = result.errors.map(e => `<div>${e}</div>`).join('');
        errorModal.classList.remove('hidden');
        return;
      }
      throw new Error(result.message || 'Không thể giao lại task');
    }
    
    successMessage.textContent = `Đã giao lại công việc cho ${selectedReassignTarget.name} thành công!`;
    successModal.classList.remove('hidden');
    editTaskReassignModal.classList.add('hidden');
    selectedReassignTarget = null;
    currentEditingTask = null;
    
    // Reload task list
    loadTaskList(currentTaskFilter);
    
  } catch (error) {
    console.error('Error reassigning task:', error);
    errorMessage.textContent = error.message || 'Đã xảy ra lỗi';
    errorModal.classList.remove('hidden');
  } finally {
    confirmEditReassignBtn.disabled = false;
    confirmEditReassignBtn.innerHTML = 'Xác nhận';
  }
});
*/

// ==================== DELETE TASK FUNCTION ====================

async function handleDeleteTask(task) {
  // Get userTaskId (from dashboard API) or fallback to _id
  const taskId = task.userTaskId || task._id;
  
  // Check if task has been assigned to employee
  if (!taskId) {
    errorMessage.textContent = 'Không thể xóa task chưa được giao cho nhân viên. Vui lòng xóa broadcast gốc.';
    errorModal.classList.remove('hidden');
    return;
  }

  const confirmMsg = `Bạn có chắc chắn muốn xóa task "${task.broadcastTitle || task.title}" của nhân viên ${task.employeeName || 'N/A'}?\n\nLưu ý: Không thể xóa task đã hoàn thành.`;
  
  if (!confirm(confirmMsg)) {
    return;
  }
  
  try {
    // IMPROVED (20/03/2026): Use new RESTful endpoint
    const response = await fetch(`/api/admin/user-tasks/${taskId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Không thể xóa task');
    }
    
    const result = await response.json();
    
    successMessage.textContent = 'Đã xóa task thành công!';
    successModal.classList.remove('hidden');
    
    // Reload task list
    loadTaskList(currentTaskFilter);
    
  } catch (error) {
    console.error('Error deleting task:', error);
    errorMessage.textContent = error.message;
    errorModal.classList.remove('hidden');
  }
}

