// Employee Dashboard Logic

// Check authentication
const token = localStorage.getItem('token');
const employee = JSON.parse(localStorage.getItem('employee') || '{}');

if (!token) {
  window.location.href = '/login';
}

if (employee.role === 'admin' || employee.role === 'manager') {
  // Redirect admin/manager to their dashboards
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

// Bind logout button event
document.getElementById('logoutBtn').addEventListener('click', logout);

// Load employee dashboard data
async function loadDashboard() {
  try {
    const response = await fetch('/api/dashboard/employee', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (!response.ok) {
      throw new Error('Không thể tải dữ liệu dashboard');
    }

    const result = await response.json();
    const data = result.data;

    // Update statistics (adjust based on employee dashboard API response)
    document.getElementById('myTasks').textContent = data.myTasks || 0;
    document.getElementById('completedTasks').textContent = data.completedTasks || 0;
    document.getElementById('pendingTasks').textContent = data.pendingTasks || 0;
    document.getElementById('averageRating').textContent = (data.averageRating || 0).toFixed(1);

    // Render my tasks (if applicable)
    // TODO: Add employee-specific dashboard rendering

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
