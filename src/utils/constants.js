// HTTP Status Codes
exports.HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  INTERNAL_SERVER_ERROR: 500
};

// User Roles
exports.USER_ROLES = {
  USER: 'user',
  ADMIN: 'admin',
  MANAGER: 'manager'
};

// Project Status
exports.PROJECT_STATUS = {
  PLANNING: 'planning',
  IN_PROGRESS: 'in-progress',
  ON_HOLD: 'on-hold',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled'
};

// Task Status
exports.TASK_STATUS = {
  TODO: 'todo',
  IN_PROGRESS: 'in-progress',
  REVIEW: 'review',
  DONE: 'done'
};

// Priority Levels
exports.PRIORITY = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
  URGENT: 'urgent'
};

// Date Formats
exports.DATE_FORMATS = {
  FULL: 'DD/MM/YYYY HH:mm:ss',
  DATE_ONLY: 'DD/MM/YYYY',
  TIME_ONLY: 'HH:mm:ss'
};

// Pagination Defaults
exports.PAGINATION = {
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 10,
  MAX_LIMIT: 100
};

// Error Messages
exports.ERROR_MESSAGES = {
  UNAUTHORIZED: 'Not authorized to access this route',
  FORBIDDEN: 'Access forbidden',
  NOT_FOUND: 'Resource not found',
  VALIDATION_ERROR: 'Validation error',
  SERVER_ERROR: 'Internal server error',
  INVALID_CREDENTIALS: 'Invalid credentials',
  USER_NOT_FOUND: 'User not found',
  PROJECT_NOT_FOUND: 'Project not found',
  TASK_NOT_FOUND: 'Task not found',
  EMAIL_EXISTS: 'Email already exists'
};

// Success Messages
exports.SUCCESS_MESSAGES = {
  CREATED: 'Created successfully',
  UPDATED: 'Updated successfully',
  DELETED: 'Deleted successfully',
  LOGIN_SUCCESS: 'Login successful',
  LOGOUT_SUCCESS: 'Logout successful',
  REGISTER_SUCCESS: 'Registration successful'
};

// File Upload
exports.FILE_UPLOAD = {
  MAX_SIZE: 5 * 1024 * 1024, // 5MB
  ALLOWED_TYPES: ['image/jpeg', 'image/png', 'image/gif', 'application/pdf'],
  UPLOAD_DIR: './public/uploads'
};

// Email Templates
exports.EMAIL_SUBJECTS = {
  WELCOME: 'Welcome to ProManage',
  PASSWORD_RESET: 'Password Reset Request',
  PROJECT_INVITATION: 'Project Invitation',
  TASK_ASSIGNMENT: 'New Task Assignment',
  TASK_REMINDER: 'Task Reminder'
};

// Regular Expressions
exports.REGEX = {
  EMAIL: /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
  PHONE: /^[0-9]{10,11}$/,
  PASSWORD: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d]{8,}$/
};

// Time Periods
exports.TIME_PERIODS = {
  MINUTE: 60,
  HOUR: 3600,
  DAY: 86400,
  WEEK: 604800,
  MONTH: 2592000,
  YEAR: 31536000
};
