const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Department = require('../models/Department');
const { verifyToken, authorizeRoles } = require('../middleware/authMiddleware');

// Get list of users filtered by role, department, branch, etc.
router.get('/', verifyToken, authorizeRoles('superadmin', 'admin', 'faculty'), async (req, res) => {
  try {
    const { role, departmentId, branch, batch } = req.query;
    let filter = {};

    if (role) {
      filter.role = role;
    }

    // Role-based visibility scoping
    if (req.user.role === 'admin') {
      const adminDeptIds = req.user.departments.map(d => d._id || d);
      if (role === 'admin') {
        // Admin can see themselves
        filter._id = req.user._id;
      } else if (role === 'faculty') {
        // Faculty belonging to admin's department(s)
        if (departmentId) {
          filter.departments = departmentId;
        } else if (adminDeptIds.length > 0) {
          filter.departments = { $in: adminDeptIds };
        }
      } else if (role === 'student') {
        // Student in admin's department(s)
        if (departmentId) {
          filter['studentDetails.department'] = departmentId;
        } else if (adminDeptIds.length > 0) {
          filter['studentDetails.department'] = { $in: adminDeptIds };
        }
      }
    } else if (req.user.role === 'faculty') {
      const facultyDeptIds = req.user.departments.map(d => d._id || d);
      if (role === 'student') {
        if (departmentId) {
          filter['studentDetails.department'] = departmentId;
        } else if (facultyDeptIds.length > 0) {
          filter['studentDetails.department'] = { $in: facultyDeptIds };
        }
      }
    }

    // Additional query filters
    if (departmentId && req.user.role === 'superadmin') {
      if (role === 'student') {
        filter['studentDetails.department'] = departmentId;
      } else {
        filter.departments = departmentId;
      }
    }

    if (branch && role === 'student') {
      filter['studentDetails.branch'] = new RegExp(`^${branch}$`, 'i');
    }

    if (batch && role === 'student') {
      filter['studentDetails.batch'] = new RegExp(`^${batch}$`, 'i');
    }

    const users = await User.find(filter)
      .select('-password')
      .populate('departments')
      .populate('studentDetails.department')
      .sort({ createdAt: -1 });

    res.json({ success: true, count: users.length, users });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch users.', error: error.message });
  }
});

// Create Admin (Superadmin only)
router.post('/admin', verifyToken, authorizeRoles('superadmin'), async (req, res) => {
  try {
    const { name, email, password, departmentIds } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ success: false, message: 'Name, email, and password are required.' });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ success: false, message: 'A user with this email address already exists.' });
    }

    const validDeptIds = Array.isArray(departmentIds)
      ? departmentIds.filter(id => id && typeof id === 'string' && id.trim().length > 0)
      : [];

    const admin = await User.create({
      name,
      email,
      password,
      role: 'admin',
      departments: validDeptIds
    });

    const populatedAdmin = await User.findById(admin._id).select('-password').populate('departments');
    res.status(201).json({ success: true, message: 'Admin created successfully.', user: populatedAdmin });
  } catch (error) {
    console.error('[Create Admin Error]:', error);
    res.status(500).json({ success: false, message: error.message || 'Failed to create admin.' });
  }
});

// Create Faculty (Superadmin & Admin)
router.post('/faculty', verifyToken, authorizeRoles('superadmin', 'admin'), async (req, res) => {
  try {
    const { name, email, password, departmentIds } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ success: false, message: 'Name, email, and password are required.' });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ success: false, message: 'A user with this email address already exists.' });
    }

    let deptsToAssign = Array.isArray(departmentIds)
      ? departmentIds.filter(id => id && typeof id === 'string' && id.trim().length > 0)
      : [];

    // If created by Admin, verify department access if specified
    if (req.user.role === 'admin') {
      const adminDeptIds = req.user.departments.map(d => (d._id || d).toString());
      if (deptsToAssign.length === 0) {
        deptsToAssign = adminDeptIds;
      } else {
        const isValid = deptsToAssign.every(id => adminDeptIds.includes(id.toString()));
        if (!isValid) {
          return res.status(403).json({ success: false, message: 'You can only assign faculty to your own managed department(s).' });
        }
      }
    }

    const faculty = await User.create({
      name,
      email,
      password,
      role: 'faculty',
      departments: deptsToAssign
    });

    const populatedFaculty = await User.findById(faculty._id).select('-password').populate('departments');
    res.status(201).json({ success: true, message: 'Faculty created successfully.', user: populatedFaculty });
  } catch (error) {
    console.error('[Create Faculty Error]:', error);
    res.status(500).json({ success: false, message: error.message || 'Failed to create faculty.' });
  }
});


