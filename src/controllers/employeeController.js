/**
 * Employee Controller
 * 
 * Quản lý CRUD operations cho Employee
 */

const Employee = require('../models/Employee');
const { hashPassword, generateSalt } = require('../helpers/authHelper');
const { sendResponse, sendError } = require('../utils/responseHandler');

/**
 * @route   GET /api/employees
 * @desc    Get all employees with filtering
 * @access  Private (Admin, Manager)
 * @query   role, branchId, status, search, page, limit
 */
exports.getEmployees = async (req, res, next) => {
  try {
    const {
      role,
      branchId,
      status,
      search,
      page = 1,
      limit = 20
    } = req.query;

    // Build query
    const query = {};

    // Filter by status
    if (status) {
      query.Status = status;
    }

    // Filter by branch (for managers - only see their branch)
    if (req.user.role === 'manager') {
      query.ID_Branch = req.user.branchId;
    } else if (branchId) {
      query.ID_Branch = branchId;
    }

    // Search by name or phone
    if (search) {
      query.$or = [
        { FullName: { $regex: search, $options: 'i' } },
        { Phone: { $regex: search, $options: 'i' } },
        { Email: { $regex: search, $options: 'i' } }
      ];
    }

    // Pagination
    const skip = (page - 1) * limit;

    // Execute query with population
    let employees = await Employee.find(query)
      .populate('ID_GroupUser', 'Name Description')
      .populate('ID_Branch', 'Name Map_Address Phone')
      .limit(parseInt(limit))
      .skip(skip)
      .sort({ createdAt: -1 });

    // Filter by role if specified (requires GroupUser lookup)
    if (role) {
      const { getEmployeeRole } = require('../helpers/authHelper');
      const filteredEmployees = [];
      
      for (const emp of employees) {
        const empRole = await getEmployeeRole(emp);
        if (empRole === role) {
          filteredEmployees.push(emp);
        }
      }
      employees = filteredEmployees;
    }

    // Get total count
    const total = await Employee.countDocuments(query);

    sendResponse(res, {
      success: true,
      data: employees,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });

  } catch (error) {
    next(error);
  }
};

/**
 * @route   GET /api/employees/:id
 * @desc    Get employee by ID
 * @access  Private
 */
exports.getEmployeeById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const employee = await Employee.findById(id)
      .populate('ID_GroupUser', 'Name Description Status')
      .populate('ID_Branch', 'Name Map_Address Phone Active');

    if (!employee) {
      return sendError(res, 'Không tìm thấy nhân viên', 404);
    }

    // Check authorization (managers can only see their branch employees)
    if (req.user.role === 'manager') {
      if (employee.ID_Branch._id.toString() !== req.user.branchId.toString()) {
        return sendError(res, 'Không có quyền xem nhân viên này', 403);
      }
    }

    sendResponse(res, {
      success: true,
      data: employee
    });

  } catch (error) {
    next(error);
  }
};

/**
 * @route   POST /api/employees
 * @desc    Create new employee
 * @access  Private (Admin only)
 */
exports.createEmployee = async (req, res, next) => {
  try {
    const {
      Phone,
      FullName,
      Email,
      Password,
      ID_GroupUser,
      ID_Branch,
      CMND,
      Birthday,
      Address,
      Gender,
      Level,
      TaxCode,
      Salary,
      DateOnCompany
    } = req.body;

    // Check if phone already exists
    const existingEmployee = await Employee.findOne({ Phone });
    if (existingEmployee) {
      return sendError(res, 'Số điện thoại đã được sử dụng', 400);
    }

    // Generate salt and hash password
    const salt = generateSalt();
    const hashedPassword = hashPassword(Password, salt);

    // Create employee
    const employee = await Employee.create({
      Phone,
      FullName,
      Email,
      Password: hashedPassword,
      Salt: salt,
      ID_GroupUser,
      ID_Branch,
      CMND,
      Birthday,
      Address,
      Gender,
      Level,
      TaxCode,
      Salary,
      DateOnCompany,
      Status: 'Đang hoạt động' // Default active status
    });

    // Populate references
    await employee.populate('ID_GroupUser', 'Name Description');
    await employee.populate('ID_Branch', 'Name Map_Address Phone');

    sendResponse(res, {
      success: true,
      message: 'Tạo nhân viên thành công',
      data: employee
    }, 201);

  } catch (error) {
    next(error);
  }
};

