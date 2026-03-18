/**
 * Broadcast Model
 * Collection: broadcasts (new collection to be created)
 * 
 * Chứa thông tin công việc phát đi từ admin đến các chi nhánh
 */

const mongoose = require('mongoose');

const checklistItemSchema = new mongoose.Schema({
  task: {
    type: String,
    required: [true, 'Checklist task is required'],
    trim: true
  },
  note: {
    type: String,
    trim: true
  },
  required: {
    type: Boolean,
    default: true
  }
}, { _id: true });

const attachmentSchema = new mongoose.Schema({
  filename: {
    type: String,
    required: [true, 'Filename is required'],
    trim: true
  },
  url: {
    type: String,
    required: [true, 'URL is required'],
    trim: true
  },
  size: {
    type: Number,
    required: [true, 'File size is required']
  },
  mimeType: {
    type: String,
    required: [true, 'MIME type is required']
  },
  uploadedAt: {
    type: Date,
    default: Date.now
  }
}, { _id: true });

const recurringSchema = new mongoose.Schema({
  enabled: {
    type: Boolean,
    default: false
  },
  frequency: {
    type: String,
    enum: ['daily', 'weekly', 'monthly', 'yearly'],
    required: function() {
      return this.enabled;
    }
  },
  pattern: {
    // Common: Time in HH:mm format
    time: {
      type: String,
      validate: {
        validator: function(v) {
          return !v || /^([0-1][0-9]|2[0-3]):[0-5][0-9]$/.test(v);
        },
        message: 'Time must be in HH:mm format'
      }
    },
    
    // For weekly: Day of week (0-6, Sunday-Saturday)
    dayOfWeek: {
      type: Number,
      min: 0,
      max: 6
    },
    
    // For monthly/yearly: Day of month (1-31 or "last")
    dayOfMonth: {
      type: mongoose.Schema.Types.Mixed,
      validate: {
        validator: function(v) {
          return !v || v === 'last' || (Number.isInteger(v) && v >= 1 && v <= 31);
        },
        message: 'Day of month must be 1-31 or "last"'
      }
    },
    
    // For yearly: Month (1-12)
    month: {
      type: Number,
      min: 1,
      max: 12
    }
  }
}, { _id: false });

const broadcastSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Broadcast title is required'],
    trim: true,
    maxlength: [200, 'Title cannot exceed 200 characters']
  },
  description: {
    type: String,
    required: [true, 'Broadcast description is required'],
    trim: true
  },
  priority: {
    type: String,
    enum: {
      values: ['low', 'medium', 'high', 'urgent'],
      message: '{VALUE} is not a valid priority'
    },
    default: 'medium'
  },
  deadline: {
    type: Date,
    required: [true, 'Deadline is required']
  },
  assignedStores: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Brand',
    required: true
  }],
  checklist: {
    type: [checklistItemSchema],
    validate: {
      validator: function(v) {
        return Array.isArray(v) && v.length > 0;
      },
      message: 'Checklist must have at least one item'
    }
  },
  attachments: [attachmentSchema],
  recurring: {
    type: recurringSchema,
    default: () => ({ enabled: false })
  },
  status: {
    type: String,
    enum: {
      values: ['draft', 'active', 'completed', 'archived'],
      message: '{VALUE} is not a valid status'
    },
    default: 'draft'
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Employee',
    required: [true, 'Creator is required']
  },
  publishedAt: {
    type: Date
  },
  completedAt: {
    type: Date
  }
}, {
  timestamps: true,
  collection: 'broadcasts'
});

// Indexes for performance
broadcastSchema.index({ status: 1, createdAt: -1 });
broadcastSchema.index({ createdBy: 1, status: 1 });
broadcastSchema.index({ deadline: 1, status: 1 });
broadcastSchema.index({ assignedStores: 1 });

// Virtual: Calculate completion rate from store_tasks
broadcastSchema.virtual('completionRate').get(async function() {
  const StoreTask = mongoose.model('StoreTask');
  
  const storeTasks = await StoreTask.find({ broadcastId: this._id });
  
  if (storeTasks.length === 0) {
    return 0;
  }
  
  const completedTasks = storeTasks.filter(task => task.status === 'completed').length;
  
  return Math.round((completedTasks / storeTasks.length) * 100);
});