// Create Student (Superadmin & Admin)
router.post('/student', verifyToken, authorizeRoles('superadmin', 'admin'), async (req, res) => {
  try {
    const { name, email, password, rollNumber, branch, batch, departmentId } = req.body;
    if (!name || !email || !password || !rollNumber || !branch || !batch || !departmentId) {
      return res.status(400).json({
        success: false,
        message: 'Name, email, password, rollNumber, branch, batch, and departmentId are required for student creation.'
      });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ success: false, message: 'User with this email already exists.' });
    }

    // Verify department access if Admin
    if (req.user.role === 'admin') {
      const adminDeptIds = req.user.departments.map(d => (d._id || d).toString());
      if (!adminDeptIds.includes(departmentId.toString())) {
        return res.status(403).json({ success: false, message: 'You can only create students in your managed department.' });
      }
    }

    const student = await User.create({
      name,
      email,
      password,
      role: 'student',
      departments: [departmentId],
      studentDetails: {
        rollNumber,
        branch,
        batch,
        department: departmentId
      }
    });

    const populatedStudent = await User.findById(student._id).select('-password').populate('departments').populate('studentDetails.department');
    res.status(201).json({ success: true, message: 'Student created successfully.', user: populatedStudent });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to create student.', error: error.message });
  }
});

// Assign/Update User Departments (e.g., assign Faculty to additional department)
router.put('/:id/departments', verifyToken, authorizeRoles('superadmin', 'admin'), async (req, res) => {
  try {
    const { departmentIds } = req.body;
    const userToUpdate = await User.findById(req.params.id);
    if (!userToUpdate) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    if (Array.isArray(departmentIds)) {
      userToUpdate.departments = departmentIds;
      await userToUpdate.save();
    }

    const updatedUser = await User.findById(userToUpdate._id).select('-password').populate('departments');
    res.json({ success: true, message: 'User departments updated successfully.', user: updatedUser });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to update user departments.', error: error.message });
  }
});

// Update User details
router.put('/:id', verifyToken, authorizeRoles('superadmin', 'admin'), async (req, res) => {
  try {
    const { name, email, rollNumber, branch, batch, departmentId } = req.body;
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    if (name) user.name = name;
    if (email) user.email = email;

    if (user.role === 'student') {
      if (!user.studentDetails) user.studentDetails = {};
      if (rollNumber) user.studentDetails.rollNumber = rollNumber;
      if (branch) user.studentDetails.branch = branch;
      if (batch) user.studentDetails.batch = batch;
      if (departmentId) {
        user.studentDetails.department = departmentId;
        user.departments = [departmentId];
      }
    }

    await user.save();
    const updatedUser = await User.findById(user._id).select('-password').populate('departments').populate('studentDetails.department');
    res.json({ success: true, message: 'User updated successfully.', user: updatedUser });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to update user.', error: error.message });
  }
});

// Delete user
router.delete('/:id', verifyToken, authorizeRoles('superadmin', 'admin'), async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    if (user.role === 'superadmin') {
      return res.status(403).json({ success: false, message: 'Superadmin account cannot be deleted.' });
    }

    await User.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'User deleted successfully.' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to delete user.', error: error.message });
  }
});

module.exports = router;
