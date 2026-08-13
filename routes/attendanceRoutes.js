const express = require('express');
const router = express.Router();
const Attendance = require('../models/Attendance');
const Lecture = require('../models/Lecture');
const User = require('../models/User');
const { verifyToken, authorizeRoles } = require('../middleware/authMiddleware');

// Get students list for taking attendance for a specific lecture or department/branch/batch
router.get('/students-for-lecture', verifyToken, authorizeRoles('superadmin', 'admin', 'faculty'), async (req, res) => {
  try {
    const { lectureId, departmentId, branch, batch } = req.query;

    let targetDept = departmentId;
    let targetBranch = branch;
    let targetBatch = batch;
    let lecture = null;

    if (lectureId) {
      lecture = await Lecture.findById(lectureId).populate('department').populate('faculty', 'name');
      if (!lecture) {
        return res.status(404).json({ success: false, message: 'Lecture not found.' });
      }
      targetDept = lecture.department._id || lecture.department;
      targetBranch = lecture.branch;
      targetBatch = lecture.batch;
    }

    if (!targetDept || !targetBranch || !targetBatch) {
      return res.status(400).json({
        success: false,
        message: 'Department, branch, and batch are required to list students.'
      });
    }

    // Find all students in this department, branch, and batch
    const students = await User.find({
      role: 'student',
      'studentDetails.department': targetDept,
      'studentDetails.branch': new RegExp(`^${targetBranch}$`, 'i'),
      'studentDetails.batch': new RegExp(`^${targetBatch}$`, 'i')
    }).select('-password').sort({ 'studentDetails.rollNumber': 1, name: 1 });

    // Fetch existing attendance records if lectureId was provided
    let existingAttendanceMap = {};
    if (lectureId) {
      const existingLogs = await Attendance.find({ lecture: lectureId });
      existingLogs.forEach(log => {
        existingAttendanceMap[log.student.toString()] = log.status;
      });
    }

    const formattedStudents = students.map(student => ({
      _id: student._id,
      name: student.name,
      email: student.email,
      rollNumber: student.studentDetails ? student.studentDetails.rollNumber : 'N/A',
      branch: student.studentDetails ? student.studentDetails.branch : targetBranch,
      batch: student.studentDetails ? student.studentDetails.batch : targetBatch,
      status: existingAttendanceMap[student._id.toString()] || 'absent'
    }));

    res.json({
      success: true,
      lecture,
      count: formattedStudents.length,
      students: formattedStudents
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch student list for attendance.', error: error.message });
  }
});

// Submit / Mark Attendance for a lecture
router.post('/mark', verifyToken, authorizeRoles('superadmin', 'admin', 'faculty'), async (req, res) => {
  try {
    const { lectureId, attendanceRecords } = req.body; // attendanceRecords: [{ studentId, status: 'present'|'absent' }]

    if (!lectureId || !Array.isArray(attendanceRecords)) {
      return res.status(400).json({
        success: false,
        message: 'lectureId and an array of attendanceRecords are required.'
      });
    }

    const lecture = await Lecture.findById(lectureId);
    if (!lecture) {
      return res.status(404).json({ success: false, message: 'Lecture not found.' });
    }

    const bulkOps = attendanceRecords.map(rec => ({
      updateOne: {
        filter: { lecture: lectureId, student: rec.studentId },
        update: {
          $set: {
            lecture: lectureId,
            student: rec.studentId,
            department: lecture.department,
            branch: lecture.branch,
            batch: lecture.batch,
            status: rec.status,
            markedBy: req.user._id,
            date: lecture.date || new Date()
          }
        },
        upsert: true
      }
    }));

    if (bulkOps.length > 0) {
      await Attendance.bulkWrite(bulkOps);
    }

    // Mark lecture as completed
    lecture.status = 'completed';
    await lecture.save();

    res.json({
      success: true,
      message: `Attendance marked successfully for ${attendanceRecords.length} students.`,
      lectureStatus: 'completed'
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to record attendance.', error: error.message });
  }
});

// Get logged-in Student's overall attendance (Lecture date, subject, faculty, status)
router.get('/my-attendance', verifyToken, authorizeRoles('student'), async (req, res) => {
  try {
    const studentId = req.user._id;

    // Retrieve all attendance records for this student
    const attendanceLogs = await Attendance.find({ student: studentId })
      .populate({
        path: 'lecture',
        populate: [
          { path: 'faculty', select: 'name email' },
          { path: 'department', select: 'name code' }
        ]
      })
      .populate('markedBy', 'name role')
      .sort({ date: -1 });

    const formattedLogs = attendanceLogs.map(log => {
      const lectureObj = log.lecture || {};
      return {
        id: log._id,
        date: log.date,
        subject: lectureObj.subject || 'N/A',
        timeSlot: lectureObj.timeSlot || 'N/A',
        facultyName: lectureObj.faculty ? lectureObj.faculty.name : 'N/A',
        departmentName: lectureObj.department ? lectureObj.department.name : 'N/A',
        branch: log.branch,
        batch: log.batch,
        status: log.status, // 'present' or 'absent'
        lectureStatus: lectureObj.status || 'completed'
      };
    });

    res.json({
      success: true,
      studentName: req.user.name,
      rollNumber: req.user.studentDetails ? req.user.studentDetails.rollNumber : 'N/A',
      count: formattedLogs.length,
      attendance: formattedLogs
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch student attendance logs.', error: error.message });
  }
});

module.exports = router;
