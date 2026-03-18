/**
 * Brand Model
 * Collection: Branch (existing in database)
 * 
 * Lưu ý: Model name là 'Brand' nhưng collection name là 'Branch'
 * - Model name 'Brand' được dùng trong code (mongoose.model, require, ref)
 * - Collection name 'Branch' là tên thực tế trong MongoDB database
 * 
 * Chứa thông tin chi nhánh/cửa hàng
 */

const mongoose = require('mongoose');

const brandSchema = new mongoose.Schema({
  ID_System: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'System'
  },
  Name: {
    type: String,
    required: [true, 'Brand name is required'],
    trim: true
  },
  Map_Address: {
    type: String,
    trim: true
  },
  Phone: {
    type: String,
    match: [/^0\d{9}$/, 'Invalid phone format']
  },
  Image: String,
  WifiAddress: String,  // JSON array as string
  Icon: String,
  HeaderContent: String,
  CheckIn: String,  // Time as string "08:00:20"
  CheckOut: String,
  LateIn: String,
  OutOvertime: String,
  Active: {
    type: String,
    enum: ['true', 'false'],
    default: 'true'
  },
  Phone_Customer_Support: String,
  Phone_Feedback: String,
  Link_Description: String,
  Active_Schedule: String,  // "true" | "false"
  PercentPayment: String
}, {
  timestamps: false,
  collection: 'Branch'  // MongoDB collection name
});

// Indexes
brandSchema.index({ ID_System: 1 });
brandSchema.index({ Active: 1 });
brandSchema.index({ Name: 'text' });

// Virtual: Get manager của brand này
brandSchema.virtual('manager', {
  ref: 'Employee',
  localField: '_id',
  foreignField: 'ID_Branch',
  justOne: true,
  match: { Status: 'Đang hoạt động' }
});

// Method: Check if active
brandSchema.methods.isActive = function() {
  return this.Active === 'true';
};

// Method: Get employees of this brand
brandSchema.methods.getEmployees = async function() {
  const Employee = mongoose.model('Employee');
  return await Employee.find({
    ID_Branch: this._id,
    Status: 'Đang hoạt động'
  });
};

// Method: Get manager
brandSchema.methods.getManager = async function() {
  const Employee = mongoose.model('Employee');
  const { getEmployeeRole } = require('../helpers/authHelper');
  
  const employees = await this.getEmployees();
  
  for (const emp of employees) {
    const role = await getEmployeeRole(emp);
    if (role === 'manager') {
      return emp;
    }
  }
  
  return null;
};

const Brand = mongoose.model('Brand', brandSchema);  // Model: 'Brand', Collection: 'Branch'

module.exports = Brand;
