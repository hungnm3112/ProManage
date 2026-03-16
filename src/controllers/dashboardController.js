/**
 * Dashboard Controller
 * Provides analytics and summary data for different user roles
 * 
 * Author: ProManage Team
 * Date: March 16, 2026
 */

const Broadcast = require('../models/Broadcast');
const StoreTask = require('../models/StoreTask');
const UserTask = require('../models/UserTask');
const Employee = require('../models/Employee');
const Brand = require('../models/Brand');
const { sendSuccess, sendError } = require('../utils/responseHandler');
const { getEmployeeRole } = require('../helpers/authHelper');
const { calculateBroadcastProgress, calculateStoreTaskProgress } = require('../helpers/progressHelper');

/**
 * @route   GET /api/dashboard/admin
 * @desc    Get admin dashboard data
 * @access  Private (admin only)
 */
const getAdminDashboard = async (req, res) => {
  try {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    // Total broadcasts
    const totalBroadcasts = await Broadcast.countDocuments();
    
    // Active broadcasts (published, not completed)
    const activeBroadcasts = await Broadcast.countDocuments({
      status: 'active',
      deadline: { $gte: now }
    });
    
    // Completed broadcasts this month
    const completedThisMonth = await Broadcast.countDocuments({
      status: 'completed',
      updatedAt: { $gte: startOfMonth, $lte: endOfMonth }
    });
    
    // Overdue tasks
    const overdueTasks = await StoreTask.countDocuments({
      status: { $in: ['pending', 'accepted', 'in_progress'] },
      deadline: { $lt: now }
    });
    
    // Pending reviews (submitted user tasks)
    const pendingReviews = await UserTask.countDocuments({
      status: 'submitted'
    });
    
    // Total stores (brands)
    const totalStores = await Brand.countDocuments();
    
    // Total employees
    const totalEmployees = await Employee.countDocuments({
      Status: 'Đang hoạt động'
    });
    
    // Top performing stores (most completed tasks this month)
    const topStores = await StoreTask.aggregate([
      {
        $match: {
          status: 'completed',
          completedAt: { $gte: startOfMonth, $lte: endOfMonth }
        }
      },
      {
        $group: {
          _id: '$storeId',
          completedCount: { $sum: 1 },
          avgCompletionRate: { $avg: '$completionRate' }
        }
      },
      {
        $sort: { completedCount: -1 }
      },
      {
        $limit: 5
      },
      {
        $lookup: {
          from: 'brands',
          localField: '_id',
          foreignField: '_id',
          as: 'store'
        }
      },
      {
        $unwind: '$store'
      },
      {
        $project: {
          storeName: '$store.Name',
          storeAddress: '$store.Map_Address',
          completedTasks: '$completedCount',
          avgCompletionRate: { $round: ['$avgCompletionRate', 2] }
        }
      }
    ]);
    
    // Recent activities (last 10 broadcasts)
    const recentBroadcasts = await Broadcast.find()
      .sort({ createdAt: -1 })
      .limit(10)
      .select('title status priority createdAt deadline')
      .populate('createdBy', 'FullName');
    
    // Broadcast status distribution
    const broadcastStats = await Broadcast.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);
    
    const statusDistribution = {
      draft: 0,
      active: 0,
      completed: 0,
      cancelled: 0
    };
    
    broadcastStats.forEach(stat => {
      if (statusDistribution.hasOwnProperty(stat._id)) {
        statusDistribution[stat._id] = stat.count;
      }
    });
    
    // Task completion stats this month
    const taskStats = await UserTask.aggregate([
      {
        $match: {
          createdAt: { $gte: startOfMonth, $lte: endOfMonth }
        }
      },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);
    
    const taskDistribution = {
      assigned: 0,
      in_progress: 0,
      submitted: 0,
      approved: 0,
      rejected: 0
    };
    
    taskStats.forEach(stat => {
      if (taskDistribution.hasOwnProperty(stat._id)) {
        taskDistribution[stat._id] = stat.count;
      }
    });
    
    const dashboardData = {
      overview: {
        totalBroadcasts,
        activeBroadcasts,
        completedThisMonth,
        overdueTasks,
        pendingReviews,
        totalStores,
        totalEmployees
      },
      statusDistribution,
      taskDistribution,
      topPerformingStores: topStores,
      recentActivities: recentBroadcasts
    };
    
    return sendSuccess(res, 'Admin dashboard data fetched successfully', dashboardData);
  } catch (error) {
    console.error('getAdminDashboard error:', error);
    return sendError(res, error.message, 500);
  }
};

/**
 * @route   GET /api/dashboard/manager
 * @desc    Get manager dashboard data
 * @access  Private (manager only)
 */
