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
      const adminDeptIds = req.user.departments.map(d => (d._id || d).toString());
      if (role === 'admin') {
        // Admin can see themselves
        filter._id = req.user._id;
      } else if (role === 'faculty') {
        // Faculty belonging to admin's department(s) or general faculty
        if (departmentId) {
          filter.departments = departmentId;
        } else if (adminDeptIds.length > 0) {
          filter.$or = [
            { departments: { $in: adminDeptIds } },
            { departments: { $size: 0 } },
            { departments: { $exists: false } }
          ];
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
    const { name, email, password, departmentIds, departments } = req.body;
    if (!name || !email) {
      return res.status(400).json({ success: false, message: 'Name and email are required.' });
    }

    const cleanEmail = email.trim().toLowerCase();
    const existingUser = await User.findOne({ email: cleanEmail });
    if (existingUser) {
      return res.status(400).json({ success: false, message: 'A user with this email address already exists.' });
    }

    const rawDepts = departmentIds || departments;
    let deptsToAssign = Array.isArray(rawDepts)
      ? rawDepts.filter(id => id && typeof id === 'string' && id.trim().length > 0)
      : [];

    // If created by Admin and none specified, default to admin's own departments
    if (req.user.role === 'admin') {
      const adminDeptIds = req.user.departments.map(d => (d._id || d).toString());
      if (deptsToAssign.length === 0) {
        deptsToAssign = adminDeptIds;
      }
    }

    const faculty = await User.create({
      name: name.trim(),
      email: cleanEmail,
      password: password && password.trim() ? password.trim() : 'faculty123',
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
    if (!name || !email || !rollNumber || !branch || !batch || !departmentId) {
      return res.status(400).json({
        success: false,
        message: 'Name, email, rollNumber, branch, batch, and departmentId are required for student creation.'
      });
    }

    const cleanEmail = email.trim().toLowerCase();
    const existingUser = await User.findOne({ email: cleanEmail });
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

    // Auto-generate password from email username before @ symbol (e.g. 1032251654@tcetmumbai.in -> 1032251654)
    const emailPrefix = cleanEmail.includes('@') ? cleanEmail.split('@')[0] : cleanEmail;
    const finalPassword = (password && password.trim()) ? password.trim() : emailPrefix;

    const student = await User.create({
      name: name.trim(),
      email: cleanEmail,
      password: finalPassword,
      role: 'student',
      departments: [departmentId],
      studentDetails: {
        rollNumber: rollNumber.trim().toUpperCase(),
        branch: branch.trim().toUpperCase(),
        batch: batch.trim(),
        department: departmentId
      }
    });

    const populatedStudent = await User.findById(student._id).select('-password').populate('departments').populate('studentDetails.department');
    res.status(201).json({ success: true, message: 'Student created successfully.', user: populatedStudent });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to create student.', error: error.message });
  }
});

// General Create User (Superadmin & Admin)
router.post('/', verifyToken, authorizeRoles('superadmin', 'admin'), async (req, res) => {
  try {
    const { name, email, password, role, rollNumber, branch, batch, departmentId, departments, departmentIds, studentDetails } = req.body;
    const cleanEmail = (email || '').trim().toLowerCase();

    if (!name || !cleanEmail || !role) {
      return res.status(400).json({ success: false, message: 'Name, email, and role are required.' });
    }

    const existingUser = await User.findOne({ email: cleanEmail });
    if (existingUser) {
      return res.status(400).json({ success: false, message: 'User with this email already exists.' });
    }

    const emailPrefix = cleanEmail.includes('@') ? cleanEmail.split('@')[0] : cleanEmail;
    const finalPassword = (password && password.trim()) ? password.trim() : (role === 'student' ? emailPrefix : (role === 'faculty' ? 'faculty123' : 'admin123'));

    // Parse departments array properly
    let deptsList = [];
    if (Array.isArray(departments) && departments.length > 0) {
      deptsList = departments.filter(d => d && typeof d === 'string' && d.trim().length > 0);
    } else if (Array.isArray(departmentIds) && departmentIds.length > 0) {
      deptsList = departmentIds.filter(d => d && typeof d === 'string' && d.trim().length > 0);
    } else if (departmentId && typeof departmentId === 'string' && departmentId.trim().length > 0) {
      deptsList = [departmentId.trim()];
    }

    // If Admin creates faculty and didn't explicitly select, assign admin's departments
    if (role === 'faculty' && deptsList.length === 0 && req.user.role === 'admin' && req.user.departments.length > 0) {
      deptsList = req.user.departments.map(d => (d._id || d).toString());
    }

    const sDetails = studentDetails || {};
    const sRoll = rollNumber || sDetails.rollNumber || '';
    const sBranch = branch || sDetails.branch || 'SD';
    const sBatch = batch || sDetails.batch || 'Batch-1';
    const sDept = (deptsList.length > 0) ? deptsList[0] : (departmentId || sDetails.department || null);

    const user = await User.create({
      name: name.trim(),
      email: cleanEmail,
      password: finalPassword,
      role,
      departments: deptsList,
      studentDetails: role === 'student' ? {
        rollNumber: sRoll.trim().toUpperCase(),
        branch: sBranch.trim().toUpperCase(),
        batch: sBatch.trim(),
        department: sDept
      } : undefined
    });

    const populated = await User.findById(user._id).select('-password').populate('departments').populate('studentDetails.department');
    res.status(201).json({ success: true, message: `${role} created successfully.`, user: populated });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message || 'Failed to create user.' });
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

// Bulk Enroll Students (Superadmin and Admin)
router.post('/bulk-students', verifyToken, authorizeRoles('superadmin', 'admin'), async (req, res) => {
  try {
    const { students, defaultDepartmentId, defaultBranch, defaultBatch, defaultPassword } = req.body;

    if (!Array.isArray(students) || students.length === 0) {
      return res.status(400).json({ success: false, message: 'No student data provided in array.' });
    }

    const created = [];
    const skipped = [];

    for (let i = 0; i < students.length; i++) {
      const s = students[i];
      const name = (s.name || '').trim();
      const email = (s.email || '').trim().toLowerCase();
      const rollNumber = (s.rollNumber || s.roll || '').trim().toUpperCase();
      const branch = (s.branch || defaultBranch || 'SD').trim().toUpperCase();
      const batch = (s.batch || defaultBatch || 'Batch-1').trim();
      // Auto-generate password from email username before @ symbol (e.g. 1032251654@tcetmumbai.in -> 1032251654)
      const emailPrefix = email.includes('@') ? email.split('@')[0] : email;
      const pass = (s.password && s.password.trim()) ? s.password.trim() : (defaultPassword || emailPrefix || 'student123');

      if (!name || !email) {
        skipped.push({ row: i + 1, name, email, rollNumber, reason: 'Missing name or email address' });
        continue;
      }

      // Check if user with this email already exists
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        skipped.push({ row: i + 1, name, email, rollNumber, reason: 'Email already exists in system' });
        continue;
      }

      try {
        const studentUser = await User.create({
          name,
          email,
          password: pass,
          role: 'student',
          departments: departmentId ? [departmentId] : [],
          studentDetails: {
            rollNumber,
            branch,
            batch,
            department: departmentId
          }
        });
        created.push({ id: studentUser._id, name: studentUser.name, email: studentUser.email, rollNumber });
      } catch (err) {
        skipped.push({ row: i + 1, name, email, rollNumber, reason: err.message || 'Failed to insert' });
      }
    }

    res.json({
      success: true,
      message: `Bulk enrollment completed. Enrolled: ${created.length}, Skipped: ${skipped.length}`,
      count: created.length,
      created,
      skipped
    });
  } catch (error) {
    console.error('Error in bulk student enrollment:', error);
    res.status(500).json({ success: false, message: 'Server error during bulk enrollment.', error: error.message });
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

