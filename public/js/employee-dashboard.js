// Employee Dashboard Logic

// Check authentication
const token = localStorage.getItem('token');
const employee = JSON.parse(localStorage.getItem('employee') || '{}');

if (!token) {
  window.location.href = '/login';
}

if (employee.role === 'admin' || employee.role === 'manager') {
  window.location.href = `/${employee.role}/dashboard`;
}

// Display user name and position
document.getElementById('userName').textContent = employee.fullName || 'Employee';
document.getElementById('userPosition').textContent = employee.groupUser || 'Nhân viên';

function logout() {
  localStorage.removeItem('token');
  localStorage.removeItem('employee');
  window.location.href = '/login';
}

document.getElementById('logoutBtn').addEventListener('click', logout);

// ─── Helpers ────────────────────────────────────────────────────────────────

function priorityBadge(priority) {
  const map = {
    urgent:   'bg-red-100 text-red-700',
    high:     'bg-orange-100 text-orange-700',
    medium:   'bg-yellow-100 text-yellow-700',
    low:      'bg-gray-100 text-gray-600'
  };
  const label = { urgent: 'Khẩn', high: 'Cao', medium: 'Trung bình', low: 'Thấp' };
  const cls = map[priority] || map.medium;
  return `<span class="text-xs px-2 py-0.5 rounded-full font-medium ${cls}">${label[priority] || priority}</span>`;
}

function statusBadge(status) {
  const map = {
    assigned:    'bg-blue-100 text-blue-700',
    in_progress: 'bg-yellow-100 text-yellow-700',
    submitted:   'bg-purple-100 text-purple-700',
    approved:    'bg-green-100 text-green-700',
    rejected:    'bg-red-100 text-red-700'
  };
  const label = {
    assigned:    'Mới giao',
    in_progress: 'Đang làm',
    submitted:   'Đã nộp',
    approved:    'Đã duyệt',
    rejected:    'Từ chối'
  };
  const cls = map[status] || 'bg-gray-100 text-gray-600';
  return `<span class="text-xs px-2 py-0.5 rounded-full font-medium ${cls}">${label[status] || status}</span>`;
}

function formatDeadline(deadlineStr) {
  if (!deadlineStr) return '';
  const d = new Date(deadlineStr);
  const isOverdue = d < new Date();
  const formatted = d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
  return isOverdue
    ? `<span class="text-red-600 font-medium">⚠️ ${formatted}</span>`
    : `<span class="text-gray-600">${formatted}</span>`;
}

function escapeHtml(text) {
  if (!text) return '';
  const div = document.createElement('div');
  div.appendChild(document.createTextNode(String(text)));
  return div.innerHTML;
}

function showToast(message, type = 'info') {
  const colors = { success: 'bg-green-500', error: 'bg-red-500', info: 'bg-blue-500', warning: 'bg-yellow-500' };
  const toast = document.createElement('div');
  toast.className = `fixed bottom-4 right-4 z-[200] px-5 py-3 rounded-lg text-white text-sm font-medium shadow-lg ${colors[type] || colors.info}`;
  toast.textContent = message;
  document.body.appendChild(toast);
  setTimeout(() => toast.remove(), 3500);
}

// ─── Section 1: Việc tôi phụ trách ─────────────────────────────────────────

function renderResponsibleTasks(tasks) {
  const section = document.getElementById('responsibleTasksSection');
  const list = document.getElementById('responsibleTasksList');
  const countBadge = document.getElementById('responsibleCount');

  if (!tasks || tasks.length === 0) {
    section.classList.add('hidden');
    return;
  }

  countBadge.textContent = tasks.length;
  section.classList.remove('hidden');

  list.innerHTML = tasks.map(task => {
    const employeeNames = (task.assignedEmployees || []).map(e => e.FullName || e.fullName).join(', ') || '—';
    return `
      <div class="bg-white rounded-lg shadow p-5 border-l-4 border-purple-500">
        <div class="flex items-start justify-between mb-3">
          <div class="flex-1 min-w-0 mr-2">
            <h4 class="font-semibold text-gray-900 truncate">${task.broadcastTitle || '(Không có tiêu đề)'}</h4>
            <div class="flex items-center gap-2 mt-1 flex-wrap">
              <span class="text-xs px-2 py-0.5 rounded-full font-medium bg-purple-100 text-purple-700">👑 Phụ trách</span>
              ${statusBadge(task.status)}
              ${task.priority ? priorityBadge(task.priority) : ''}
            </div>
          </div>
        </div>
        <div class="mb-3">
          <div class="flex justify-between text-xs text-gray-500 mb-1">
            <span>Tiến độ</span>
            <span>${task.completionRate || 0}%</span>
          </div>
          <div class="w-full bg-gray-200 rounded-full h-2">
            <div class="bg-purple-500 h-2 rounded-full" style="width: ${task.completionRate || 0}%"></div>
          </div>
        </div>
        <div class="text-sm text-gray-600 space-y-1">
          ${task.deadline ? `<div>📅 Hạn: ${formatDeadline(task.deadline)}</div>` : ''}
          <div>👥 Đồng phụ trách: <span class="text-gray-800">${employeeNames}</span></div>
          <div>📋 Checklist: ${task.checklistCount} mục</div>
        </div>
        ${task.userTaskId ? `
        <div class="mt-4">
          <button onclick="openTaskDetail('${task.userTaskId}', 'responsible')" class="w-full py-2 text-sm font-medium bg-purple-50 text-purple-700 rounded-lg hover:bg-purple-100 transition">
            🔍 Xem chi tiết
          </button>
        </div>` : ''}
      </div>
    `;
  }).join('');
}