const getManagerDashboard = async (req, res) => {
  try {
    const currentUser = req.user;
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    
    // Get manager's store tasks
    const storeTasks = await StoreTask.find({ managerId: currentUser._id });
    const storeTaskIds = storeTasks.map(st => st._id);
    
    // Store tasks overview
    const totalTasks = storeTasks.length;
    const pendingTasks = storeTasks.filter(st => st.status === 'pending').length;
    const acceptedTasks = storeTasks.filter(st => st.status === 'accepted').length;
    const inProgressTasks = storeTasks.filter(st => st.status === 'in_progress').length;
    const completedTasks = storeTasks.filter(st => st.status === 'completed').length;
    const rejectedTasks = storeTasks.filter(st => st.status === 'rejected').length;
    
    // Overdue tasks
    const overdueTasks = storeTasks.filter(st => 
      ['pending', 'accepted', 'in_progress'].includes(st.status) &&
      st.deadline && st.deadline < now
    ).length;
    
    // Pending reviews (submitted user tasks from this manager's store)
    const pendingReviews = await UserTask.countDocuments({
      storeTaskId: { $in: storeTaskIds },
      status: 'submitted'
    });
    
    // Recent pending reviews
    const recentReviews = await UserTask.find({
      storeTaskId: { $in: storeTaskIds },
      status: 'submitted'
    })
      .sort({ submittedAt: 1 })
      .limit(5)
      .populate('employeeId', 'FullName Phone')
      .populate('broadcastId', 'title priority deadline');
    
    // Employee performance (user tasks this month)
    const employeePerformance = await UserTask.aggregate([
      {
        $match: {
          storeTaskId: { $in: storeTaskIds },
          createdAt: { $gte: startOfMonth }
        }
      },
      {
        $group: {
          _id: {
            employeeId: '$employeeId',
            status: '$status'
          },
          count: { $sum: 1 }
        }
      },
      {
        $group: {
          _id: '$_id.employeeId',
          tasks: {
            $push: {
              status: '$_id.status',
              count: '$count'
            }
          }
        }
      },
      {
        $lookup: {
          from: 'nhan_viens',
          localField: '_id',
          foreignField: '_id',
          as: 'employee'
        }
      },
      {
        $unwind: '$employee'
      },
      {
        $project: {
          employeeName: '$employee.FullName',
          tasks: 1
        }
      },
      {
        $limit: 10
      }
    ]);
    
    // Upcoming deadlines (next 7 days)
    const sevenDaysFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    const upcomingDeadlines = await StoreTask.find({
      managerId: currentUser._id,
      status: { $in: ['pending', 'accepted', 'in_progress'] },
      deadline: { $gte: now, $lte: sevenDaysFromNow }
    })
      .sort({ deadline: 1 })
      .limit(10)
      .populate('broadcastId', 'title priority')
      .populate('storeId', 'Name');
    
    const dashboardData = {
      overview: {
        totalTasks,
        pendingTasks,
        acceptedTasks,
        inProgressTasks,
        completedTasks,
        rejectedTasks,
        overdueTasks,
        pendingReviews
      },
      recentReviews,
      employeePerformance,
      upcomingDeadlines
    };
    
    return sendSuccess(res, 'Manager dashboard data fetched successfully', dashboardData);
  } catch (error) {
    console.error('getManagerDashboard error:', error);
    return sendError(res, error.message, 500);
  }
};

/**
 * @route   GET /api/dashboard/employee
 * @desc    Get employee dashboard data
 * @access  Private (employee only)
 */
const getEmployeeDashboard = async (req, res) => {
  try {
    const currentUser = req.user;
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    
    // Get employee's tasks
    const allTasks = await UserTask.find({ employeeId: currentUser._id });
    
    // Task overview
    const totalTasks = allTasks.length;
    const assignedTasks = allTasks.filter(t => t.status === 'assigned').length;
    const inProgressTasks = allTasks.filter(t => t.status === 'in_progress').length;
    const submittedTasks = allTasks.filter(t => t.status === 'submitted').length;
    const approvedTasks = allTasks.filter(t => t.status === 'approved').length;
    const rejectedTasks = allTasks.filter(t => t.status === 'rejected').length;
    
    // Tasks completed this month
    const completedThisMonth = await UserTask.countDocuments({
      employeeId: currentUser._id,
      status: 'approved',
      reviewedAt: { $gte: startOfMonth }
    });
    
    // Average rating
    const ratedTasks = await UserTask.find({
      employeeId: currentUser._id,
      status: 'approved',
      rating: { $exists: true, $ne: null }
    }).select('rating');
    
    const avgRating = ratedTasks.length > 0
      ? ratedTasks.reduce((sum, t) => sum + t.rating, 0) / ratedTasks.length
      : 0;
    
    // Recent feedback (last 5 approved/rejected tasks)
    const recentFeedback = await UserTask.find({
      employeeId: currentUser._id,
      status: { $in: ['approved', 'rejected'] },
      reviewNote: { $exists: true, $ne: '' }
    })
      .sort({ reviewedAt: -1 })
      .limit(5)
      .populate('broadcastId', 'title')
      .select('status rating reviewNote reviewedAt');
    
    // Current active tasks (assigned or in_progress)
    const activeTasks = await UserTask.find({
      employeeId: currentUser._id,
      status: { $in: ['assigned', 'in_progress'] }
    })
      .populate('broadcastId', 'title priority deadline')
      .populate('storeTaskId', 'deadline')
      .sort({ createdAt: -1 })
      .limit(10);
    
    // Tasks with stats
    const activeTasksWithStats = activeTasks.map(task => ({
      ...task.toObject(),
      stats: task.getStats(),
      isOverdue: task.storeTaskId?.deadline && task.storeTaskId.deadline < now
    }));
    
    const dashboardData = {
      overview: {
        totalTasks,
        assignedTasks,
        inProgressTasks,
        submittedTasks,
        approvedTasks,
        rejectedTasks,
        completedThisMonth,
        avgRating: Math.round(avgRating * 10) / 10
      },
      activeTasks: activeTasksWithStats,
      recentFeedback
    };
    
    return sendSuccess(res, 'Employee dashboard data fetched successfully', dashboardData);
  } catch (error) {
    console.error('getEmployeeDashboard error:', error);
    return sendError(res, error.message, 500);
  }
};

module.exports = {
  getAdminDashboard,
  getManagerDashboard,
  getEmployeeDashboard
};
