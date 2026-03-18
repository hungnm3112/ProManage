// Manager Dashboard Logic

// Check authentication
const token = localStorage.getItem('token');
const employee = JSON.parse(localStorage.getItem('employee') || '{}');

if (!token) {
  window.location.href = '/login';
}

if (employee.role !== 'manager') {
  alert('Bạn không có quyền truy cập trang này');
  window.location.href = '/login';
}

// Display user name and position
document.getElementById('userName').textContent = employee.fullName || 'Manager';
document.getElementById('userPosition').textContent = employee.groupUser || 'Giám đốc chi nhánh';

function logout() {
  localStorage.removeItem('token');
  localStorage.removeItem('employee');
  window.location.href = '/login';
}

// Bind logout button event
document.getElementById('logoutBtn').addEventListener('click', logout);

// Load manager dashboard data
async function loadDashboard() {
  try {
    const response = await fetch('/api/dashboard/manager', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (!response.ok) {
      throw new Error('Không thể tải dữ liệu dashboard');
    }

    const result = await response.json();
    const data = result.data;

    // Update statistics (adjust based on manager dashboard API response)
    document.getElementById('activeBroadcasts').textContent = data.activeBroadcasts || 0;
    document.getElementById('completedTasks').textContent = data.completedTasks || 0;
    document.getElementById('pendingReviews').textContent = data.pendingReviews || 0;
    document.getElementById('overdueTasks').textContent = data.overdueTasks || 0;

    // Render pending reviews (if applicable)
    // TODO: Add manager-specific dashboard rendering

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

// Load dashboard on page load
loadDashboard();

// Refresh every 30 seconds
setInterval(loadDashboard, 30000);
