/**
 * StoreTask Controller
 * Handles StoreTask management endpoints
 * 
 * Author: ProManage Team
 * Date: March 16, 2026
 */

const StoreTask = require('../models/StoreTask');
const Broadcast = require('../models/Broadcast');
const Employee = require('../models/Employee');
const UserTask = require('../models/UserTask');
const { sendSuccess, sendError } = require('../utils/responseHandler');
const { getEmployeeRole } = require('../helpers/authHelper');
const notificationService = require('../services/notificationService');

/**
 * @route   GET /api/store-tasks
 * @desc    Get all store tasks with filtering
 * @access  Private (admin, manager)
 * @query   {string} status - Filter by status
 * @query   {string} broadcastId - Filter by broadcast
 * @query   {number} page - Page number (default: 1)
 * @query   {number} limit - Items per page (default: 20)
 * @note    Manager can only see their own store's tasks
 */
const getStoreTasks = async (req, res) => {
  try {
    const { status, broadcastId, page = 1, limit = 20 } = req.query;
    const currentUser = req.user;
    const currentUserRole = await getEmployeeRole(currentUser);
    
    // Build filter
    const filter = {};
    
    // Filter by status
    if (status) {
      filter.status = status;
    }
    
    // Filter by broadcast
    if (broadcastId) {
      filter.broadcastId = broadcastId;
    }
    
    // Manager can only see their own store's tasks
    if (currentUserRole === 'manager') {
      filter.storeId = currentUser.ID_Branch;
    }
    
    // Pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const limitNum = parseInt(limit);
    
    // Count total documents
    const total = await StoreTask.countDocuments(filter);
    
    // Fetch store tasks
    const storeTasks = await StoreTask.find(filter)
      .populate('broadcastId', 'title description priority deadline status')
      .populate('storeId', 'Name Map_Address Phone')
      .populate('assignedPersonId', 'FullName Phone')
      .populate('assignedEmployees', 'FullName Phone')
      .select('-__v')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum)
      .lean();
    
    // Calculate pagination metadata
    const totalPages = Math.ceil(total / limitNum);
    const hasNextPage = page < totalPages;
    const hasPrevPage = page > 1;
    
    return sendSuccess(res, 'Store tasks fetched successfully', {
      storeTasks,
      pagination: {
        total,
        page: parseInt(page),
        limit: limitNum,
        totalPages,
        hasNextPage,
        hasPrevPage
      }
    });
  } catch (error) {
    console.error('getStoreTasks error:', error);
    return sendError(res, error.message, 500);
  }
};

/**
 * @route   GET /api/store-tasks/:id
 * @desc    Get store task by ID
 * @access  Private (admin, manager)
 * @note    Manager can only see their own store's tasks
 */
const getStoreTaskById = async (req, res) => {
  try {
    const { id } = req.params;
    const currentUser = req.user;
    const currentUserRole = await getEmployeeRole(currentUser);
    
    const storeTask = await StoreTask.findById(id)
      .populate('broadcastId')
      .populate('storeId', 'Name Map_Address Phone')
      .populate('assignedPersonId', 'FullName Phone')
      .populate('assignedEmployees', 'FullName Phone')
      .select('-__v');
    
    if (!storeTask) {
      return sendError(res, 'Store task not found', 404);
    }
    
    // Manager/assignedPerson can only view their own store's tasks
    if (currentUserRole === 'manager') {
      if (storeTask.storeId._id.toString() !== currentUser.ID_Branch.toString()) {
        return sendError(res, 'You can only view tasks of your own store', 403);
      }
    }
    
    // Get statistics
    const stats = await storeTask.getStats();
    
    // Check if overdue
    const isOverdue = await storeTask.isOverdue();
    
    return sendSuccess(res, 'Store task fetched successfully', {
      storeTask,
      stats,
      isOverdue
    });
  } catch (error) {
    console.error('getStoreTaskById error:', error);
    return sendError(res, error.message, 500);
  }
};

