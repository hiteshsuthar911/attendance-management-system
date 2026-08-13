const mongoose = require('mongoose');

const attendanceSchema = new mongoose.Schema({
  lecture: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Lecture',
    required: true
  },
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  department: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Department',
    required: true
  },
  branch: {
    type: String,
    required: true
  },
  batch: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: ['present', 'absent'],
    required: true
  },
  markedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  date: {
    type: Date,
    default: Date.now
  }
});

// Ensure a student has only one attendance record per lecture session
attendanceSchema.index({ lecture: 1, student: 1 }, { unique: true });

module.exports = mongoose.model('Attendance', attendanceSchema);
