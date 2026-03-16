// Format date to readable string
exports.formatDate = (date) => {
  return new Date(date).toLocaleDateString('vi-VN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
};

// Format datetime to readable string
exports.formatDateTime = (date) => {
  return new Date(date).toLocaleString('vi-VN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

// Calculate days between two dates
exports.daysBetween = (date1, date2) => {
  const oneDay = 24 * 60 * 60 * 1000;
  const firstDate = new Date(date1);
  const secondDate = new Date(date2);
  return Math.round(Math.abs((firstDate - secondDate) / oneDay));
};

// Check if date is overdue
exports.isOverdue = (dueDate) => {
  return new Date(dueDate) < new Date();
};

// Capitalize first letter
exports.capitalize = (str) => {
  return str.charAt(0).toUpperCase() + str.slice(1);
};

// Generate random string
exports.generateRandomString = (length = 10) => {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return result;
};

// Truncate text
exports.truncate = (text, length = 50) => {
  if (text.length <= length) return text;
  return text.substring(0, length) + '...';
};

// Remove duplicates from array
exports.removeDuplicates = (arr) => {
  return [...new Set(arr)];
};

// Sort array of objects by field
exports.sortByField = (arr, field, order = 'asc') => {
  return arr.sort((a, b) => {
    if (order === 'asc') {
      return a[field] > b[field] ? 1 : -1;
    } else {
      return a[field] < b[field] ? 1 : -1;
    }
  });
};

// Paginate results
exports.paginate = (data, page = 1, limit = 10) => {
  const startIndex = (page - 1) * limit;
  const endIndex = page * limit;

  const results = {
    currentPage: page,
    totalPages: Math.ceil(data.length / limit),
    totalItems: data.length,
    itemsPerPage: limit,
    data: data.slice(startIndex, endIndex)
  };

  if (endIndex < data.length) {
    results.nextPage = page + 1;
  }

  if (startIndex > 0) {
    results.previousPage = page - 1;
  }

  return results;
};

// Calculate percentage
exports.calculatePercentage = (part, total) => {
  if (total === 0) return 0;
  return Math.round((part / total) * 100);
};

// Validate email format
exports.isValidEmail = (email) => {
  const emailRegex = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/;
  return emailRegex.test(email);
};

// Sleep/delay function
exports.sleep = (ms) => {
  return new Promise(resolve => setTimeout(resolve, ms));
};