// ─── Section 2: Việc của tôi ────────────────────────────────────────────────

function renderMyTasks(tasks) {
  const section = document.getElementById('myTasksSection');
  const list = document.getElementById('myTasksList');
  const countBadge = document.getElementById('myTaskCount');

  if (!tasks || tasks.length === 0) {
    section.classList.add('hidden');
    return;
  }

  countBadge.textContent = tasks.length;
  section.classList.remove('hidden');

  list.innerHTML = tasks.map(task => {
    const checklist = task.checklist || [];
    const doneCount = checklist.filter(c => c.isCompleted).length;
    const checklistHtml = checklist.length > 0
      ? `<div class="mt-2 space-y-1">${checklist.slice(0, 4).map(c => `
        <div class="flex items-center gap-2 text-sm">
          <span class="${c.isCompleted ? 'text-green-500' : 'text-gray-400'}">${c.isCompleted ? '✅' : '⬜'}</span>
          <span class="${c.isCompleted ? 'line-through text-gray-400' : 'text-gray-700'}">${c.task}</span>
        </div>`).join('')}
        ${checklist.length > 4 ? `<div class="text-xs text-gray-400">+${checklist.length - 4} mục khác</div>` : ''}
      </div>`
      : '';

    return `
      <div class="bg-white rounded-lg shadow p-5 border-l-4 border-green-500">
        <div class="flex items-start justify-between mb-3">
          <div class="flex-1 min-w-0 mr-2">
            <h4 class="font-semibold text-gray-900 truncate">${task.broadcastId?.title || '(Không có tiêu đề)'}</h4>
            <div class="flex items-center gap-2 mt-1 flex-wrap">
              <span class="text-xs px-2 py-0.5 rounded-full font-medium bg-green-100 text-green-700">🔧 Thực hiện</span>
              ${statusBadge(task.status)}
              ${task.broadcastId?.priority ? priorityBadge(task.broadcastId.priority) : ''}
            </div>
          </div>
        </div>
        ${checklist.length > 0 ? `
        <div class="mb-3">
          <div class="flex justify-between text-xs text-gray-500 mb-1">
            <span>Checklist</span>
            <span>${doneCount}/${checklist.length} hoàn thành</span>
          </div>
          <div class="w-full bg-gray-200 rounded-full h-2">
            <div class="bg-green-500 h-2 rounded-full" style="width: ${checklist.length > 0 ? Math.round(doneCount / checklist.length * 100) : 0}%"></div>
          </div>
        </div>` : ''}
        <div class="text-sm text-gray-600">
          ${task.broadcastId?.deadline ? `<div>📅 Hạn: ${formatDeadline(task.broadcastId.deadline)}</div>` : ''}
        </div>
        ${checklistHtml}
        ${task.isOverdue ? '<div class="mt-2 text-xs text-red-600 font-medium">⚠️ Đã quá hạn</div>' : ''}
        <div class="mt-4">
          <button onclick="openTaskDetail('${task._id}', 'worker')" class="w-full py-2 text-sm font-medium bg-green-50 text-green-700 rounded-lg hover:bg-green-100 transition">
            🔍 Xem chi tiết
          </button>
        </div>
      </div>
    `;
  }).join('');
}

// ─── Empty State ─────────────────────────────────────────────────────────────

function renderEmptyState() {
  const empty = document.getElementById('emptyState');
  if (empty) empty.classList.remove('hidden');
}

// ─── Load Dashboard ───────────────────────────────────────────────────────────

