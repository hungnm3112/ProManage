/**
 * Employee Model
 * Collection: Employee (existing in database)
 * 
 * Chứa thông tin nhân viên (Admin, Manager, Employee)
 */

const mongoose = require('mongoose');

const employeeSchema = new mongoose.Schema({
  Phone: {
    type: String,
    required: [true, 'Phone number is required'],
    unique: true,
    match: [/^0\d{9}$/, 'Phone must be valid Vietnamese format (0xxxxxxxxx)']
  },
  FullName: {
    type: String,
    required: [true, 'Full name is required'],
    trim: true
  },
  CMND: String,
  ID_GroupUser: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'GroupUser',
    required: [true, 'GroupUser is required']
  },
  Password: {
    type: String,
    required: [true, 'Password is required'],
    select: false  // Không trả về password khi query
  },
  Salt: {
    type: String,
    required: [true, 'Salt is required'],
    select: false  // Không trả về salt khi query
  },
  Address: String,
  Household: String,
  Level: String,  // Trình độ học vấn
  TaxCode: String,
  Salary: String,
  ResponsibilityAllowance: String,
  ExcessAllowance: String,
  ID_Branch: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Brand'
  },
  Image: String,
  DateRange_CMND: String,
  PlaceRange_CMND: String,
  DateOnCompany: String,
  Status: {
    type: String,
    enum: ['Đang làm việc', 'Đã dừng'],
    default: 'Đang làm việc'
  },
  Gender: {
    type: String,
    enum: ['Nam', 'Nữ']
  },
  Email: {
    type: String,
    lowercase: true,
    match: [/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/, 'Invalid email format']
  },
  DateBirth: String,
  BankNumber: String,
  HealthInsurance: String,
  TimeStartHealthInsurance: String,
  StatusHealthInsurance: String,
  HospitalRegisterHealthInsurance: String,
  PaymentLevelHealthInsurance: String,
  LunchAllowance: String,
  NightAllowance: String,
  NightDutySalary: String,
  NoonDutySalary: String,
  OtherAllowance: String,
  RevenuePercent: String,
  FundBranch: String,
  KPI_Branch: String,
  Coefficient: String,
  WarrantyOfEmployee: String,
  is_timekeeping_all: String,  // "true" | "false"
  HistoryWorkplace: String,  // JSON array as string
  HistoryHealthInsurence: String,
  HistorySalary: String,
  unsign_search: String,  // Search index
  __v: String
}, {
  timestamps: false,
  collection: 'Employee'  // Use existing collection name
});

// Indexes
employeeSchema.index({ Phone: 1 });
employeeSchema.index({ ID_GroupUser: 1 });
employeeSchema.index({ ID_Branch: 1 });
employeeSchema.index({ Status: 1 });
employeeSchema.index({ unsign_search: 'text' });

// Virtual để get role (sẽ populate từ GroupUser)
employeeSchema.virtual('role', {
  ref: 'GroupUser',
  localField: 'ID_GroupUser',
  foreignField: '_id',
  justOne: true
});

// Method: Compare password (SHA-512 + Salt)
employeeSchema.methods.comparePassword = function(candidatePassword) {
  const crypto = require('crypto');
  const hashed = crypto
    .createHash('sha512')
    .update(candidatePassword + this.Salt)
    .digest('hex');
  return hashed === this.Password;
};

// Method: Get role từ GroupUser
employeeSchema.methods.getRole = async function() {
  const { getEmployeeRole } = require('../helpers/authHelper');
  return await getEmployeeRole(this);
};

// Method: Check if active
employeeSchema.methods.isActive = function() {
  return this.Status === 'Đang làm việc';
};

const Employee = mongoose.model('Employee', employeeSchema);

module.exports = Employee;