/**
 * @route   PUT /api/employees/:id
 * @desc    Update employee
 * @access  Private (Admin only)
 */
exports.updateEmployee = async (req, res, next) => {
  try {
    const { id } = req.params;
    const {
      Phone,
      FullName,
      Email,
      Password,
      ID_GroupUser,
      ID_Branch,
      CMND,
      Birthday,
      Address,
      Gender,
      Level,
      TaxCode,
      Salary,
      DateOnCompany,
      Image
    } = req.body;

    // Find employee
    const employee = await Employee.findById(id).select('+Password +Salt');
    if (!employee) {
      return sendError(res, 'Không tìm thấy nhân viên', 404);
    }

    // Check if phone is being changed and is already used
    if (Phone && Phone !== employee.Phone) {
      const existingEmployee = await Employee.findOne({ Phone });
      if (existingEmployee) {
        return sendError(res, 'Số điện thoại đã được sử dụng', 400);
      }
      employee.Phone = Phone;
    }

    // Update fields
    if (FullName) employee.FullName = FullName;
    if (Email) employee.Email = Email;
    if (ID_GroupUser) employee.ID_GroupUser = ID_GroupUser;
    if (ID_Branch) employee.ID_Branch = ID_Branch;
    if (CMND) employee.CMND = CMND;
    if (Birthday) employee.Birthday = Birthday;
    if (Address) employee.Address = Address;
    if (Gender) employee.Gender = Gender;
    if (Level) employee.Level = Level;
    if (TaxCode) employee.TaxCode = TaxCode;
    if (Salary) employee.Salary = Salary;
    if (DateOnCompany) employee.DateOnCompany = DateOnCompany;
    if (Image) employee.Image = Image;

    // Update password if provided
    if (Password) {
      const salt = generateSalt();
      employee.Password = hashPassword(Password, salt);
      employee.Salt = salt;
    }

    await employee.save();

    // Populate references
    await employee.populate('ID_GroupUser', 'Name Description');
    await employee.populate('ID_Branch', 'Name Map_Address Phone');

    sendResponse(res, {
      success: true,
      message: 'Cập nhật nhân viên thành công',
      data: employee
    });

  } catch (error) {
    next(error);
  }
};

/**
 * @route   PATCH /api/employees/:id/status
 * @desc    Update employee status (toggle active/inactive)
 * @access  Private (Admin only)
 */
exports.updateEmployeeStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    // Validate status
    const validStatuses = ['Đang hoạt động', 'Đã dừng', 'Đã nghỉ việc'];
    if (!status || !validStatuses.includes(status)) {
      return sendError(res, `Status phải là một trong: ${validStatuses.join(', ')}`, 400);
    }

    // Find and update employee
    const employee = await Employee.findByIdAndUpdate(
      id,
      { Status: status },
      { new: true }
    )
      .populate('ID_GroupUser', 'Name Description')
      .populate('ID_Branch', 'Name Map_Address Phone');

    if (!employee) {
      return sendError(res, 'Không tìm thấy nhân viên', 404);
    }

    sendResponse(res, {
      success: true,
      message: `Đã chuyển trạng thái nhân viên sang: ${status}`,
      data: employee
    });

  } catch (error) {
    next(error);
  }
};

/**
 * @route   DELETE /api/employees/:id
 * @desc    Soft delete employee (change status to 'Đã nghỉ việc')
 * @access  Private (Admin only)
 */
exports.deleteEmployee = async (req, res, next) => {
  try {
    const { id } = req.params;

    const employee = await Employee.findByIdAndUpdate(
      id,
      { Status: 'Đã nghỉ việc' },
      { new: true }
    );

    if (!employee) {
      return sendError(res, 'Không tìm thấy nhân viên', 404);
    }

    sendResponse(res, {
      success: true,
      message: 'Đã xóa nhân viên (soft delete)',
      data: employee
    });

  } catch (error) {
    next(error);
  }
};
