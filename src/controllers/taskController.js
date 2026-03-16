const Task = require('../models/Task');
const Project = require('../models/Project');
const { sendResponse, sendError } = require('../utils/responseHandler');

// @desc    Get all tasks
// @route   GET /api/tasks
// @access  Private
exports.getTasks = async (req, res, next) => {
  try {
    const { status, priority, project, assignedTo } = req.query;
    let query = { isActive: true };

    if (status) query.status = status;
    if (priority) query.priority = priority;
    if (project) query.project = project;
    if (assignedTo) query.assignedTo = assignedTo;

    const tasks = await Task.find(query)
      .populate('project', 'name')
      .populate('assignedTo', 'name email')
      .populate('createdBy', 'name email')
      .sort('-createdAt');

    sendResponse(res, {
      success: true,
      count: tasks.length,
      tasks
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single task
// @route   GET /api/tasks/:id
// @access  Private
exports.getTask = async (req, res, next) => {
  try {
    const task = await Task.findById(req.params.id)
      .populate('project', 'name status')
      .populate('assignedTo', 'name email avatar')
      .populate('createdBy', 'name email')
      .populate('comments.user', 'name email');

    if (!task) {
      return sendError(res, 'Task not found', 404);
    }

    sendResponse(res, {
      success: true,
      task
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create task
// @route   POST /api/tasks
// @access  Private
exports.createTask = async (req, res, next) => {
  try {
    // Check if project exists
    const project = await Project.findById(req.body.project);
    if (!project) {
      return sendError(res, 'Project not found', 404);
    }

    // Add creator to request body
    req.body.createdBy = req.user.id;

    const task = await Task.create(req.body);

    sendResponse(res, {
      success: true,
      task
    }, 201);
  } catch (error) {
    next(error);
  }
};

// @desc    Update task
// @route   PUT /api/tasks/:id
// @access  Private
exports.updateTask = async (req, res, next) => {
  try {
    let task = await Task.findById(req.params.id);

    if (!task) {
      return sendError(res, 'Task not found', 404);
    }

    task = await Task.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });

    sendResponse(res, {
      success: true,
      task
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete task
// @route   DELETE /api/tasks/:id
// @access  Private
exports.deleteTask = async (req, res, next) => {
  try {
    const task = await Task.findById(req.params.id);

    if (!task) {
      return sendError(res, 'Task not found', 404);
    }

    await Task.findByIdAndUpdate(req.params.id, { isActive: false });

    sendResponse(res, {
      success: true,
      message: 'Task deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Add comment to task
// @route   POST /api/tasks/:id/comments
// @access  Private
exports.addComment = async (req, res, next) => {
  try {
    const task = await Task.findById(req.params.id);

    if (!task) {
      return sendError(res, 'Task not found', 404);
    }

    task.comments.push({
      user: req.user.id,
      text: req.body.text
    });

    await task.save();

    sendResponse(res, {
      success: true,
      task
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update task status
// @route   PATCH /api/tasks/:id/status
// @access  Private
exports.updateTaskStatus = async (req, res, next) => {
  try {
    const task = await Task.findByIdAndUpdate(
      req.params.id,
      { status: req.body.status },
      { new: true, runValidators: true }
    );

    if (!task) {
      return sendError(res, 'Task not found', 404);
    }

    sendResponse(res, {
      success: true,
      task
    });
  } catch (error) {
    next(error);
  }
};