/**
 * @route   POST /api/store-tasks/:id/assign
 * @desc    Assign employees to a store task (Admin only)
 * @access  Private (admin only)
 * @body    {string[]} employeeIds - Array of employee IDs; employee[0] = người phụ trách chính
 * @note    TẤT CẢ employeeIds đều là người phụ trách — mỗi người nhận UserTask với checklist đầy đủ.
 *          Không có khái niệm "worker" từ admin. Người phụ trách tự giao việc cho bất kỳ NV cùng chi nhánh.
 */
const assignEmployees = async (req, res) => {
  try {
    const { id } = req.params;
    const { employeeIds } = req.body;
    const currentUser = req.user;
    
    // Validate input
    if (!employeeIds || !Array.isArray(employeeIds) || employeeIds.length === 0) {
      return sendError(res, 'Employee IDs array is required', 400);
    }
    
    // Find store task
    const storeTask = await StoreTask.findById(id)
      .populate('broadcastId')
      .populate('storeId', 'Name');
    
    if (!storeTask) {
      return sendError(res, 'Store task not found', 404);
    }
    
    // Validate: storeTask phải chưa có UserTask (chưa giao việc)
    const existingUserTask = await UserTask.findOne({ storeTaskId: storeTask._id });
    if (existingUserTask) {
      return sendError(res, 'Chi nhánh này đã được giao việc rồi', 400);
    }
    
    // Fetch all employees — phải đang hoạt động và cùng chi nhánh
    const employees = await Employee.find({ _id: { $in: employeeIds }, Status: 'Đang hoạt động' });
    
    if (employees.length !== employeeIds.length) {
      return sendError(res, 'Một hoặc nhiều employee ID không hợp lệ hoặc nhân viên không hoạt động', 400);
    }
    
    const invalidEmployees = employees.filter(emp => 
      emp.ID_Branch.toString() !== storeTask.storeId._id.toString()
    );
    if (invalidEmployees.length > 0) {
      return sendError(res, 
        `Nhân viên phải thuộc chi nhánh này. Không hợp lệ: ${invalidEmployees.map(e => e.FullName).join(', ')}`, 
        400
      );
    }
    
    // employee[0] = người phụ trách chính (primary contact)
    // Sắp xếp employees theo thứ tự employeeIds để đảm bảo [0] đúng
    const orderedEmployees = employeeIds.map(id => employees.find(e => e._id.toString() === id.toString())).filter(Boolean);
    const assignedPerson = orderedEmployees[0];
    if (!assignedPerson) {
      return sendError(res, 'Người phụ trách chính (employee[0]) không hợp lệ', 400);
    }
    
    const broadcast = storeTask.broadcastId;
    
    // Template checklist từ broadcast
    const checklistTemplate = broadcast.checklist.map(item => ({
      task: item.task,
      note: item.note || '',
      required: item.required,
      isCompleted: false,
      assignedTo: null,
      reviewStatus: null
    }));
    
    // Cập nhật StoreTask — TẤT CẢ đều là người phụ trách
    storeTask.assignedPersonId = assignedPerson._id;
    storeTask.assignedEmployees = orderedEmployees.map(e => e._id);
    storeTask.status = 'assigned';
    await storeTask.save();

    // Tạo UserTask cho TẤT CẢ người phụ trách — mỗi người có bản checklist đầy đủ riêng
    const userTaskDocs = orderedEmployees.map(emp => ({
      storeTaskId: storeTask._id,
      broadcastId: broadcast._id,
      employeeId: emp._id,
      checklist: checklistTemplate.map(i => ({ ...i })),
      evidences: [],
      status: 'assigned'
    }));
    const createdUserTasks = await UserTask.insertMany(userTaskDocs);
    const primaryUserTask = createdUserTasks[0];
    
    // Thông báo cho người phụ trách chính
    await notificationService.notifyTaskAssigned(assignedPerson._id, primaryUserTask, broadcast);

    // Thông báo cho các đồng phụ trách còn lại
    if (orderedEmployees.length > 1) {
      await notificationService.sendToMultiple(
        orderedEmployees.slice(1).map(e => e._id),
        'task_assigned',
        'Bạn được giao phụ trách công việc',
        `"${broadcast.title}" — Đồng phụ trách với: ${assignedPerson.FullName}`,
        { storeTaskId: storeTask._id, broadcastId: broadcast._id }
      );
    }

    await storeTask.populate([
      { path: 'assignedPersonId', select: 'FullName Phone' },
      { path: 'assignedEmployees', select: 'FullName Phone' }
    ]);
    
    return sendSuccess(res, 'Giao việc thành công', { 
      storeTask,
      userTasks: createdUserTasks.map(ut => ({
        _id: ut._id,
        employeeId: ut.employeeId,
        status: ut.status,
        checklistItems: ut.checklist.length
      })),
      assignedPerson: {
        _id: assignedPerson._id,
        name: assignedPerson.FullName
      },
      totalPersonsInCharge: orderedEmployees.length
    });
  } catch (error) {
    console.error('assignEmployees error:', error);
    return sendError(res, error.message, 500);
  }
};

