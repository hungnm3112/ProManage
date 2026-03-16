# Technical - Security

> Security practices và implementation

## 🔐 Authentication

### JWT Token

Sử dụng **JSON Web Token (JWT)** cho authentication.

```javascript
// Generate JWT
const jwt = require('jsonwebtoken');

async function generateToken(employee) {
  // Get role from GroupUser lookup
  // Admin: Tổng giám đốc, Kho tổng, Phó tổng giám đốc, Giám đốc khu vực, Phó giám đốc
  // Manager: Giám đốc chi nhánh
  // Employee: Các chức vụ khác
  const role = await getEmployeeRole(employee);
  
  const payload = {
    userId: employee._id,
    phone: employee.Phone,
    fullName: employee.FullName,
    role: role,
    branchId: employee.ID_Branch,
    groupUserId: employee.ID_GroupUser
  };
  
  const token = jwt.sign(
    payload,
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  );
  
  return token;
}

// Verify JWT
function verifyToken(token) {
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    return decoded;
  } catch (error) {
    throw new Error('Invalid token');
  }
}
```

### Login Flow

**Lưu ý:** Hệ thống hiện tại dùng **Phone** để login (không phải Email).

```javascript
const EmployeeModel = mongoose.model('Employee');

async function login(phone, password) {
  // Find employee by phone
  const employee = await EmployeeModel.findOne({ 
    Phone: phone,
    Status: 'Đang làm việc'  // Only active employees
  });
  
  if (!employee) {
    throw new Error('Invalid credentials');
  }
  
  // Verify password (SHA-512 + Salt)
  const isValid = verifyPassword(employee, password);
  
  if (!isValid) {
    throw new Error('Invalid credentials');
  }
  
  // Get role
  const role = await getEmployeeRole(employee);
  
  // Generate token
  const token = await generateToken(employee);
  
  return {
    employee: {
      _id: employee._id,
      phone: employee.Phone,
      fullName: employee.FullName,
      role: role,
      branchId: employee.ID_Branch,
      email: employee.Email
    },
    token
  };
}
```

---

## 🔒 Password Security

### SHA-512 + Salt Hashing

**Lưu ý:** Hệ thống hiện tại sử dụng SHA-512 với Salt (không phải bcrypt).

```javascript
const crypto = require('crypto');

// Hash password với Salt
function hashPassword(password, salt) {
  return crypto
    .createHash('sha512')
    .update(password + salt)
    .digest('hex');
}

// Verify password
function verifyPassword(employee, password) {
  const hashed = hashPassword(password, employee.Salt);
  return hashed === employee.Password;
}

// Generate random salt
function generateSalt() {
  return Math.random().toString().substring(2, 10);
}

// Create employee
async function createEmployee(data) {
  const salt = generateSalt();
  const hashedPassword = hashPassword(data.password, salt);
  
  const employee = await EmployeeModel.create({
    Phone: data.phone,
    FullName: data.fullName,
    Password: hashedPassword,
    Salt: salt,
    ID_Branch: data.branchId,
    ID_GroupUser: data.groupUserId,
    Status: 'Đang làm việc',
    Email: data.email || '',
    Address: data.address || '',
    IDCart: data.idCart || '',
    Birthday: data.birthday || ''
  });
  
  return employee;
}
```

### Password Requirements

- Minimum 6 characters
- Không lưu plaintext password
- SHA-512 với Salt (8 ký tự random)

---

## 🛡️ Authorization

### Middleware

```javascript
// Verify JWT middleware
function authenticate(req, res, next) {
  const token = req.headers.authorization?.replace('Bearer ', '');
  
  if (!token) {
    return res.status(401).json({
      success: false,
      error: 'Token required'
    });
  }
  
  try {
    const decoded = verifyToken(token);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      error: 'Invalid token'
    });
  }
}

// Role-based authorization
function authorize(...roles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized'
      });
    }
    
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        error: 'Forbidden'
      });
    }
    
    next();
  };
}

// Usage
app.post('/api/broadcasts', 
  authenticate, 
  authorize('admin'), 
  createBroadcast
);

app.get('/api/manager/dashboard', 
  authenticate, 
  authorize('manager'), 
  getManagerDashboard
);
```

---

## 📁 File Upload Security

### Multer Configuration

```javascript
const multer = require('multer');
const path = require('path');

// Storage config
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    let folder = 'files';
    
    if (file.mimetype.startsWith('image/')) {
      folder = 'photos';
    } else if (file.mimetype.startsWith('video/')) {
      folder = 'videos';
    }
    
    cb(null, `uploads/${folder}`);
  },
  filename: (req, file, cb) => {
    const uniqueName = `${Date.now()}_${Math.random().toString(36).substring(7)}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  }
});

// File filter
const fileFilter = (req, file, cb) => {
  const allowedTypes = {
    image: ['image/jpeg', 'image/png', 'image/jpg'],
    video: ['video/mp4', 'video/quicktime'],
    document: ['application/pdf']
  };
  
  const allAllowed = [
    ...allowedTypes.image,
    ...allowedTypes.video,
    ...allowedTypes.document
  ];
  
  if (allAllowed.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type'), false);
  }
};

// Limits
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB
    files: 10
  }
});
```

### File Validation

```javascript
async function validateFile(file) {
  // Check file type
  const allowedTypes = ['image/jpeg', 'image/png', 'video/mp4', 'application/pdf'];
  
  if (!allowedTypes.includes(file.mimetype)) {
    throw new Error('Invalid file type');
  }
  
  // Check file size
  const maxSizes = {
    'image/jpeg': 10 * 1024 * 1024,  // 10MB
    'image/png': 10 * 1024 * 1024,
    'video/mp4': 50 * 1024 * 1024,   // 50MB
    'application/pdf': 10 * 1024 * 1024
  };
  
  if (file.size > maxSizes[file.mimetype]) {
    throw new Error('File too large');
  }
  
  // Check filename (no malicious characters)
  const filename = file.originalname;
  const regex = /^[a-zA-Z0-9._-]+$/;
  
  if (!regex.test(filename)) {
    throw new Error('Invalid filename');
  }
  
  return true;
}
```

---

## 🚫 Input Validation

### Express Validator

```javascript
const { body, validationResult } = require('express-validator');

