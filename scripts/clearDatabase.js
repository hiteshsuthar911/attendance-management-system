const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('../models/User');
const Department = require('../models/Department');
const Lecture = require('../models/Lecture');
const Attendance = require('../models/Attendance');

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/attendance_system';

async function resetCleanProductionData() {
  try {
    console.log('[Reset]: Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('[Reset]: MongoDB connected.');

    // 1. Wipe all dummy attendance and lectures
    await Attendance.deleteMany({});
    await Lecture.deleteMany({});
    console.log(' Cleared all dummy attendance records and lectures.');

    // 2. Wipe all users except base test accounts
    await User.deleteMany({});
    await Department.deleteMany({});

    // 3. Create Clean Official Departments
    const deptSD = await Department.create({
      name: 'BVOC IN SD',
      code: 'BVOC-SD',
      description: 'Bachelor of Vocational (Software Development)'
    });

    const deptComp = await Department.create({
      name: 'Computer Engineering',
      code: 'BE-COMP',
      description: 'B.E. in Computer Engineering'
    });

    console.log(' Created official departments: BVOC IN SD, Computer Engineering.');

    // 4. Create Clean Users for Each Role
    const superadmin = await User.create({
      name: 'Super Admin',
      email: 'superadmin@attendance.com',
      password: 'superadmin123',
      role: 'superadmin'
    });

    const admin = await User.create({
      name: 'Aadarsh Shinde',
      email: 'sdadmin@attendance.com',
      password: 'sdadmin123',
      role: 'admin',
      departments: [deptSD._id]
    });

    const faculty = await User.create({
      name: 'Prof. Shruti Mishra',
      email: 'shrutimishra@attendance.com',
      password: 'shruti123',
      role: 'faculty',
      departments: [deptSD._id]
    });

    const student = await User.create({
      name: 'Suthar Hitesh',
      email: 'suthar.hitesh@student.com',
      password: 'student123',
      role: 'student',
      studentDetails: {
        rollNumber: 'BV25-SD17',
        branch: 'SD',
        batch: 'Batch-5',
        department: deptSD._id
      }
    });

    console.log(' Created clean role accounts (Superadmin, Admin, Faculty, Student).');

    console.log('\n======================================================');
    console.log(' ALL SAMPLE DATA REMOVED & FRESH SYSTEM INITIALIZED!');
    console.log('======================================================');
    console.log(' Official Logins:');
    console.log('1. Superadmin : superadmin@attendance.com   / superadmin123');
    console.log('2. Admin      : sdadmin@attendance.com      / sdadmin123');
    console.log('3. Faculty    : shrutimishra@attendance.com / shruti123');
    console.log('4. Student    : suthar.hitesh@student.com   / student123');
    console.log('======================================================');

    process.exit(0);
  } catch (err) {
    console.error('Error resetting data:', err);
    process.exit(1);
  }
}

resetCleanProductionData();
