/**
 * Account Switcher - Quick switch between accounts for testing
 * ⚠️ Development only
 */

class AccountSwitcher {
  constructor() {
    this.accounts = null;
    this.isOpen = false;
    this.searchTimer = null;
    this.init();
  }

  async init() {
    // Only show for admin users
    try {
      const employee = JSON.parse(localStorage.getItem('employee') || '{}');
      if (employee.role !== 'admin') {
        return;
      }
    } catch (error) {
      return;
    }

    await this.loadAccounts();
    this.createUI();
    this.attachEvents();
  }

  async loadAccounts() {
    try {
      const response = await fetch('/api/dev/accounts');
      const data = await response.json();
      if (data.success) {
        this.accounts = data.accounts;
      }
    } catch (error) {
      console.error('[Account Switcher] Failed to load accounts:', error);
    }
  }

  createUI() {
    // Floating button
    const button = document.createElement('button');
    button.id = 'accountSwitcherBtn';
    button.innerHTML = `
      <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4"></path>
      </svg>
    `;
    button.className = 'fixed bottom-4 right-4 bg-indigo-600 hover:bg-indigo-700 text-white p-3 rounded-full shadow-lg z-50 transition-all';
    button.title = 'Quick Switch Account (Dev Tool)';

    // Modal
    const modal = document.createElement('div');
    modal.id = 'accountSwitcherModal';
    modal.className = 'fixed inset-0 bg-black bg-opacity-50 z-50 hidden flex items-center justify-center';
    modal.innerHTML = `
      <div class="bg-white rounded-lg shadow-xl max-w-lg w-full mx-4 max-h-[85vh] overflow-hidden flex flex-col">
        <!-- Header -->
        <div class="bg-indigo-600 text-white p-4 flex justify-between items-center flex-shrink-0">
          <h3 class="text-lg font-bold">🔄 Chuyển đổi tài khoản (Dev Tool)</h3>
          <button id="closeAccountSwitcher" class="text-white hover:text-gray-200">
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
            </svg>
          </button>
        </div>
        <!-- Search bar -->
        <div class="p-3 border-b flex-shrink-0">
          <input id="accountSwitcherSearch" type="text"
            class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
            placeholder="Tìm kiếm theo tên, chức vụ, chi nhánh...">
        </div>
        <!-- List -->
        <div class="overflow-y-auto flex-1">
          <div id="accountsList" class="p-3"></div>
        </div>
      </div>
    `;

    document.body.appendChild(button);
    document.body.appendChild(modal);

    this.renderAccounts();
  }

  renderAccounts() {
    if (!this.accounts) return;
    this.renderAccountList(this.accounts);
  }

  renderAccountList(filtered) {
    const container = document.getElementById('accountsList');
    if (!container) return;

    const currentEmployee = JSON.parse(localStorage.getItem('employee') || '{}');

    let html = `
      <div class="mb-3 p-3 bg-green-50 border border-green-200 rounded-lg">
        <p class="text-xs font-semibold text-green-700 mb-1">✓ Đang đăng nhập</p>
        <p class="font-semibold text-gray-900">${currentEmployee.fullName || 'N/A'}</p>
        <p class="text-xs text-gray-500">${currentEmployee.groupUser || ''} · ${currentEmployee.branchName || ''}</p>
      </div>
    `;

    html += this.renderRoleSection('👑 Admin', filtered.admin || [], 'purple');
    html += this.renderRoleSection('👔 Quản lý', filtered.manager || [], 'blue');
    html += this.renderRoleSection('👤 Nhân viên', filtered.employee || [], 'green');

    const total = (filtered.admin?.length || 0) + (filtered.manager?.length || 0) + (filtered.employee?.length || 0);
    if (total === 0) {
      html += '<p class="text-center text-gray-400 py-6 text-sm">Không tìm thấy kết quả</p>';
    }

    container.innerHTML = html;
  }