// Validation rules
const createBroadcastValidation = [
  body('title')
    .trim()
    .notEmpty().withMessage('Title is required')
    .isLength({ max: 200 }).withMessage('Title too long'),
  
  body('description')
    .trim()
    .notEmpty().withMessage('Description is required'),
  
  body('priority')
    .isIn(['low', 'medium', 'high', 'urgent'])
    .withMessage('Invalid priority'),
  
  body('deadline')
    .isISO8601().withMessage('Invalid date')
    .custom((value) => {
      if (new Date(value) <= new Date()) {
        throw new Error('Deadline must be in the future');
      }
      return true;
    }),
  
  body('assignedBranches')
    .isArray({ min: 1 }).withMessage('At least 1 branch required')
    .custom(async (branchIds) => {
      const BrandModel = mongoose.model('Brand');
      const brands = await BrandModel.find({ 
        _id: { $in: branchIds },
        Active: 'true'  // Only active branches
      });
      if (brands.length !== branchIds.length) {
        throw new Error('Invalid branch IDs');
      }
      return true;
    })
];

// Usage
app.post('/api/broadcasts', 
  authenticate,
  authorize('admin'),
  createBroadcastValidation,
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }
    next();
  },
  createBroadcast
);
```

### MongoDB Injection Prevention

```javascript
// BAD - Vulnerable to injection
const employee = await EmployeeModel.findOne({ Phone: req.body.phone });

// GOOD - Use schema validation
const employeeSchema = new mongoose.Schema({
  Phone: {
    type: String,
    required: true,
    validate: {
      validator: (v) => /^0\d{9}$/.test(v),  // Vietnamese phone format
      message: 'Invalid phone number'
    }
  },
  Email: {
    type: String,
    lowercase: true,
    validate: {
      validator: (v) => !v || /^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/.test(v),
      message: 'Invalid email'
    }
  }
});
```

---

## 🔒 Rate Limiting

### Express Rate Limit

```javascript
const rateLimit = require('express-rate-limit');

// General API rate limit
const apiLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 100, // 100 requests per minute
  message: {
    success: false,
    error: 'Too many requests'
  }
});

// Login rate limit (stricter)
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 attempts
  message: {
    success: false,
    error: 'Too many login attempts. Try again later.'
  }
});

// File upload rate limit
const uploadLimiter = rateLimit({
  windowMs: 1 * 60 * 1000,
  max: 10,
  message: {
    success: false,
    error: 'Too many uploads. Try again later.'
  }
});

// Usage
app.use('/api/', apiLimiter);
app.post('/api/auth/login', loginLimiter, login);
app.post('/api/upload', uploadLimiter, upload);
```

---

## 🛡️ CORS

```javascript
const cors = require('cors');

const corsOptions = {
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
  optionsSuccessStatus: 200
};

app.use(cors(corsOptions));
```

---

## 🔒 Helmet (Security Headers)

```javascript
const helmet = require('helmet');

app.use(helmet());

// Custom CSP
app.use(
  helmet.contentSecurityPolicy({
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  })
);
```

---

## 🗝️ Environment Variables

### .env file

```bash
# Server
PORT=5000
NODE_ENV=production

# Database
MONGODB_URI=mongodb://localhost:27017/workflow32

# JWT
JWT_SECRET=your_super_secret_key_change_this_in_production
JWT_EXPIRES_IN=7d

# Frontend
FRONTEND_URL=http://localhost:3000

# File Upload
UPLOAD_PATH=/var/www/uploads
MAX_FILE_SIZE=52428800

# Email (optional)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_password
```

**Important:** 
- ❌ NEVER commit `.env` to Git
- ✅ Add `.env` to `.gitignore`
- ✅ Use strong JWT_SECRET (at least 32 characters)

---

## 🔍 Logging & Monitoring

```javascript
const winston = require('winston');

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  transports: [
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' })
  ]
});

// Log authentication attempts
app.post('/api/auth/login', async (req, res) => {
  try {
    const result = await login(req.body.phone, req.body.password);
    
    logger.info('Login success', {
      phone: req.body.phone,
      employeeId: result.employee._id,
      role: result.employee.role,
      ip: req.ip
    });
    
    res.json(result);
  } catch (error) {
    logger.warn('Login failed', {
      phone: req.body.phone,
      ip: req.ip,
      error: error.message
    });
    
    res.status(401).json({
      success: false,
      error: 'Invalid credentials'
    });
  }
});
```

---

## 🔐 API Security Checklist

- ✅ JWT authentication
- ✅ SHA-512 + Salt password hashing
- ✅ Phone-based login (not email)
- ✅ Role-based authorization (via ID_GroupUser)
- ✅ Input validation (express-validator)
- ✅ File upload validation (Multer)
- ✅ Rate limiting
- ✅ CORS configuration
- ✅ Security headers (Helmet)
- ✅ HTTPS (production)
- ✅ MongoDB injection prevention
- ✅ Error logging
- ✅ Environment variables
- ✅ No sensitive data in responses
- ⚠️  Check employee Status = 'Đang làm việc' before authentication

---

## 🔗 Liên quan

- **Database Schema**: [database-schema.md](database-schema.md)
- **Business Logic**: [business-logic.md](business-logic.md)
- **Deployment**: [deployment.md](deployment.md)