async function loadDashboard() {
  try {
    const response = await fetch('/api/dashboard/employee', {
      headers: { 'Authorization': `Bearer ${token}` }
    });

    if (!response.ok) throw new Error('Không thể tải dữ liệu dashboard');

    const result = await response.json();
    const data = result.data;
    const overview = data.overview || {};

    // KPI cards
    document.getElementById('myTasks').textContent = overview.totalTasks ?? 0;
    document.getElementById('completedTasks').textContent = overview.completedThisMonth ?? 0;
    document.getElementById('pendingTasks').textContent = (overview.assignedTasks ?? 0) + (overview.inProgressTasks ?? 0);
    document.getElementById('averageRating').textContent = (overview.avgRating ?? 0).toFixed(1);

    // Two sections
    renderResponsibleTasks(data.responsibleTasks || []);
    renderMyTasks(data.myTasks || []);

    // Empty state: both sections hidden
    const noResponsible = !data.responsibleTasks || data.responsibleTasks.length === 0;
    const noMyTasks = !data.myTasks || data.myTasks.length === 0;
    if (noResponsible && noMyTasks) renderEmptyState();

    // Hide loading, show dashboard
    document.getElementById('loading').classList.add('hidden');
    document.getElementById('dashboard').classList.remove('hidden');

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

loadDashboard();
setInterval(loadDashboard, 30000);

// ─── State ────────────────────────────────────────────────────────────────────
let currentDetailTaskId = null;
let currentDetailRole = null;      // 'responsible' | 'worker'
let currentStoreTaskId = null;     // storeTask._id for messages
let assignItemContext = null;      // { userTaskId, itemId }
let selectedAssignEmployeeId = null;
let messagePollingInterval = null;

// ─── Task Detail Modal ────────────────────────────────────────────────────────

async function openTaskDetail(userTaskId, role) {
  currentDetailTaskId = userTaskId;
  currentDetailRole = role;
  document.getElementById('taskDetailModal').classList.remove('hidden');
  document.getElementById('taskDetailContent').innerHTML = '<p class="text-gray-400 text-sm">Đang tải...</p>';
  document.getElementById('detailModalFooter').innerHTML = '';

  try {
    const resp = await fetch(`/api/my-tasks/${userTaskId}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (!resp.ok) throw new Error('Không tải được chi tiết task');
    const result = await resp.json();
    const { task, isResponsible, assignedItems, stats } = result.data;

    currentStoreTaskId = task.storeTaskId?._id || task.storeTaskId;

    document.getElementById('detailModalTitle').textContent = task.broadcastId?.title || 'Chi tiết công việc';
    const badge = document.getElementById('detailRoleBadge');
    if (badge) {
      badge.className = isResponsible
        ? 'flex-shrink-0 text-xs px-2 py-0.5 rounded-full font-medium bg-purple-100 text-purple-700'
        : 'flex-shrink-0 text-xs px-2 py-0.5 rounded-full font-medium bg-green-100 text-green-700';
      badge.textContent = isResponsible ? '👑 Phụ trách' : '🔧 Thực hiện';
      badge.classList.remove('hidden');
    }
    renderDetailContent(task, isResponsible, assignedItems || []);
    renderDetailFooter(task, isResponsible, userTaskId);
    switchModalTab('detail');

    // Load message count
    if (currentStoreTaskId) {
      fetch(`/api/store-tasks/${currentStoreTaskId}/messages`, {
        headers: { 'Authorization': `Bearer ${token}` }
      }).then(r => r.json()).then(r => {
        if (r.success) {
          const badge = document.getElementById('msgCount');
          if (badge) badge.textContent = r.data.total || 0;
        }
      }).catch(() => {});
    }
  } catch (err) {
    document.getElementById('taskDetailContent').innerHTML = `<p class="text-red-500 text-sm">${escapeHtml(err.message)}</p>`;
  }
}

function closeTaskDetail() {
  document.getElementById('taskDetailModal').classList.add('hidden');
  currentDetailTaskId = null;
  currentDetailRole = null;
  currentStoreTaskId = null;
  if (messagePollingInterval) { clearInterval(messagePollingInterval); messagePollingInterval = null; }
  const badge = document.getElementById('detailRoleBadge');
  if (badge) badge.classList.add('hidden');
}

function switchModalTab(tab) {
  const tabDetail = document.getElementById('tabDetail');
  const tabMessages = document.getElementById('tabMessages');
  const detailContent = document.getElementById('detailTabContent');
  const msgContent = document.getElementById('messagesTabContent');
  const footer = document.getElementById('detailModalFooter');

  if (tab === 'detail') {
    tabDetail.className = 'px-6 py-3 text-sm font-medium border-b-2 border-purple-500 text-purple-600';
    tabMessages.className = 'px-6 py-3 text-sm font-medium text-gray-500 hover:text-gray-700';
    detailContent.classList.remove('hidden');
    msgContent.classList.add('hidden');
    footer.classList.remove('hidden');
    if (messagePollingInterval) { clearInterval(messagePollingInterval); messagePollingInterval = null; }
  } else {
    tabDetail.className = 'px-6 py-3 text-sm font-medium text-gray-500 hover:text-gray-700';
    tabMessages.className = 'px-6 py-3 text-sm font-medium border-b-2 border-purple-500 text-purple-600';
    detailContent.classList.add('hidden');
    msgContent.classList.remove('hidden');
    footer.classList.add('hidden');
    if (currentStoreTaskId) {
      loadMessages(currentStoreTaskId);
      messagePollingInterval = setInterval(() => loadMessages(currentStoreTaskId), 15000);
    }
  }
}

function renderDetailContent(task, isResponsible, assignedItems) {
  const broadcast = task.broadcastId || {};
  const storeTask = task.storeTaskId || {};
  const storeInfo = storeTask.storeId || {};
  const checklist = task.checklist || [];
  const evidences = task.evidences || [];
  const itemsToRender = isResponsible ? checklist : assignedItems;

  const creatorName        = broadcast.createdBy?.FullName || broadcast.createdBy?.fullName || 'Admin';
  const storeName          = storeInfo.Name || '';
  const assignedPersonName = storeTask.assignedPersonId?.FullName || storeTask.assignedPersonId?.fullName || '';

  // ── Info block ──────────────────────────────────────────────────
  const infoHtml = `
    <div class="bg-gray-50 rounded-xl p-4 space-y-2 mb-4 text-sm">
      <div class="flex flex-wrap gap-x-6 gap-y-1">
        <span class="text-gray-500">👤 Người giao:
          <span class="font-medium text-gray-800">${escapeHtml(creatorName)}</span>
        </span>
        ${!isResponsible && assignedPersonName
          ? `<span class="text-gray-500">👑 Phụ trách:
               <span class="font-medium text-gray-800">${escapeHtml(assignedPersonName)}</span>
             </span>`
          : ''}
        ${storeName
          ? `<span class="text-gray-500">🏪 Chi nhánh:
               <span class="font-medium text-gray-800">${escapeHtml(storeName)}</span>
             </span>`
          : ''}
      </div>
      <div class="flex flex-wrap items-center gap-3">
        ${broadcast.deadline ? `<span>📅 Hạn: ${formatDeadline(broadcast.deadline)}</span>` : ''}
        ${broadcast.priority ? priorityBadge(broadcast.priority) : ''}
        ${statusBadge(task.status)}
      </div>
      ${isResponsible ? `
      <div>
        <div class="flex justify-between text-xs text-gray-500 mb-1">
          <span>📊 Tiến độ tổng</span>
          <span class="font-medium">${storeTask.completionRate || 0}%</span>
        </div>
        <div class="w-full bg-gray-200 rounded-full h-2">
          <div class="bg-purple-500 h-2 rounded-full transition-all"
               style="width: ${storeTask.completionRate || 0}%"></div>
        </div>
      </div>` : ''}
      ${broadcast.description
        ? `<p class="text-gray-600 text-sm pt-1 border-t border-gray-200">${escapeHtml(broadcast.description)}</p>`
        : ''}
    </div>`;

  // ── Checklist ────────────────────────────────────────────────────
  let checklistHtml = '';
  if (itemsToRender.length > 0) {
    const sectionLabel = isResponsible
      ? `📋 Checklist <span class="text-gray-400 font-normal text-xs">(${checklist.length} mục)</span>`
      : `📌 Việc được giao <span class="text-gray-400 font-normal text-xs">(${assignedItems.length}/${checklist.length || '?'} mục)</span>`;
    checklistHtml = `
      <div class="mb-4">
        <h4 class="font-semibold text-gray-800 mb-3 text-sm">${sectionLabel}</h4>
        <div id="modalChecklistItems" class="space-y-2">
          ${renderModalChecklist(itemsToRender, isResponsible, task._id)}
        </div>
      </div>`;
  }

  // ── Upload / Evidence ────────────────────────────────────────────
  const canUpload        = ['in_progress', 'rejected'].includes(task.status);
  const showReadOnlyEvid = ['submitted', 'approved'].includes(task.status) && evidences.length > 0;

  let uploadHtml = '';
  if (canUpload) {
    const thumbs = evidences.length > 0
      ? `<div class="flex flex-wrap gap-2 mt-2">
           ${evidences.map(e => `<img src="${e.url}" alt="evidence"
             class="w-16 h-16 object-cover rounded-lg border border-gray-200 cursor-pointer"
             onclick="window.open('${e.url}','_blank')">`).join('')}
         </div>
         <p class="text-xs text-gray-400 mt-1">${evidences.length} ảnh đã tải — thêm ảnh mới bên dưới</p>`
      : '';
    uploadHtml = `
      <div class="mb-2">
        <h4 class="font-semibold text-gray-800 mb-2 text-sm">📷 Ảnh báo cáo</h4>
        ${thumbs}
        <input type="file" id="evidenceInput" accept="image/*" multiple
          class="block mt-2 text-sm text-gray-500 file:mr-3 file:py-1.5 file:px-3 file:rounded
                 file:border-0 file:text-sm file:bg-purple-50 file:text-purple-700 hover:file:bg-purple-100">
        <div id="evidencePreviews" class="flex flex-wrap gap-2 mt-2"></div>
      </div>`;
  } else if (showReadOnlyEvid) {
    uploadHtml = `
      <div class="mb-2">
        <h4 class="font-semibold text-gray-800 mb-2 text-sm">📷 Ảnh báo cáo đã nộp</h4>
        <div class="flex flex-wrap gap-2">
          ${evidences.map(e => `<img src="${e.url}" alt="evidence"
            class="w-16 h-16 object-cover rounded-lg border border-gray-200 cursor-pointer"
            onclick="window.open('${e.url}','_blank')">`).join('')}
        </div>
      </div>`;
  }

  document.getElementById('taskDetailContent').innerHTML = infoHtml + checklistHtml + uploadHtml;
  if (canUpload) {
    document.getElementById('evidenceInput')?.addEventListener('change', handleEvidencePreview);
  }
}

function renderModalChecklist(items, isResponsible, userTaskId) {
  return items.map(item => {
    const assignedName = item.assignedTo?.FullName || item.assignedTo?.fullName || null;
    let assignHtml = '';
    if (isResponsible) {
      if (!item.assignedTo) {
        assignHtml = `<button onclick="openAssignItemModal('${userTaskId}','${item._id}')"
          class="text-xs px-2 py-1 bg-blue-50 text-blue-600 rounded hover:bg-blue-100 border border-blue-200">👤 Giao</button>`;
      } else {
        assignHtml = `<span class="text-xs text-gray-600">👤 <span class="font-medium">${escapeHtml(assignedName || '...')}</span></span>`
          + (!item.isCompleted ? `<button onclick="openAssignItemModal('${userTaskId}','${item._id}')"
          class="text-xs px-1.5 py-0.5 text-gray-400 hover:text-blue-600 rounded hover:bg-blue-50" title="Đổi người thực hiện">✏️</button>` : '');
      }
    }
    const reviewHtml = isResponsible ? renderReviewButtons(item, userTaskId) : renderWorkerItemStatus(item);
    const itemBg = (!isResponsible && item.reviewStatus === 'rejected') ? 'bg-red-50 border border-red-200' : 'bg-gray-50';

    return `
      <div class="flex items-start gap-3 p-3 ${itemBg} rounded-lg" id="checklistItem-${item._id}">
        <span class="${item.isCompleted ? 'text-green-500' : 'text-gray-400'} text-base mt-0.5 flex-shrink-0">
          ${item.isCompleted ? '✅' : '⬜'}
        </span>
        <div class="flex-1 min-w-0">
          <div class="flex items-center gap-1.5 flex-wrap">
            <span class="${item.isCompleted ? 'line-through text-gray-400' : 'text-gray-800'} text-sm">${escapeHtml(item.task)}</span>
            ${item.required ? `<span class="text-xs px-1.5 py-0.5 bg-red-50 text-red-600 rounded font-medium border border-red-100">BẮT BUỘC</span>` : ''}
          </div>
          ${item.note ? `<p class="text-xs text-gray-400 mt-0.5">${escapeHtml(item.note)}</p>` : ''}
          <div class="flex items-center gap-2 mt-1.5 flex-wrap review-btn-area">
            ${assignHtml}
            ${reviewHtml}
          </div>
        </div>
      </div>`;
  }).join('');
}

function renderWorkerItemStatus(item) {
  if (item.reviewStatus === 'approved') {
    return `<span class="text-xs px-2 py-0.5 rounded-full bg-green-100 text-green-700 font-medium">✅ Đã duyệt</span>`;
  }
  if (item.reviewStatus === 'rejected') {
    return `<span class="text-xs px-2 py-0.5 rounded-full bg-red-100 text-red-700 font-medium">❌ Bị từ chối</span>`
      + (item.reviewNote ? `<span class="text-xs text-red-500 italic">"${escapeHtml(item.reviewNote)}"</span>` : '');
  }
  if (item.isCompleted) {
    return `<span class="text-xs text-gray-400 italic">⏳ Chờ duyệt</span>`;
  }
  return '';
}

function renderReviewButtons(item, userTaskId) {
  if (!item.assignedTo) return '';
  if (item.reviewStatus === 'approved') {
    return `<span class="text-xs px-2 py-0.5 rounded-full bg-green-100 text-green-700 font-medium">✅ Đã duyệt</span>`;
  }
  if (item.reviewStatus === 'rejected') {
    return `<span class="text-xs px-2 py-0.5 rounded-full bg-red-100 text-red-700 font-medium">❌ Từ chối</span>`
      + (item.reviewNote ? `<span class="text-xs text-gray-500 italic">"${escapeHtml(item.reviewNote)}"</span>` : '');
  }
  if (!item.isCompleted) {
    return `<span class="text-xs text-gray-400 italic">⏳ Chờ hoàn thành</span>`;
  }
  // isCompleted=true, reviewStatus=null → show buttons
  return `
    <button onclick="handleReviewItem('${userTaskId}','${item._id}','approve')"
      class="text-xs px-2 py-1 bg-green-50 text-green-700 rounded hover:bg-green-100 border border-green-200">✅ OK</button>
    <button onclick="showRejectNoteInput(document.getElementById('checklistItem-${item._id}'),'${userTaskId}','${item._id}')"
      class="text-xs px-2 py-1 bg-red-50 text-red-700 rounded hover:bg-red-100 border border-red-200">❌ Không OK</button>`;
}

function renderDetailFooter(task, isResponsible, userTaskId) {
  const footer = document.getElementById('detailModalFooter');
  if (task.status === 'assigned') {
    footer.innerHTML = `
      <button onclick="closeTaskDetail()" class="px-4 py-2 border rounded-lg text-sm text-gray-700 hover:bg-gray-50">Đóng</button>
      <button onclick="handleConfirmTask('${userTaskId}')"
        class="px-5 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-semibold">✅ Xác nhận đã nhận việc</button>`;
  } else if (['in_progress', 'rejected'].includes(task.status)) {
    footer.innerHTML = `
      <button onclick="closeTaskDetail()" class="px-4 py-2 border rounded-lg text-sm text-gray-700 hover:bg-gray-50">Đóng</button>
      <button onclick="handleUploadAndSubmit('${userTaskId}')"
        class="px-5 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-sm font-semibold">📤 Nộp báo cáo</button>`;
  } else if (task.status === 'submitted') {
    footer.innerHTML = `
      <button onclick="closeTaskDetail()" class="px-4 py-2 border rounded-lg text-sm text-gray-700 hover:bg-gray-50">Đóng</button>
      <button disabled class="px-5 py-2 bg-gray-200 text-gray-400 rounded-lg text-sm font-semibold cursor-not-allowed">⏳ Đã nộp — chờ duyệt</button>`;
  } else {
    footer.innerHTML = `<button onclick="closeTaskDetail()" class="px-4 py-2 border rounded-lg text-sm text-gray-700 hover:bg-gray-50">Đóng</button>`;
  }
}

async function handleConfirmTask(userTaskId) {
  try {
    const resp = await fetch(`/api/my-tasks/${userTaskId}/confirm`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const result = await resp.json();
    if (!result.success) throw new Error(result.message || 'Lỗi xác nhận');
    closeTaskDetail();
    showToast('✅ Đã xác nhận nhận việc!', 'success');
    loadDashboard();
  } catch (err) {
    showToast(err.message, 'error');
  }
}

// ─── K-6: Review checklist items ──────────────────────────────────────────────

async function handleReviewItem(userTaskId, itemId, action, reviewNote = '') {
  try {
    const body = { itemId, action };
    if (reviewNote) body.reviewNote = reviewNote;
    const resp = await fetch(`/api/my-tasks/${userTaskId}/review-item`, {
      method: 'PUT',
      headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });
    const result = await resp.json();
    if (!result.success) throw new Error(result.message || 'Lỗi review');

    // Update item UI in-place
    const itemEl = document.getElementById(`checklistItem-${itemId}`);
    if (itemEl) {
      const btnArea = itemEl.querySelector('.review-btn-area');
      if (btnArea) {
        if (action === 'approve') {
          btnArea.innerHTML = `<span class="text-xs px-2 py-0.5 rounded-full bg-green-100 text-green-700 font-medium">✅ Đã duyệt</span>`;
          const icon = itemEl.querySelector('span.text-base');
          if (icon) { icon.textContent = '✅'; icon.className = 'text-green-500 text-base mt-0.5 flex-shrink-0'; }
          const label = itemEl.querySelector('span.text-sm');
          if (label) label.className = 'line-through text-gray-400 text-sm';
        } else {
          btnArea.innerHTML = `<span class="text-xs px-2 py-0.5 rounded-full bg-red-100 text-red-700 font-medium">❌ Từ chối</span>`
            + (reviewNote ? `<span class="text-xs text-gray-500 italic">"${escapeHtml(reviewNote)}"</span>` : '');
        }
      }
    }
    showToast(action === 'approve' ? '✅ Đã chấp nhận' : '❌ Đã từ chối', 'success');
  } catch (err) {
    showToast(err.message, 'error');
  }
}

function showRejectNoteInput(itemEl, userTaskId, itemId) {
  const btnArea = itemEl?.querySelector('.review-btn-area');
  if (!btnArea) return;
  btnArea.innerHTML = `
    <div class="flex flex-col gap-2 w-full mt-1">
      <textarea id="rejectNote_${itemId}" rows="2" placeholder="Lý do từ chối..."
        class="w-full text-sm border rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-red-400" maxlength="500"></textarea>
      <div class="flex gap-2">
        <button onclick="handleReviewItem('${userTaskId}','${itemId}','reject',document.getElementById('rejectNote_${itemId}').value)"
          class="text-xs px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700">Xác nhận từ chối</button>
        <button onclick="openTaskDetail('${userTaskId}',currentDetailRole)"
          class="text-xs px-3 py-1 border text-gray-600 rounded hover:bg-gray-50">Hủy</button>
      </div>
    </div>`;
  document.getElementById(`rejectNote_${itemId}`)?.focus();
}

// ─── Assign Item Modal ────────────────────────────────────────────────────────

async function openAssignItemModal(userTaskId, itemId) {
  assignItemContext = { userTaskId, itemId };
  selectedAssignEmployeeId = null;
  document.getElementById('assignItemModal').classList.remove('hidden');
  document.getElementById('assignEmployeeList').innerHTML = '<p class="text-gray-400 text-sm text-center py-4">Đang tải...</p>';

  const branchId = employee.branchId?.toString();
  if (!branchId) {
    document.getElementById('assignEmployeeList').innerHTML = '<p class="text-red-500 text-sm">Không tìm được chi nhánh</p>';
    return;
  }
  await loadAssignableEmployees(branchId);
}

function closeAssignItemModal() {
  document.getElementById('assignItemModal').classList.add('hidden');
  assignItemContext = null;
  selectedAssignEmployeeId = null;
}

async function loadAssignableEmployees(storeId) {
  try {
    const resp = await fetch('/api/employees?limit=800', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const result = await resp.json();
    if (!result.success) throw new Error(result.message);
    const all = result.data?.employees || result.data || [];
    const myId = employee._id?.toString();
    const assignable = all.filter(emp => {
      const empBranch = emp.ID_Branch?._id?.toString() || emp.ID_Branch?.toString();
      return empBranch === storeId && emp.Status === 'Đang hoạt động' && emp._id?.toString() !== myId;
    });
    renderAssignItemEmployees(assignable);
  } catch (err) {
    document.getElementById('assignEmployeeList').innerHTML = `<p class="text-red-500 text-sm">${escapeHtml(err.message)}</p>`;
  }
}

function renderAssignItemEmployees(employees) {
  const list = document.getElementById('assignEmployeeList');
  if (!employees || employees.length === 0) {
    list.innerHTML = '<p class="text-gray-500 text-sm text-center py-4">Không có nhân viên nào trong chi nhánh</p>';
    return;
  }
  list.innerHTML = employees.map(emp => {
    const groupName = emp.ID_GroupUser?.GroupName || emp.ID_GroupUser?.Name || 'Nhân viên';
    return `
      <label class="flex items-center gap-3 p-3 rounded-lg cursor-pointer hover:bg-gray-50 border border-transparent">
        <input type="radio" name="assignEmployee" value="${emp._id}"
          onchange="selectedAssignEmployeeId='${emp._id}'"
          class="accent-purple-600 flex-shrink-0">
        <div class="flex-1 min-w-0">
          <div class="font-medium text-gray-900 text-sm">${escapeHtml(emp.FullName)}</div>
          <div class="text-xs text-gray-500">${escapeHtml(emp.Phone || '')} · ${escapeHtml(groupName)}</div>
        </div>
      </label>`;
  }).join('');
}

async function handleConfirmAssignItem() {
  if (!selectedAssignEmployeeId) { showToast('Vui lòng chọn nhân viên', 'error'); return; }
  if (!assignItemContext) return;
  try {
    const { userTaskId, itemId } = assignItemContext;
    const resp = await fetch(`/api/my-tasks/${userTaskId}/assign-item`, {
      method: 'PUT',
      headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ itemId, assignedToEmployeeId: selectedAssignEmployeeId })
    });
    const result = await resp.json();
    if (!result.success) throw new Error(result.message || 'Lỗi phân công');
    closeAssignItemModal();
    showToast('✅ Đã phân công thành công', 'success');
    await openTaskDetail(userTaskId, currentDetailRole);
  } catch (err) {
    showToast(err.message, 'error');
  }
}

// ─── Upload & Submit ──────────────────────────────────────────────────────────

function handleEvidencePreview(e) {
  const files = Array.from(e.target.files).slice(0, 5);
  const previews = document.getElementById('evidencePreviews');
  if (!previews) return;
  previews.innerHTML = '';
  files.forEach(f => {
    const url = URL.createObjectURL(f);
    const img = document.createElement('img');
    img.src = url;
    img.className = 'w-20 h-20 object-cover rounded-lg border border-gray-200';
    previews.appendChild(img);
  });
}

async function handleUploadAndSubmit(userTaskId) {
  const input = document.getElementById('evidenceInput');
  const files = input?.files;
  const submitBtn = document.querySelector('#detailModalFooter button:last-child');
  if (submitBtn) { submitBtn.disabled = true; submitBtn.textContent = 'Đang nộp...'; }

  try {
    if (files && files.length > 0) {
      if (files.length > 5) { showToast('Tối đa 5 ảnh', 'error'); return; }
      const formData = new FormData();
      Array.from(files).forEach(f => formData.append('photos', f));

      const uploadResp = await fetch('/api/upload/photos', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData
      });
      const uploadResult = await uploadResp.json();
      if (!uploadResult.success) throw new Error(uploadResult.message || 'Lỗi upload ảnh');

      const photos = uploadResult.data?.photos || [];
      const evidences = photos.map(p => ({ type: 'photo', url: p.url, filename: p.filename }));

      if (evidences.length > 0) {
        const evidResp = await fetch(`/api/my-tasks/${userTaskId}/evidence`, {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({ evidences })
        });
        const evidResult = await evidResp.json();
        if (!evidResult.success) throw new Error(evidResult.message || 'Lỗi lưu ảnh');
      }
    }

    const submitResp = await fetch(`/api/my-tasks/${userTaskId}/submit`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({})
    });
    const submitResult = await submitResp.json();
    if (!submitResult.success) throw new Error(submitResult.message || 'Lỗi nộp báo cáo');

    closeTaskDetail();
    showToast('✅ Đã nộp báo cáo thành công!', 'success');
    loadDashboard();
  } catch (err) {
    showToast(err.message, 'error');
    if (submitBtn) { submitBtn.disabled = false; submitBtn.textContent = '📤 Nộp báo cáo'; }
  }
}

// ─── K-7: Messages ────────────────────────────────────────────────────────────

async function loadMessages(storeTaskId) {
  try {
    const resp = await fetch(`/api/store-tasks/${storeTaskId}/messages`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const result = await resp.json();
    if (!result.success) return;
    const badge = document.getElementById('msgCount');
    if (badge) badge.textContent = result.data.total || 0;
    renderMessages(result.data.messages);
  } catch (err) {
    console.error('loadMessages:', err);
  }
}

function renderMessages(messages) {
  const list = document.getElementById('messagesList');
  if (!list) return;
  if (!messages || messages.length === 0) {
    list.innerHTML = '<p class="text-center text-gray-400 text-sm py-6">Chưa có tin nhắn nào</p>';
    return;
  }
  const myId = employee._id?.toString();
  list.innerHTML = messages.map(msg => {
    const isMe = msg.senderId?.toString() === myId;
    const d = new Date(msg.createdAt);
    const timeStr = d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })
      + ' ' + d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' });
    if (isMe) {
      return `
        <div class="flex justify-end">
          <div class="max-w-[72%]">
            <div class="bg-purple-100 text-purple-900 rounded-2xl rounded-tr-sm px-4 py-2 text-sm">${escapeHtml(msg.text)}</div>
            <div class="text-xs text-gray-400 text-right mt-0.5">${timeStr}</div>
          </div>
        </div>`;
    }
    const initials = (msg.senderName || '?').charAt(0).toUpperCase();
    return `
      <div class="flex gap-2">
        <div class="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center text-xs font-bold text-gray-600 flex-shrink-0 mt-1">${escapeHtml(initials)}</div>
        <div class="max-w-[72%]">
          <div class="text-xs text-gray-500 mb-0.5">${escapeHtml(msg.senderName || 'Ẩn danh')}</div>
          <div class="bg-gray-100 text-gray-800 rounded-2xl rounded-tl-sm px-4 py-2 text-sm">${escapeHtml(msg.text)}</div>
          <div class="text-xs text-gray-400 mt-0.5">${timeStr}</div>
        </div>
      </div>`;
  }).join('');
  list.scrollTop = list.scrollHeight;
}

async function sendMessage() {
  const input = document.getElementById('messageInput');
  const text = input?.value.trim();
  if (!text || !currentStoreTaskId) return;
  input.value = '';
  try {
    const resp = await fetch(`/api/store-tasks/${currentStoreTaskId}/messages`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ text })
    });
    const result = await resp.json();
    if (!result.success) throw new Error(result.message);
    await loadMessages(currentStoreTaskId);
  } catch (err) {
    showToast(err.message, 'error');
  }
}

