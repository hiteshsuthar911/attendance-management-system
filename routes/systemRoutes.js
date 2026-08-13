const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Department = require('../models/Department');
const Lecture = require('../models/Lecture');
const Attendance = require('../models/Attendance');
const { verifyToken, authorizeRoles } = require('../middleware/authMiddleware');

const MASTER_RESET_PASSWORD = process.env.MASTER_RESET_PASSWORD || 'RESET@2026';

// Verify Reset Access Password Endpoint
router.post('/verify-reset-password', verifyToken, authorizeRoles('superadmin'), async (req, res) => {
  try {
    const { password } = req.body;
    if (!password) {
      return res.status(400).json({ success: false, message: 'Password is required.' });
    }

    const superadminUser = await User.findById(req.user._id);
    let isValid = false;

    if (password === MASTER_RESET_PASSWORD) {
      isValid = true;
    } else if (superadminUser) {
      isValid = await superadminUser.comparePassword(password);
    }

    if (isValid) {
      return res.json({ success: true, message: 'Access granted to system reset portal.' });
    } else {
      return res.status(401).json({ success: false, message: 'Incorrect reset password. Access denied.' });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: 'Password verification failed.', error: error.message });
  }
});

// Superadmin System Reset & Cleanup API Endpoint
router.post('/reset', verifyToken, authorizeRoles('superadmin'), async (req, res) => {
  try {
    const { resetType, confirmText, resetPassword } = req.body;

    if (!resetPassword) {
      return res.status(401).json({ success: false, message: 'Reset authorization password is required.' });
    }

    const superadminUser = await User.findById(req.user._id);
    let isValidPassword = false;

    if (resetPassword === MASTER_RESET_PASSWORD) {
      isValidPassword = true;
    } else if (superadminUser) {
      isValidPassword = await superadminUser.comparePassword(resetPassword);
    }

    if (!isValidPassword) {
      return res.status(401).json({ success: false, message: 'Security validation failed: Incorrect reset password.' });
    }

    if (confirmText !== 'RESET') {
      return res.status(400).json({
        success: false,
        message: 'Security validation failed: Please type RESET in capital letters to confirm.'
      });
    }

    let summary = {
      attendanceCleared: 0,
      lecturesCleared: 0,
      departmentsCleared: 0,
      usersCleared: 0
    };

    if (resetType === 'attendance_only') {
      const attRes = await Attendance.deleteMany({});
      summary.attendanceCleared = attRes.deletedCount;
    } else if (resetType === 'lectures_only') {
      const attRes = await Attendance.deleteMany({});
      const lecRes = await Lecture.deleteMany({});
      summary.attendanceCleared = attRes.deletedCount;
      summary.lecturesCleared = lecRes.deletedCount;
    } else if (resetType === 'users_only') {
      const userRes = await User.deleteMany({ role: { $ne: 'superadmin' } });
      summary.usersCleared = userRes.deletedCount;
    } else if (resetType === 'full_system') {
      const attRes = await Attendance.deleteMany({});
      const lecRes = await Lecture.deleteMany({});
      const deptRes = await Department.deleteMany({});
      const userRes = await User.deleteMany({ role: { $ne: 'superadmin' } });

      summary.attendanceCleared = attRes.deletedCount;
      summary.lecturesCleared = lecRes.deletedCount;
      summary.departmentsCleared = deptRes.deletedCount;
      summary.usersCleared = userRes.deletedCount;
    } else {
      return res.status(400).json({
        success: false,
        message: 'Invalid reset option selected.'
      });
    }

    res.json({
      success: true,
      message: `System reset (${resetType}) completed successfully!`,
      summary
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to reset system data.',
      error: error.message
    });
  }
});

module.exports = router;
