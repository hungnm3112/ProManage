const Project = require('../models/Project');
const { sendResponse, sendError } = require('../utils/responseHandler');

// @desc    Get all projects
// @route   GET /api/projects
// @access  Private
exports.getProjects = async (req, res, next) => {
  try {
    const { status, priority, search } = req.query;
    let query = { isActive: true };

    // Filter by status
    if (status) {
      query.status = status;
    }

    // Filter by priority
    if (priority) {
      query.priority = priority;
    }

    // Search by name or description
    if (search) {
      query.$text = { $search: search };
    }

    const projects = await Project.find(query)
      .populate('owner', 'name email')
      .populate('team.user', 'name email')
      .sort('-createdAt');

    sendResponse(res, {
      success: true,
      count: projects.length,
      projects
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single project
// @route   GET /api/projects/:id
// @access  Private
exports.getProject = async (req, res, next) => {
  try {
    const project = await Project.findById(req.params.id)
      .populate('owner', 'name email')
      .populate('team.user', 'name email')
      .populate('tasks');

    if (!project) {
      return sendError(res, 'Project not found', 404);
    }

    sendResponse(res, {
      success: true,
      project
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create project
// @route   POST /api/projects
// @access  Private
exports.createProject = async (req, res, next) => {
  try {
    // Add owner to request body
    req.body.owner = req.user.id;

    const project = await Project.create(req.body);

    sendResponse(res, {
      success: true,
      project
    }, 201);
  } catch (error) {
    next(error);
  }
};

// @desc    Update project
// @route   PUT /api/projects/:id
// @access  Private
exports.updateProject = async (req, res, next) => {
  try {
    let project = await Project.findById(req.params.id);

    if (!project) {
      return sendError(res, 'Project not found', 404);
    }

    // Make sure user is project owner
    if (project.owner.toString() !== req.user.id && req.user.role !== 'admin') {
      return sendError(res, 'Not authorized to update this project', 403);
    }

    project = await Project.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });

    sendResponse(res, {
      success: true,
      project
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete project
// @route   DELETE /api/projects/:id
// @access  Private
exports.deleteProject = async (req, res, next) => {
  try {
    const project = await Project.findById(req.params.id);

    if (!project) {
      return sendError(res, 'Project not found', 404);
    }

    // Make sure user is project owner
    if (project.owner.toString() !== req.user.id && req.user.role !== 'admin') {
      return sendError(res, 'Not authorized to delete this project', 403);
    }

    await Project.findByIdAndUpdate(req.params.id, { isActive: false });

    sendResponse(res, {
      success: true,
      message: 'Project deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Add team member to project
// @route   POST /api/projects/:id/team
// @access  Private
exports.addTeamMember = async (req, res, next) => {
  try {
    const project = await Project.findById(req.params.id);

    if (!project) {
      return sendError(res, 'Project not found', 404);
    }

    // Check if user is already a team member
    const isMember = project.team.some(
      member => member.user.toString() === req.body.userId
    );

    if (isMember) {
      return sendError(res, 'User is already a team member', 400);
    }

    project.team.push({
      user: req.body.userId,
      role: req.body.role || 'member'
    });

    await project.save();

    sendResponse(res, {
      success: true,
      project
    });
  } catch (error) {
    next(error);
  }
};
