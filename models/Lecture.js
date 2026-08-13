const mongoose = require('mongoose');

const lectureSchema = new mongoose.Schema({
  subject: {
    type: String,
    required: true,
    trim: true
  },
  department: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Department',
    required: true
  },
  branch: {
    type: String,
    required: true,
    trim: true
  },
  batch: {
    type: String,
    required: true,
    trim: true
  },
  faculty: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: false
  },
  substituteFaculty: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  date: {
    type: Date,
    default: Date.now
  },
  timeSlot: {
    type: String,
    required: true,
    trim: true
  },
  status: {
    type: String,
    enum: ['scheduled', 'completed', 'canceled'],
    default: 'scheduled'
  },
  remarks: {
    type: String,
    default: ''
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Lecture', lectureSchema);
