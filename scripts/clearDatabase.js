const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('../models/User');
const Department = require('../models/Department');
const Lecture = require('../models/Lecture');
const Attendance = require('../models/Attendance');

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/attendance_system';

async function clearSampleData() {
  try {
    console.log('[Cleanup]: Connecting to MongoDB...');
    const conn = await mongoose.connect(MONGODB_URI);
    console.log(`[Cleanup]: Connected to ${conn.connection.host}`);

    // 1. Delete all Attendance records
    const attRes = await Attendance.deleteMany({});
    console.log(` Removed ${attRes.deletedCount} attendance records.`);

    // 2. Delete all Lectures
    const lecRes = await Lecture.deleteMany({});
    console.log(` Removed ${lecRes.deletedCount} lecture sessions.`);

    // 3. Delete all Departments
    const deptRes = await Department.deleteMany({});
    console.log(` Removed ${deptRes.deletedCount} departments.`);

    // 4. Delete all non-superadmin Users (Admins, Faculty, Students)
    const userRes = await User.deleteMany({ role: { $ne: 'superadmin' } });
    console.log(` Removed ${userRes.deletedCount} sample user accounts (admins, faculties, students).`);

    // 5. Ensure Default Superadmin Exists
    let superadmin = await User.findOne({ role: 'superadmin' });
    if (!superadmin) {
      superadmin = await User.create({
        name: 'Super Admin',
        email: 'superadmin@attendance.com',
        password: 'superadmin123',
        role: 'superadmin'
      });
      console.log(' Default Superadmin created: superadmin@attendance.com');
    } else {
      console.log(' Preserved Superadmin: superadmin@attendance.com');
    }

    console.log('\n======================================================');
    console.log(' ALL SAMPLE DATA CLEARED SUCCESSFULLY!');
    console.log('======================================================');
    console.log('Database is now clean and ready for MongoDB Atlas Cloud connection.');
    console.log('Superadmin Login: superadmin@attendance.com / superadmin123');
    console.log('======================================================');

    process.exit(0);
  } catch (err) {
    console.error('Error clearing sample data:', err);
    process.exit(1);
  }
}

clearSampleData();
