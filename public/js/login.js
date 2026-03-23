// Login Page Logic
const API_URL = '/api';
const loginForm = document.getElementById('loginForm');
const errorAlert = document.getElementById('errorAlert');
const errorMessage = document.getElementById('errorMessage');
const loginBtn = document.getElementById('loginBtn');
const loginBtnText = document.getElementById('loginBtnText');
const loginSpinner = document.getElementById('loginSpinner');

// Show error
function showError(message) {
  errorMessage.textContent = message;
  errorAlert.classList.remove('hidden');
  // Không tự động ẩn để user có thể copy/chụp ảnh
}

// Hide error
function hideError() {
  errorAlert.classList.add('hidden');
}

// Set loading state
function setLoading(loading) {
  if (loading) {
    loginBtn.disabled = true;
    loginBtn.classList.add('opacity-75', 'cursor-not-allowed');
    loginBtnText.textContent = 'Đang đăng nhập...';
    loginSpinner.classList.remove('hidden');
  } else {
    loginBtn.disabled = false;
    loginBtn.classList.remove('opacity-75', 'cursor-not-allowed');
    loginBtnText.textContent = 'Đăng nhập';
    loginSpinner.classList.add('hidden');
  }
}

// Handle login
loginForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  hideError();

  const phone = document.getElementById('phone').value.trim();
  const password = document.getElementById('password').value;

  // Validate
  if (!phone || !password) {
    showError('Vui lòng nhập đầy đủ thông tin');
    return;
  }

  // Phone format validation
  if (!/^0\d{9}$/.test(phone)) {
    showError('Số điện thoại phải có 10 số và bắt đầu bằng số 0');
    return;
  }

  setLoading(true);

  try {
    const response = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ phone, password })
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Đăng nhập thất bại');
    }

    // Success
    if (data.success && data.token) {
      // Save token to localStorage
      localStorage.setItem('token', data.token);
      localStorage.setItem('employee', JSON.stringify(data.employee));

      // Show success message
      loginBtnText.textContent = '✓ Đăng nhập thành công!';
      loginBtn.classList.remove('bg-purple-600', 'hover:bg-purple-700');
      loginBtn.classList.add('bg-green-500');

      // Redirect to employee dashboard for all roles (Phase P)
      setTimeout(() => {
        window.location.href = '/employee/dashboard';
      }, 1000);
    } else {
      throw new Error('Invalid response from server');
    }

  } catch (error) {
    console.error('Login error:', error);
    showError(error.message);
    setLoading(false);
  }
});

// Clear error on input
document.getElementById('phone').addEventListener('input', hideError);
document.getElementById('password').addEventListener('input', hideError);