  renderRoleSection(title, accounts, color) {
    if (!accounts || accounts.length === 0) return '';

    const headerColor = {
      purple: 'text-purple-700',
      blue:   'text-blue-700',
      green:  'text-green-700'
    }[color] || 'text-gray-700';

    const items = accounts.map(acc => `
      <button data-switch-id="${acc._id}"
        class="w-full text-left flex items-center gap-3 p-3 border border-gray-100 rounded-lg hover:bg-indigo-50 hover:border-indigo-200 transition-colors">
        <div class="w-9 h-9 rounded-full bg-gray-200 flex items-center justify-center flex-shrink-0 text-gray-500">
          <i class="fas fa-user text-sm"></i>
        </div>
        <div class="flex-1 min-w-0">
          <p class="font-semibold text-gray-900 truncate">${acc.fullName}</p>
          <p class="text-xs text-gray-500 truncate">📞 ${acc.phone} · 💼 ${acc.position}</p>
          <p class="text-xs text-gray-400 truncate">🏢 ${acc.branch}</p>
        </div>
      </button>
    `).join('');

    return `
      <div class="mb-3">
        <p class="text-xs font-bold ${headerColor} uppercase tracking-wide px-1 mb-2">
          ${title} (${accounts.length})
        </p>
        <div class="space-y-1">${items}</div>
      </div>
    `;
  }

  filterAndRender(query) {
    if (!this.accounts) return;
    const q = query.toLowerCase();
    const filter = (list) => !q ? list : list.filter(acc =>
      acc.fullName.toLowerCase().includes(q) ||
      acc.position.toLowerCase().includes(q) ||
      acc.branch.toLowerCase().includes(q)
    );
    this.renderAccountList({
      admin:    filter(this.accounts.admin    || []),
      manager:  filter(this.accounts.manager  || []),
      employee: filter(this.accounts.employee || [])
    });
  }

  attachEvents() {
    // Open modal
    document.getElementById('accountSwitcherBtn').addEventListener('click', () => {
      this.open();
    });

    // Close modal
    document.getElementById('closeAccountSwitcher').addEventListener('click', () => {
      this.close();
    });

    // Close on backdrop click
    document.getElementById('accountSwitcherModal').addEventListener('click', (e) => {
      if (e.target.id === 'accountSwitcherModal') {
        this.close();
      }
    });

    // Close on ESC key
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.isOpen) {
        this.close();
      }
    });

    // Search input
    const searchInput = document.getElementById('accountSwitcherSearch');
    searchInput.addEventListener('input', () => {
      if (this.searchTimer) clearTimeout(this.searchTimer);
      this.searchTimer = setTimeout(() => {
        this.filterAndRender(searchInput.value.trim());
      }, 200);
    });

    // Account item clicks — event delegation to avoid inline onclick (CSP)
    document.getElementById('accountsList').addEventListener('click', (e) => {
      const btn = e.target.closest('[data-switch-id]');
      if (btn) {
        this.switchTo(btn.getAttribute('data-switch-id'));
      }
    });
  }

  open() {
    document.getElementById('accountSwitcherModal').classList.remove('hidden');
    document.getElementById('accountSwitcherModal').classList.add('flex');
    this.isOpen = true;
    const searchInput = document.getElementById('accountSwitcherSearch');
    if (searchInput) {
      searchInput.value = '';
      this.filterAndRender('');
    }
  }

  close() {
    document.getElementById('accountSwitcherModal').classList.add('hidden');
    document.getElementById('accountSwitcherModal').classList.remove('flex');
    this.isOpen = false;
  }

  async switchTo(employeeId) {
    try {
      const response = await fetch('/api/dev/quick-login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ employeeId })
      });

      const data = await response.json();

      if (data.success) {
        // Update localStorage
        localStorage.setItem('token', data.token);
        localStorage.setItem('employee', JSON.stringify(data.employee));

        // Show success message
        const toast = document.createElement('div');
        toast.className = 'fixed top-4 right-4 bg-green-500 text-white px-6 py-3 rounded shadow-lg z-50';
        toast.innerHTML = `✓ Switched to ${data.employee.fullName} — đang chuyển hướng...`;
        document.body.appendChild(toast);

        // Redirect to role-appropriate dashboard after delay
        const dashboardUrls = {
          admin:    '/admin/dashboard',
          manager:  '/manager/dashboard',
          employee: '/employee/dashboard'
        };
        setTimeout(() => {
          window.location.href = dashboardUrls[data.employee.role] || '/login';
        }, 500);
      } else {
        alert('Failed to switch account: ' + data.error);
      }
    } catch (error) {
      console.error('[Account Switcher] Switch failed:', error);
      alert('Failed to switch account');
    }
  }
}

// Initialize on page load
let accountSwitcher;
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    accountSwitcher = new AccountSwitcher();
  });
} else {
  accountSwitcher = new AccountSwitcher();
}
