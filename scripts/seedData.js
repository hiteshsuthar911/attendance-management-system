const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('../models/User');
const Department = require('../models/Department');
const Lecture = require('../models/Lecture');
const Attendance = require('../models/Attendance');

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/attendance_system';

const sampleStudentsData = [
  { rollNumber: 'BV25-SD01', name: 'Bohra Idris', email: 'bohra.idris@student.com' },
  { rollNumber: 'BV25-SD04', name: 'Fodkar Faris', email: 'fodkar.faris@student.com' },
  { rollNumber: 'BV25-SD05', name: 'Gupta Vinay', email: 'gupta.vinay@student.com' },
  { rollNumber: 'BV25-SD06', name: 'Jain Yug', email: 'jain.yug@student.com' },
  { rollNumber: 'BV25-SD07', name: 'Kumar Sandeep', email: 'kumar.sandeep@student.com' },
  { rollNumber: 'BV25-SD09', name: 'Maurya Surbhi', email: 'maurya.surbhi@student.com' },
  { rollNumber: 'BV25-SD10', name: 'Naik Harshad', email: 'naik.harshad@student.com' },
  { rollNumber: 'BV25-SD11', name: 'Nirgun Anurag', email: 'nirgun.anurag@student.com' },
  { rollNumber: 'BV25-SD13', name: 'Sharma Krrish', email: 'sharma.krrish@student.com' },
  { rollNumber: 'BV25-SD15', name: 'Shekhawat Aaryavansh', email: 'shekhawat.aaryavansh@student.com' },
  { rollNumber: 'BV25-SD16', name: 'Singh Krish', email: 'singh.krish@student.com' },
  { rollNumber: 'BV25-SD17', name: 'Suthar Hitesh', email: 'suthar.hitesh@student.com' },
  { rollNumber: 'BV25-SD02', name: 'Chandel Prisha', email: 'chandel.prisha@student.com' },
  { rollNumber: 'BV25-SD03', name: 'Chaturvedi Vikas', email: 'chaturvedi.vikas@student.com' },
  { rollNumber: 'BV25-SD08', name: 'Kunkerkar Ravi', email: 'kunkerkar.ravi@student.com' },
  { rollNumber: 'BV25-SD12', name: 'Pandey Avinash', email: 'pandey.avinash@student.com' },
  { rollNumber: 'BV25-SD14', name: 'Sharma Siddhi', email: 'sharma.siddhi@student.com' },
  { rollNumber: 'BV25-SD18', name: 'Upadhyay Vikhyat', email: 'upadhyay.vikhyat@student.com' }
];

const subjectsList = [
  'Software Engineering',
  'OOP\'s With Java Programming',
  'Indian Knowledge System',
  'Linux Operating System Lab',
  'Web Development-Front End-II',
  'Business Intelligence-I'
];

