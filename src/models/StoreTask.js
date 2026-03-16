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
  managerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Employee',
    required: [true, 'Manager ID is required']
  },
  status: {
    type: String,
    enum: {
      values: ['pending', 'accepted', 'rejected', 'in_progress', 'completed'],
      message: '{VALUE} is not a valid status'
    },
    default: 'pending'
  },
  acceptedAt: {
    type: Date
  },
  rejectedAt: {
    type: Date
  },
  rejectedReason: {
    type: String,
    trim: true,
    required: function() {
      return this.status === 'rejected';
    }
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
  }
}, {
  timestamps: true,
  collection: 'store_tasks'
});

// Unique index: One store task per broadcast per store
storeTaskSchema.index({ broadcastId: 1, storeId: 1 }, { unique: true });

// Other indexes for performance
storeTaskSchema.index({ managerId: 1, status: 1 });
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

// Virtual: Populate manager details
storeTaskSchema.virtual('manager', {
  ref: 'Employee',
  localField: 'managerId',
  foreignField: '_id',
  justOne: true
});

// Ensure virtuals are included in JSON and Object outputs
storeTaskSchema.set('toJSON', { virtuals: true });
storeTaskSchema.set('toObject', { virtuals: true });

// Method: Check if manager can accept
storeTaskSchema.methods.canAccept = function() {
  if (this.status !== 'pending') {
    return {
      canAccept: false,
      reason: 'Only pending tasks can be accepted'
    };
  }
  
  return { canAccept: true };
};

// Method: Check if manager can reject
storeTaskSchema.methods.canReject = function() {
  if (this.status !== 'pending') {
    return {
      canReject: false,
      reason: 'Only pending tasks can be rejected'
    };
  }
  
  return { canReject: true };
};

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

// Method: Calculate completion rate from user_tasks
storeTaskSchema.methods.calculateCompletionRate = async function() {
  const UserTask = mongoose.model('UserTask');
  
  const userTasks = await UserTask.find({ storeTaskId: this._id });
  
  if (userTasks.length === 0) {
    return 0;
  }
  
  const completedTasks = userTasks.filter(task => 
    task.status === 'approved'
  ).length;
  
  return Math.round((completedTasks / userTasks.length) * 100);
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

// Method: Get statistics
storeTaskSchema.methods.getStats = async function() {
  const UserTask = mongoose.model('UserTask');
  
  const userTasks = await UserTask.find({ storeTaskId: this._id });
  
  const stats = {
    total: userTasks.length,
    assigned: 0,
    in_progress: 0,
    submitted: 0,
    approved: 0,
    rejected: 0,
    completionRate: this.completionRate || 0
  };
  
  userTasks.forEach(task => {
    if (stats[task.status] !== undefined) {
      stats[task.status]++;
    }
  });
  
  return stats;
};

// Pre-save middleware: Set acceptedAt when status changes to accepted
storeTaskSchema.pre('save', function(next) {
  if (this.isModified('status')) {
    if (this.status === 'accepted' && !this.acceptedAt) {
      this.acceptedAt = new Date();
    }
    
    if (this.status === 'rejected' && !this.rejectedAt) {
      this.rejectedAt = new Date();
    }
    
    if (this.status === 'in_progress' && !this.startedAt) {
      this.startedAt = new Date();
    }
    
    if (this.status === 'completed' && !this.completedAt) {
      this.completedAt = new Date();
    }
  }
  next();
});

// Pre-save middleware: Validate rejectedReason when status is rejected
storeTaskSchema.pre('save', function(next) {
  if (this.status === 'rejected' && !this.rejectedReason) {
    return next(new Error('Rejected reason is required when rejecting a task'));
  }
  next();
});

const StoreTask = mongoose.model('StoreTask', storeTaskSchema);

module.exports = StoreTask;
