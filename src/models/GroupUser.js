/**
 * GroupUser Model
 * Collection: GroupUser (existing in database)
 * 
 * Chứa thông tin chức vụ/phòng ban
 */

const mongoose = require('mongoose');

const groupUserSchema = new mongoose.Schema({
  Name: {
    type: String,
    required: [true, 'Position name is required'],
    trim: true
  },
  Description: {
    type: String,
    trim: true
  },
  Status: {
    type: String,
    enum: ['1', '0'],  // '1' = active, '0' = inactive
    default: '1'
  },
  ID_GeneralGroupUser: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'GeneralGroupUser'
  }
}, {
  timestamps: false,
  collection: 'GroupUser'
});

// Indexes
groupUserSchema.index({ Name: 1 });
groupUserSchema.index({ Status: 1 });
groupUserSchema.index({ Name: 'text' });

// Method: Check if this is admin position
groupUserSchema.methods.isAdmin = function() {
  const adminPositions = [
    'Tổng giám đốc',
    'Kho tổng',
    'Phó tổng giám đốc',
    'Giám đốc khu vực',
    'Phó giám đốc'
  ];
  return adminPositions.includes(this.Name);
};

// Method: Check if this is manager position
groupUserSchema.methods.isManager = function() {
  return this.Name === 'Giám đốc chi nhánh';
};

// Method: Get role string
groupUserSchema.methods.getRole = function() {
  if (this.isAdmin()) return 'admin';
  if (this.isManager()) return 'manager';
  return 'employee';
};

const GroupUser = mongoose.model('GroupUser', groupUserSchema);

module.exports = GroupUser;