async function seedData() {
  try {
    console.log('[Seeding]: Connecting to MongoDB...');
    const conn = await mongoose.connect(MONGODB_URI);
    console.log('[Seeding]: MongoDB connected.');

    // Drop legacy non-standard indexes across collections
    const colNames = ['users', 'lectures', 'departments', 'attendances'];
    for (const cn of colNames) {
      try {
        const col = conn.connection.collection(cn);
        const idxs = await col.indexes();
        for (const idx of idxs) {
          if (idx.name !== '_id_' && (idx.name.includes('id_1') || idx.name.includes('lecture_id'))) {
            await col.dropIndex(idx.name);
            console.log(`✔ Dropped legacy index ${idx.name} from ${cn}`);
          }
        }
      } catch (e) {}
    }

    // 1. Create or Find Department
    let dept = await Department.findOne({ code: 'SD' });
    if (!dept) {
      dept = await Department.create({
        name: 'Software Development',
        code: 'SD',
        description: 'BACHELOR OF VOCATIONAL (SD) Department'
      });
      console.log('✔ Department created: Software Development (SD)');
    }

    // 2. Create Superadmin
    let superadmin = await User.findOne({ email: 'superadmin@attendance.com' });
    if (!superadmin) {
      superadmin = await User.create({
        name: 'Super Admin',
        email: 'superadmin@attendance.com',
        password: 'superadmin123',
        role: 'superadmin'
      });
      console.log('✔ Superadmin created: superadmin@attendance.com');
    }

    // 3. Create Admin
    let admin = await User.findOne({ email: 'sdadmin@attendance.com' });
    if (!admin) {
      admin = await User.create({
        name: 'SD Dept Admin',
        email: 'sdadmin@attendance.com',
        password: 'admin123',
        role: 'admin',
        departments: [dept._id]
      });
      console.log('✔ Admin created: sdadmin@attendance.com');
    } else {
      admin.departments = [dept._id];
      await admin.save();
    }

    // 4. Create Faculty
    let faculty = await User.findOne({ email: 'shrutimishra@attendance.com' });
    if (!faculty) {
      faculty = await User.create({
        name: 'Prof. Shruti Mishra',
        email: 'shrutimishra@attendance.com',
        password: 'faculty123',
        role: 'faculty',
        departments: [dept._id]
      });
      console.log('✔ Faculty created: Prof. Shruti Mishra (shrutimishra@attendance.com)');
    } else {
      faculty.departments = [dept._id];
      await faculty.save();
    }

    // 5. Create Students
    const studentUsers = [];
    for (const s of sampleStudentsData) {
      let stUser = await User.findOne({ email: s.email });
      if (!stUser) {
        stUser = await User.create({
          name: s.name,
          email: s.email,
          password: 'student123',
          role: 'student',
          studentDetails: {
            rollNumber: s.rollNumber,
            branch: 'SD',
            batch: 'Batch-5',
            department: dept._id
          }
        });
        console.log(`✔ Student created: ${s.rollNumber} - ${s.name}`);
      }
      studentUsers.push(stUser);
    }

    // 6. Create Sample Lectures across dates
    const datesList = [
      { date: '2026-07-02', timeSlot: '9:30am to 11:30am' },
      { date: '2026-07-07', timeSlot: '9:30am to 11:00am' },
      { date: '2026-07-09', timeSlot: '3:00pm to 4:30pm' },
      { date: '2026-07-06', timeSlot: '1:30pm to 3:00pm' },
      { date: '2026-07-10', timeSlot: '12:30pm to 1:30pm' },
      { date: '2026-07-16', timeSlot: '11:00am to 1:30pm' },
      { date: '2026-07-17', timeSlot: '1:30pm to 3:00pm' },
      { date: '2026-08-02', timeSlot: '10:00am to 11:30am' },
      { date: '2026-08-05', timeSlot: '11:30am to 1:00pm' },
      { date: '2026-08-08', timeSlot: '2:00pm to 3:30pm' },
      { date: '2026-08-11', timeSlot: '9:30am to 11:00am' }
    ];

    const createdLectures = [];

    for (const subj of subjectsList) {
      for (let i = 0; i < datesList.length; i++) {
        const dObj = datesList[i];
        let lec = await Lecture.findOne({ subject: subj, date: new Date(dObj.date), timeSlot: dObj.timeSlot });
        if (!lec) {
          lec = await Lecture.create({
            subject: subj,
            department: dept._id,
            branch: 'SD',
            batch: 'Batch-5',
            faculty: faculty._id,
            createdBy: admin._id,
            date: new Date(dObj.date),
            timeSlot: dObj.timeSlot,
            status: 'completed',
            remarks: 'Regular Lecture'
          });
        }
        createdLectures.push(lec);
      }
    }

    console.log(`✔ Created ${createdLectures.length} lecture sessions across 6 subjects.`);

    // 7. Seed Attendance Logs
    let attCount = 0;
    for (const lec of createdLectures) {
      for (let i = 0; i < studentUsers.length; i++) {
        const st = studentUsers[i];
        const isPresent = (i % 5 !== 0 && (i + lec.subject.length) % 7 !== 0);
        const status = isPresent ? 'present' : 'absent';

        const existingAtt = await Attendance.findOne({ lecture: lec._id, student: st._id });
        if (!existingAtt) {
          await Attendance.create({
            lecture: lec._id,
            student: st._id,
            department: dept._id,
            status,
            date: lec.date,
            markedBy: faculty._id,
            branch: 'SD',
            batch: 'Batch-5'
          });
          attCount++;
        }
      }
    }

    console.log(`✔ Seeded ${attCount} student attendance log entries.`);
    console.log('\n======================================================');
    console.log('🎉 SAMPLE DATA SEEDED SUCCESSFULLY!');
    console.log('======================================================');
    console.log('🔑 Credentials to test:');
    console.log('1. Superadmin : superadmin@attendance.com / superadmin123');
    console.log('2. Admin      : sdadmin@attendance.com    / admin123');
    console.log('3. Faculty    : shrutimishra@attendance.com / faculty123');
    console.log('4. Student    : bohra.idris@student.com  / student123');
    console.log('======================================================');

    process.exit(0);
  } catch (err) {
    console.error('Error seeding data:', err);
    process.exit(1);
  }
}

seedData();