/**
 * @route   GET /api/store-tasks/:id/messages
 * @desc    Lấy tin nhắn của task (chỉ thành viên nhóm)
 * @access  Private (admin, manager, employee)
 */
const getTaskMessages = async (req, res) => {
  try {
    const { id } = req.params;
    const currentUser = req.user;

    const storeTask = await StoreTask.findById(id)
      .select('assignedPersonId assignedEmployees messages');
    if (!storeTask) {
      return sendError(res, 'Không tìm thấy task', 404);
    }

    const isInTeam =
      storeTask.assignedPersonId?.toString() === currentUser._id.toString() ||
      storeTask.assignedEmployees.some(empId => empId.toString() === currentUser._id.toString());
    if (!isInTeam) {
      return sendError(res, 'Bạn không thuộc nhóm thực hiện task này', 403);
    }

    // 50 tin nhắn mới nhất, sắp xếp cũ → mới
    const messages = (storeTask.messages || [])
      .slice()
      .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt))
      .slice(-50);

    return sendSuccess(res, 'Messages fetched', { messages, total: storeTask.messages.length });
  } catch (error) {
    console.error('getTaskMessages error:', error);
    return sendError(res, error.message, 500);
  }
};

/**
 * @route   POST /api/store-tasks/:id/messages
 * @desc    Gửi tin nhắn trong task (chỉ thành viên nhóm)
 * @access  Private (admin, manager, employee)
 */
const addTaskMessage = async (req, res) => {
  try {
    const { id } = req.params;
    const { text } = req.body;
    const currentUser = req.user;

    if (!text || !text.trim()) {
      return sendError(res, 'Nội dung tin nhắn không được để trống', 400);
    }
    if (text.trim().length > 1000) {
      return sendError(res, 'Tin nhắn không được quá 1000 ký tự', 400);
    }

    const storeTask = await StoreTask.findById(id)
      .select('assignedPersonId assignedEmployees');
    if (!storeTask) {
      return sendError(res, 'Không tìm thấy task', 404);
    }

    const isInTeam =
      storeTask.assignedPersonId?.toString() === currentUser._id.toString() ||
      storeTask.assignedEmployees.some(empId => empId.toString() === currentUser._id.toString());
    if (!isInTeam) {
      return sendError(res, 'Bạn không thuộc nhóm thực hiện task này', 403);
    }

    const messageData = {
      senderId: currentUser._id,
      senderName: currentUser.FullName,
      text: text.trim(),
      createdAt: new Date()
    };

    const updated = await StoreTask.findByIdAndUpdate(
      id,
      { $push: { messages: messageData } },
      { new: true, select: 'messages' }
    );
    const newMessage = updated.messages[updated.messages.length - 1];

    return sendSuccess(res, 'Tin nhắn đã được gửi', { message: newMessage });
  } catch (error) {
    console.error('addTaskMessage error:', error);
    return sendError(res, error.message, 500);
  }
};

module.exports = {
  getStoreTasks,
  getStoreTaskById,
  assignEmployees,
  getTaskMessages,
  addTaskMessage
};
