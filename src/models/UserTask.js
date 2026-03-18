const mongoose = require('mongoose');

/**
 * UserTask Schema
 * 
 * Represents individual tasks assigned to employees
 * Created when manager assigns employees to a StoreTask
 */

const userTaskSchema = new mongoose.Schema({
  // Reference to parent StoreTask
  storeTaskId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'StoreTask',
    required: true,
    index: true
  },

  // Reference to Broadcast (for easy access)
  broadcastId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Broadcast',
    required: true,
    index: true
  },

  // Assigned employee
  employeeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Employee', // Employee model
    required: true,
    index: true
  },

  // Checklist items (copied from Broadcast at assignment)
  checklist: [{
    task: {
      type: String,
      required: true
    },
    note: {
      type: String,
      default: ''
    },
    required: {
      type: Boolean,
      default: true
    },
    isCompleted: {
      type: Boolean,
      default: false
    },
    completedAt: {
      type: Date
    }
  }],

  // Evidence files uploaded by employee
  evidences: [{
    type: {
      type: String,
      enum: ['photo', 'video', 'document', 'file'],
      required: true
    },
    url: {
      type: String,
      required: true
    },
    filename: {
      type: String,
      required: true
    },
    uploadedAt: {
      type: Date,
      default: Date.now
    }
  }],

  // Task status
  status: {
    type: String,
    enum: ['assigned', 'in_progress', 'submitted', 'approved', 'rejected'],
    default: 'assigned',
    index: true
  },

  // Timestamps
  submittedAt: {
    type: Date
  },
  reviewedAt: {
    type: Date
  },

  // Manager review
  reviewNote: {
    type: String,
    default: ''
  },

  // Rating from manager (1-5 stars)
  rating: {
    type: Number,
    min: 1,
    max: 5
  },

  // Overall note from employee when submitting
  overallNote: {
    type: String,
    default: ''
  }
}, {
  timestamps: true,
  collection: 'user_tasks'
});

// Compound index for efficient queries
userTaskSchema.index({ storeTaskId: 1, employeeId: 1 });
userTaskSchema.index({ employeeId: 1, status: 1 });
userTaskSchema.index({ storeTaskId: 1, status: 1 });

/**
 * Virtual: checklistProgress
 * Calculate percentage of completed checklist items
 */
userTaskSchema.virtual('checklistProgress').get(function() {
  if (!this.checklist || this.checklist.length === 0) {
    return 0;
  }
  
  const completed = this.checklist.filter(item => item.isCompleted).length;
  return Math.round((completed / this.checklist.length) * 100);
});

/**
 * Virtual: requiredItemsCompleted
 * Check if all required checklist items are completed
 */
userTaskSchema.virtual('requiredItemsCompleted').get(function() {
  if (!this.checklist || this.checklist.length === 0) {
    return true;
  }
  
  const requiredItems = this.checklist.filter(item => item.required);
  if (requiredItems.length === 0) {
    return true;
  }
  
  return requiredItems.every(item => item.isCompleted);
});

/**
 * Method: canSubmit
 * Check if task can be submitted
 */
userTaskSchema.methods.canSubmit = function() {
  // Must be in assigned or in_progress status
  if (!['assigned', 'in_progress'].includes(this.status)) {
    return { canSubmit: false, reason: 'Task has already been submitted' };
  }

  // All required checklist items must be completed
  if (!this.requiredItemsCompleted) {
    return { canSubmit: false, reason: 'All required checklist items must be completed' };
  }

  return { canSubmit: true };
};

/**
 * Method: canUpdate
 * Check if task can be updated
 */
userTaskSchema.methods.canUpdate = function() {
  // Can only update if not yet submitted or if rejected (to fix and resubmit)
  return ['assigned', 'in_progress', 'rejected'].includes(this.status);
};

/**
 * Method: canReview
 * Check if task can be reviewed
 */
userTaskSchema.methods.canReview = function() {
  return this.status === 'submitted';
};

/**
 * Method: getStats
 * Get task statistics
 */
userTaskSchema.methods.getStats = function() {
  const totalItems = this.checklist ? this.checklist.length : 0;
  const completedItems = this.checklist ? this.checklist.filter(item => item.isCompleted).length : 0;
  const requiredItems = this.checklist ? this.checklist.filter(item => item.required).length : 0;
  const completedRequiredItems = this.checklist ? 
    this.checklist.filter(item => item.required && item.isCompleted).length : 0;

  return {
    totalItems,
    completedItems,
    requiredItems,
    completedRequiredItems,
    progress: this.checklistProgress,
    evidenceCount: this.evidences ? this.evidences.length : 0,
    status: this.status
  };
};

/**
 * Pre-save hook: Update submittedAt when status changes to submitted
 */
userTaskSchema.pre('save', function(next) {
  // Set submittedAt when status changes to submitted
  if (this.isModified('status') && this.status === 'submitted' && !this.submittedAt) {
    this.submittedAt = new Date();
  }

  // Set reviewedAt when status changes to approved or rejected
  if (this.isModified('status') && ['approved', 'rejected'].includes(this.status) && !this.reviewedAt) {
    this.reviewedAt = new Date();
  }

  next();
});

// Enable virtuals in JSON
userTaskSchema.set('toJSON', { virtuals: true });
userTaskSchema.set('toObject', { virtuals: true });

const UserTask = mongoose.model('UserTask', userTaskSchema);

module.exports = UserTask;
