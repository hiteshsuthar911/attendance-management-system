const express = require('express');
const router = express.Router();
const Lecture = require('../models/Lecture');
const User = require('../models/User');
const { verifyToken, authorizeRoles } = require('../middleware/authMiddleware');

// Get lectures (filtered by user role and department)
router.get('/', verifyToken, async (req, res) => {
  try {
    const { departmentId, branch, batch, date, status } = req.query;
    let filter = {};

    if (req.user.role === 'admin') {
      const adminDeptIds = req.user.departments.map(d => d._id || d);
      if (departmentId) {
        filter.department = departmentId;
      } else if (adminDeptIds.length > 0) {
        filter.department = { $in: adminDeptIds };
      }
    } else if (req.user.role === 'faculty') {
      const facultyDeptIds = req.user.departments.map(d => d._id || d);
      if (departmentId) {
        filter.department = departmentId;
      } else if (facultyDeptIds.length > 0) {
        filter.department = { $in: facultyDeptIds };
      }
    } else if (req.user.role === 'student') {
      if (req.user.studentDetails) {
        if (req.user.studentDetails.department) {
          filter.department = req.user.studentDetails.department;
        }
        if (req.user.studentDetails.branch) {
          filter.branch = new RegExp(`^${req.user.studentDetails.branch}$`, 'i');
        }
        if (req.user.studentDetails.batch) {
          filter.batch = new RegExp(`^${req.user.studentDetails.batch}$`, 'i');
        }
      }
    } else if (departmentId && req.user.role === 'superadmin') {
      filter.department = departmentId;
    }

    if (branch && req.user.role !== 'student') filter.branch = new RegExp(`^${branch}$`, 'i');
    if (batch && req.user.role !== 'student') filter.batch = new RegExp(`^${batch}$`, 'i');
    if (status) filter.status = status;

    if (date) {
      const startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999);
      filter.date = { $gte: startOfDay, $lte: endOfDay };
    }

    const lectures = await Lecture.find(filter)
      .populate('department')
      .populate('faculty', 'name email')
      .populate('substituteFaculty', 'name email')
      .populate('createdBy', 'name email role')
      .sort({ date: -1, timeSlot: 1 });

    res.json({ success: true, count: lectures.length, lectures });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch lectures.', error: error.message });
  }
});

// Create Lecture (Admin & Faculty)
router.post('/', verifyToken, authorizeRoles('superadmin', 'admin', 'faculty'), async (req, res) => {
  try {
    const { subject, departmentId, branch, batch, facultyId, date, timeSlot, remarks } = req.body;

    if (!subject || !departmentId || !branch || !batch || !timeSlot) {
      return res.status(400).json({
        success: false,
        message: 'Subject, departmentId, branch, batch, and timeSlot are required.'
      });
    }

    const assignedFacultyId = (facultyId && typeof facultyId === 'string' && facultyId.trim().length > 0)
      ? facultyId
      : (req.user.role === 'faculty' ? req.user._id : req.user._id);

    const lecture = await Lecture.create({
      subject,
      department: departmentId,
      branch,
      batch,
      faculty: assignedFacultyId,
      date: date ? new Date(date) : new Date(),
      timeSlot,
      remarks,
      createdBy: req.user._id
    });

    const populatedLecture = await Lecture.findById(lecture._id)
      .populate('department')
      .populate('faculty', 'name email')
      .populate('substituteFaculty', 'name email')
      .populate('createdBy', 'name email role');

    res.status(201).json({ success: true, message: 'Lecture created successfully.', lecture: populatedLecture });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to create lecture.', error: error.message });
  }
});

// Assign or Update Substitute Faculty
router.put('/:id/substitute', verifyToken, authorizeRoles('superadmin', 'admin'), async (req, res) => {
  try {
    const { substituteFacultyId } = req.body;
    const lecture = await Lecture.findById(req.params.id);

    if (!lecture) {
      return res.status(404).json({ success: false, message: 'Lecture not found.' });
    }

    lecture.substituteFaculty = (substituteFacultyId && typeof substituteFacultyId === 'string' && substituteFacultyId.trim().length > 0)
      ? substituteFacultyId
      : null;

    await lecture.save();

    const updatedLecture = await Lecture.findById(lecture._id)
      .populate('department')
      .populate('faculty', 'name email')
      .populate('substituteFaculty', 'name email')
      .populate('createdBy', 'name email role');

    res.json({ success: true, message: 'Substitute faculty updated successfully.', lecture: updatedLecture });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to update substitute faculty.', error: error.message });
  }
});

// Update or Cancel lecture
router.put('/:id', verifyToken, authorizeRoles('superadmin', 'admin', 'faculty'), async (req, res) => {
  try {
    const { status, facultyId, remarks, timeSlot, subject, batch, branch, substituteFacultyId } = req.body;
    const lecture = await Lecture.findById(req.params.id);

    if (!lecture) {
      return res.status(404).json({ success: false, message: 'Lecture not found.' });
    }

    if (status) lecture.status = status;
    if (facultyId) lecture.faculty = facultyId;
    if (remarks !== undefined) lecture.remarks = remarks;
    if (timeSlot) lecture.timeSlot = timeSlot;
    if (subject) lecture.subject = subject;
    if (batch) lecture.batch = batch;
    if (branch) lecture.branch = branch;
    if (substituteFacultyId !== undefined) {
      lecture.substituteFaculty = (substituteFacultyId && substituteFacultyId.trim().length > 0) ? substituteFacultyId : null;
    }

    await lecture.save();

    const updatedLecture = await Lecture.findById(lecture._id)
      .populate('department')
      .populate('faculty', 'name email')
      .populate('substituteFaculty', 'name email')
      .populate('createdBy', 'name email role');

    res.json({ success: true, message: 'Lecture updated successfully.', lecture: updatedLecture });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to update lecture.', error: error.message });
  }
});

// Delete lecture
router.delete('/:id', verifyToken, authorizeRoles('superadmin', 'admin'), async (req, res) => {
  try {
    const lecture = await Lecture.findByIdAndDelete(req.params.id);
    if (!lecture) {
      return res.status(404).json({ success: false, message: 'Lecture not found.' });
    }
    res.json({ success: true, message: 'Lecture deleted successfully.' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to delete lecture.', error: error.message });
  }
});

module.exports = router;