// Virtual: Populate store_tasks
broadcastSchema.virtual('store_tasks', {
  ref: 'StoreTask',
  localField: '_id',
  foreignField: 'broadcastId'
});

// Ensure virtuals are included in JSON and Object outputs
broadcastSchema.set('toJSON', { virtuals: true });
broadcastSchema.set('toObject', { virtuals: true });

// Method: Check if broadcast can be published
broadcastSchema.methods.canPublish = function() {
  // Can only publish draft broadcasts
  if (this.status !== 'draft') {
    return { 
      canPublish: false, 
      reason: 'Only draft broadcasts can be published' 
    };
  }
  
  // Must have at least one assigned store
  if (!this.assignedStores || this.assignedStores.length === 0) {
    return { 
      canPublish: false, 
      reason: 'Broadcast must have at least one assigned store' 
    };
  }
  
  // Must have checklist
  if (!this.checklist || this.checklist.length === 0) {
    return { 
      canPublish: false, 
      reason: 'Broadcast must have a checklist' 
    };
  }
  
  // Must have deadline
  if (!this.deadline) {
    return { 
      canPublish: false, 
      reason: 'Broadcast must have a deadline' 
    };
  }
  
  // Deadline must be in the future
  if (this.deadline < new Date()) {
    return { 
      canPublish: false, 
      reason: 'Deadline must be in the future' 
    };
  }
  
  return { canPublish: true };
};

// Method: Check if broadcast can be edited
broadcastSchema.methods.canEdit = function() {
  // Can only edit draft broadcasts
  if (this.status !== 'draft') {
    return { 
      canEdit: false, 
      reason: 'Only draft broadcasts can be edited' 
    };
  }
  
  return { canEdit: true };
};

// Method: Check if broadcast can be deleted
broadcastSchema.methods.canDelete = function() {
  // Can only delete draft broadcasts
  if (this.status !== 'draft') {
    return { 
      canDelete: false, 
      reason: 'Only draft broadcasts can be deleted' 
    };
  }
  
  return { canDelete: true };
};

// Method: Check if broadcast is overdue
broadcastSchema.methods.isOverdue = function() {
  if (this.status === 'completed' || this.status === 'archived') {
    return false;
  }
  
  return this.deadline < new Date();
};

// Method: Get summary statistics
broadcastSchema.methods.getStats = async function() {
  const StoreTask = mongoose.model('StoreTask');
  
  const storeTasks = await StoreTask.find({ broadcastId: this._id });
  
  const stats = {
    total: storeTasks.length,
    pending: 0,
    accepted: 0,
    rejected: 0,
    in_progress: 0,
    completed: 0,
    completionRate: 0
  };
  
  storeTasks.forEach(task => {
    if (stats[task.status] !== undefined) {
      stats[task.status]++;
    }
  });
  
  if (stats.total > 0) {
    stats.completionRate = Math.round((stats.completed / stats.total) * 100);
  }
  
  return stats;
};

// Pre-save middleware: Validate deadline
broadcastSchema.pre('save', function(next) {
  // Only validate deadline for new or modified deadlines
  if (this.isNew || this.isModified('deadline')) {
    if (this.deadline < new Date() && this.status === 'draft') {
      // For drafts, just warn but allow (can be updated later)
      console.warn(`Warning: Broadcast "${this.title}" has a past deadline`);
    }
  }
  next();
});

// Pre-save middleware: Set publishedAt when status changes to active
broadcastSchema.pre('save', function(next) {
  if (this.isModified('status') && this.status === 'active' && !this.publishedAt) {
    this.publishedAt = new Date();
  }
  next();
});

// Pre-save middleware: Set completedAt when status changes to completed
broadcastSchema.pre('save', function(next) {
  if (this.isModified('status') && this.status === 'completed' && !this.completedAt) {
    this.completedAt = new Date();
  }
  next();
});

const Broadcast = mongoose.model('Broadcast', broadcastSchema);

module.exports = Broadcast;
