const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  password: {
    type: String,
    required: true
  },
  role: {
    type: String,
    enum: ['superadmin', 'admin', 'faculty', 'student'],
    required: true
  },
  // Multi-department assignment capability for Admins & Faculties
  departments: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Department'
  }],
  // Specific details for students
  studentDetails: {
    rollNumber: { type: String, trim: true },
    branch: { type: String, trim: true },
    batch: { type: String, trim: true },
    department: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Department'
    }
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Pre-save hook to hash password if modified
userSchema.pre('save', async function () {
  if (!this.isModified('password')) {
    return;
  }
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});


// Instance method to compare password
userSchema.methods.comparePassword = async function (candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model('User', userSchema);
