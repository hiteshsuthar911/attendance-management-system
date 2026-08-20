const mongoose = require('mongoose');

const academicProgramSchema = new mongoose.Schema({
  degree: {
    type: String,
    required: true,
    trim: true,
    uppercase: true // e.g. B.VOC, B.TECH, B.E., M.TECH, MCA
  },
  branchName: {
    type: String,
    required: true,
    trim: true // e.g. Software Development, Computer Engineering
  },
  branchCode: {
    type: String,
    required: true,
    trim: true,
    uppercase: true // e.g. SD, COMP, IT, AI-DS
  },
  department: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Department'
  },
  durationYears: {
    type: Number,
    default: 4
  },
  sections: [{
    type: String,
    trim: true
  }],
  batches: [{
    type: String,
    trim: true
  }],
  status: {
    type: String,
    enum: ['active', 'inactive'],
    default: 'active'
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Compound unique index for degree + branchCode
academicProgramSchema.index({ degree: 1, branchCode: 1 }, { unique: true });

module.exports = mongoose.model('AcademicProgram', academicProgramSchema);
