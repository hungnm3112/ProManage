/**
 * StoreTask Model
 * Collection: store_tasks (new collection to be created)
 * 
 * Chứa thông tin công việc được giao cho từng chi nhánh từ một broadcast
 */

const mongoose = require('mongoose');

const storeTaskSchema = new mongoose.Schema({
  broadcastId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Broadcast',
    required: [true, 'Broadcast ID is required']
  },
  storeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Brand',
    required: [true, 'Store ID is required']
  },
  // Người phụ trách (nhân viên đầu tiên được Admin chọn)
  // Vừa làm vừa quản lý — có quyền phân công checklist item và review kết quả
  assignedPersonId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Employee',
    default: null
  },
  // Giữ managerId (không required) để tương thích data cũ nếu có
  managerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Employee',
    default: null
  },
  status: {
    type: String,
    enum: {
      values: ['assigned', 'in_progress', 'completed'],
      message: '{VALUE} is not a valid status'
    },
    default: 'assigned'
  },
  assignedEmployees: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Employee'
  }],
  completionRate: {
    type: Number,
    min: 0,
    max: 100,
    default: 0
  },
  completedAt: {
    type: Date
  },
  startedAt: {
    type: Date
  },
  messages: [
    {
      senderId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Employee',
        required: true
      },
      senderName: {
        type: String,
        required: true
      },
      text: {
        type: String,
        required: true,
        maxlength: 1000
      },
      createdAt: {
        type: Date,
        default: Date.now
      }
    }
  ]
}, {
  timestamps: true,
  collection: 'store_tasks'
});

// Unique index: One store task per broadcast per store
storeTaskSchema.index({ broadcastId: 1, storeId: 1 }, { unique: true });

// Other indexes for performance
storeTaskSchema.index({ assignedPersonId: 1, status: 1 });
storeTaskSchema.index({ storeId: 1, status: 1 });
storeTaskSchema.index({ status: 1, createdAt: -1 });

// Virtual: Populate user_tasks (tasks assigned to individual employees)
storeTaskSchema.virtual('user_tasks', {
  ref: 'UserTask',
  localField: '_id',
  foreignField: 'storeTaskId'
});

// Virtual: Populate broadcast details
storeTaskSchema.virtual('broadcast', {
  ref: 'Broadcast',
  localField: 'broadcastId',
  foreignField: '_id',
  justOne: true
});

// Virtual: Populate store details
storeTaskSchema.virtual('store', {
  ref: 'Brand',
  localField: 'storeId',
  foreignField: '_id',
  justOne: true
});

// Virtual: Populate assignedPerson details
storeTaskSchema.virtual('assignedPerson', {
  ref: 'Employee',
  localField: 'assignedPersonId',
  foreignField: '_id',
  justOne: true
});

// Ensure virtuals are included in JSON and Object outputs
storeTaskSchema.set('toJSON', { virtuals: true });
storeTaskSchema.set('toObject', { virtuals: true });



// Method: Check if task is overdue
storeTaskSchema.methods.isOverdue = async function() {
  if (this.status === 'completed') {
    return false;
  }
  
  const Broadcast = mongoose.model('Broadcast');
  const broadcast = await Broadcast.findById(this.broadcastId);
  
  if (!broadcast) {
    return false;
  }
  
  return broadcast.deadline < new Date();
};

// Method: Calculate completion rate từ checklist items của UserTask duy nhất
// Tính theo % required items đã isCompleted=true
storeTaskSchema.methods.calculateCompletionRate = async function() {
  const UserTask = mongoose.model('UserTask');
  
  const userTask = await UserTask.findOne({ storeTaskId: this._id });
  
  if (!userTask || !userTask.checklist || userTask.checklist.length === 0) {
    return 0;
  }
  
  const requiredItems = userTask.checklist.filter(item => item.required);
  if (requiredItems.length === 0) {
    return 100;
  }
  
  const completedRequired = requiredItems.filter(item => item.isCompleted).length;
  return Math.round((completedRequired / requiredItems.length) * 100);
};

// Method: Update completion rate
storeTaskSchema.methods.updateCompletionRate = async function() {
  const rate = await this.calculateCompletionRate();
  this.completionRate = rate;
  
  // Auto-complete if all user tasks are approved
  if (rate === 100 && this.status !== 'completed') {
    this.status = 'completed';
    this.completedAt = new Date();
  }
  
  await this.save();
  return rate;
};

// Method: Get statistics từ UserTask duy nhất
storeTaskSchema.methods.getStats = async function() {
  const UserTask = mongoose.model('UserTask');
  
  const userTask = await UserTask.findOne({ storeTaskId: this._id });
  
  if (!userTask) {
    return {
      totalItems: 0,
      completedItems: 0,
      requiredItems: 0,
      completedRequiredItems: 0,
      assignedItems: 0,
      completionRate: 0,
      status: this.status
    };
  }
  
  const checklist = userTask.checklist || [];
  const totalItems = checklist.length;
  const completedItems = checklist.filter(i => i.isCompleted).length;
  const requiredItems = checklist.filter(i => i.required).length;
  const completedRequiredItems = checklist.filter(i => i.required && i.isCompleted).length;
  const assignedItems = checklist.filter(i => i.assignedTo).length;
  
  return {
    totalItems,
    completedItems,
    requiredItems,
    completedRequiredItems,
    assignedItems,
    completionRate: this.completionRate || 0,
    status: this.status
  };
};

// Pre-save middleware: Set timestamps khi status thay đổi
storeTaskSchema.pre('save', function(next) {
  if (this.isModified('status')) {
    if (this.status === 'in_progress' && !this.startedAt) {
      this.startedAt = new Date();
    }
    
    if (this.status === 'completed' && !this.completedAt) {
      this.completedAt = new Date();
    }
  }
  next();
});

const StoreTask = mongoose.model('StoreTask', storeTaskSchema);

module.exports = StoreTask;
