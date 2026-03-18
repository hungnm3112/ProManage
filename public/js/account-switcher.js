/**
 * Account Switcher - Quick switch between accounts for testing
 * ⚠️ Development only
 */

class AccountSwitcher {
  constructor() {
    this.accounts = null;
    this.isOpen = false;
    this.init();
  }

  async init() {
    // Only show in development
    if (window.location.hostname !== 'localhost' && !window.location.hostname.startsWith('192.168')) {
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
      <div class="bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[80vh] overflow-hidden">
        <div class="bg-indigo-600 text-white p-4 flex justify-between items-center">
          <h3 class="text-lg font-bold">🔄 Quick Switch Account (Dev Tool)</h3>
          <button id="closeAccountSwitcher" class="text-white hover:text-gray-200">
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
            </svg>
          </button>
        </div>
        <div class="p-4 overflow-y-auto max-h-[calc(80vh-60px)]">
          <div id="accountsList"></div>
        </div>
      </div>
    `;

    document.body.appendChild(button);
    document.body.appendChild(modal);

    this.renderAccounts();
  }

  renderAccounts() {
    if (!this.accounts) return;

    const container = document.getElementById('accountsList');
    
    const html = `
      <!-- Current Account -->
      <div class="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
        <h4 class="font-semibold text-green-800 mb-2">✓ Current Account</h4>
        <div id="currentAccount" class="text-sm text-gray-700"></div>
      </div>

      <!-- Admin Accounts -->
      ${this.renderRoleSection('admin', '👑 Admin Accounts', 'purple')}

      <!-- Manager Accounts -->
      ${this.renderRoleSection('manager', '👔 Manager Accounts', 'blue')}

      <!-- Employee Accounts -->
      ${this.renderRoleSection('employee', '👤 Employee Accounts', 'green')}
    `;

    container.innerHTML = html;

    // Display current account
    const currentEmployee = JSON.parse(localStorage.getItem('employee') || '{}');
    document.getElementById('currentAccount').innerHTML = `
      <p class="font-semibold">${currentEmployee.fullName || 'Not logged in'}</p>
      <p class="text-xs text-gray-600">${currentEmployee.groupUser || ''} - ${currentEmployee.branchName || ''}</p>
      <p class="text-xs text-gray-500">Role: ${currentEmployee.role || 'N/A'}</p>
    `;
  }

  renderRoleSection(role, title, color) {
    const accounts = this.accounts[role] || [];
    if (accounts.length === 0) return '';

    const colorClasses = {
      purple: 'bg-purple-50 border-purple-200 text-purple-800',
      blue: 'bg-blue-50 border-blue-200 text-blue-800',
      green: 'bg-green-50 border-green-200 text-green-800'
    };

    return `
      <div class="mb-6">
        <h4 class="font-semibold ${colorClasses[color]} p-2 rounded mb-2">${title} (${accounts.length})</h4>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-2">
          ${accounts.map(acc => `
            <button 
              onclick="accountSwitcher.switchTo('${acc._id}')"
              class="text-left p-3 border rounded hover:bg-gray-50 transition-colors"
            >
              <p class="font-semibold text-gray-900">${acc.fullName}</p>
              <p class="text-xs text-gray-600">${acc.position}</p>
              <p class="text-xs text-gray-500">${acc.branch}</p>
              <p class="text-xs text-blue-600">📱 ${acc.phone}</p>
            </button>
          `).join('')}
        </div>
      </div>
    `;
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
  }

  open() {
    document.getElementById('accountSwitcherModal').classList.remove('hidden');
    document.getElementById('accountSwitcherModal').classList.add('flex');
    this.isOpen = true;
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
        toast.innerHTML = `✓ Switched to ${data.employee.fullName}`;
        document.body.appendChild(toast);

        // Reload page after delay
        setTimeout(() => {
          window.location.reload();
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
