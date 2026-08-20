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
  { rollNumber: 'BV25-SD02', name: 'Chandel Prisha', email: 'chandel.prisha@student.com' },
  { rollNumber: 'BV25-SD03', name: 'Chaturvedi Vikas', email: 'chaturvedi.vikas@student.com' },
  { rollNumber: 'BV25-SD04', name: 'Fodkar Faris', email: 'fodkar.faris@student.com' },
  { rollNumber: 'BV25-SD05', name: 'Gupta Vinay', email: 'gupta.vinay@student.com' },
  { rollNumber: 'BV25-SD06', name: 'Jain Yug', email: 'jain.yug@student.com' },
  { rollNumber: 'BV25-SD07', name: 'Kumar Sandeep', email: 'kumar.sandeep@student.com' },
  { rollNumber: 'BV25-SD08', name: 'Kunkerkar Ravi', email: 'kunkerkar.ravi@student.com' },
  { rollNumber: 'BV25-SD09', name: 'Maurya Surbhi', email: 'maurya.surbhi@student.com' },
  { rollNumber: 'BV25-SD10', name: 'Naik Harshad', email: 'naik.harshad@student.com' },
  { rollNumber: 'BV25-SD11', name: 'Nirgun Anurag', email: 'nirgun.anurag@student.com' },
  { rollNumber: 'BV25-SD12', name: 'Pandey Avinash', email: 'pandey.avinash@student.com' },
  { rollNumber: 'BV25-SD13', name: 'Sharma Krrish', email: 'sharma.krrish@student.com' },
  { rollNumber: 'BV25-SD14', name: 'Sharma Siddhi', email: 'sharma.siddhi@student.com' },
  { rollNumber: 'BV25-SD15', name: 'Shekhawat Aaryavansh', email: 'shekhawat.aaryavansh@student.com' },
  { rollNumber: 'BV25-SD16', name: 'Singh Krish', email: 'singh.krish@student.com' },
  { rollNumber: 'BV25-SD17', name: 'Suthar Hitesh', email: 'suthar.hitesh@student.com' },
  { rollNumber: 'BV25-SD18', name: 'Upadhyay Vikhyat', email: 'upadhyay.vikhyat@student.com' },
  { rollNumber: 'BV25-SD19', name: 'Yadav Ritesh', email: 'yadav.ritesh@student.com' },
  { rollNumber: 'BV25-SD20', name: 'Verma Aditi', email: 'verma.aditi@student.com' },
];

const subjectsList = [
  'Software Engineering',
  'OOP\'s With Java Programming',
  'Indian Knowledge System',
  'Linux Operating System Lab',
  'Web Development-Front End-II',
  'Business Intelligence-I'
];

async function seedCompleteData() {
  try {
    console.log('[Seeding]: Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('[Seeding]: MongoDB connected.');

    // 1. Create or Find Departments
    const deptsData = [
      { name: 'BVOC IN SD', code: 'BVOC-SD', description: 'Bachelor of Vocational (Software Development)' },
      { name: 'Computer Engineering', code: 'BE-COMP', description: 'B.E. Computer Engineering Department' },
      { name: 'Information Technology', code: 'BE-IT', description: 'B.E. Information Technology Department' },
      { name: 'Artificial Intelligence & Data Science', code: 'BTECH-AI', description: 'B.Tech AI & Data Science' }
    ];

    const savedDepts = {};
    for (const d of deptsData) {
      let dept = await Department.findOne({ code: d.code });
      if (!dept) {
        dept = await Department.create(d);
        console.log(` Created Department: ${d.name} (${d.code})`);
      }
      savedDepts[d.code] = dept;
    }

    const mainDept = savedDepts['BVOC-SD'];

    // 2. Create Superadmin
    let superadmin = await User.findOne({ email: 'superadmin@attendance.com' });
    if (!superadmin) {
      superadmin = await User.create({
        name: 'Super Admin',
        email: 'superadmin@attendance.com',
        password: 'superadmin123',
        role: 'superadmin'
      });
      console.log(' Superadmin created: superadmin@attendance.com');
    }

    // 3. Create Department Admins
    const adminsData = [
      { name: 'Aadarsh Shinde', email: 'sdadmin@attendance.com', pass: 'sdadmin123', depts: [mainDept._id] },
      { name: 'Dr. Rajesh Kumar', email: 'compadmin@attendance.com', pass: 'admin123', depts: [savedDepts['BE-COMP']._id] }
    ];

    let defaultAdmin = null;
    for (const a of adminsData) {
      let admin = await User.findOne({ email: a.email });
      if (!admin) {
        admin = await User.create({
          name: a.name,
          email: a.email,
          password: a.pass,
          role: 'admin',
          departments: a.depts
        });
        console.log(` Admin created: ${a.name} (${a.email})`);
      }
      if (!defaultAdmin) defaultAdmin = admin;
    }

    // 4. Create Faculties
    const facultiesData = [
      { name: 'Prof. Shruti Mishra', email: 'shrutimishra@attendance.com', pass: 'shruti123', depts: [mainDept._id] },
      { name: 'Dr. Manoj Chavan', email: 'manojchavan@attendance.com', pass: 'faculty123', depts: [mainDept._id] },
      { name: 'Prof. Sheetal Rathi', email: 'sheetalrathi@attendance.com', pass: 'faculty123', depts: [mainDept._id, savedDepts['BE-COMP']._id] },
      { name: 'Dr. Lochan Jolly', email: 'lochanjolly@attendance.com', pass: 'faculty123', depts: [mainDept._id] }
    ];

    const savedFaculties = [];
    for (const f of facultiesData) {
      let faculty = await User.findOne({ email: f.email });
      if (!faculty) {
        faculty = await User.create({
          name: f.name,
          email: f.email,
          password: f.pass,
          role: 'faculty',
          departments: f.depts
        });
        console.log(` Faculty created: ${f.name} (${f.email})`);
      }
      savedFaculties.push(faculty);
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
            department: mainDept._id
          }
        });
        console.log(` Student created: ${s.rollNumber} - ${s.name}`);
      }
      studentUsers.push(stUser);
    }

    // 6. Create Lecture Timetable Sessions in Batch
    const datesList = [
      { date: '2026-07-02', timeSlot: '9:30am to 11:30am' },
      { date: '2026-07-07', timeSlot: '9:30am to 11:00am' },
      { date: '2026-07-09', timeSlot: '3:00pm to 4:30pm' },
      { date: '2026-07-14', timeSlot: '1:30pm to 3:00pm' },
      { date: '2026-07-16', timeSlot: '11:00am to 1:30pm' },
      { date: '2026-07-21', timeSlot: '9:30am to 11:30am' },
      { date: '2026-07-23', timeSlot: '1:30pm to 3:00pm' },
      { date: '2026-07-28', timeSlot: '3:00pm to 4:30pm' },
      { date: '2026-08-04', timeSlot: '10:00am to 11:30am' },
      { date: '2026-08-06', timeSlot: '11:30am to 1:00pm' },
      { date: '2026-08-11', timeSlot: '2:00pm to 3:30pm' },
      { date: '2026-08-13', timeSlot: '9:30am to 11:00am' }
    ];

    await Lecture.deleteMany({ branch: 'SD' });

    const lectureDocs = [];
    for (let sIdx = 0; sIdx < subjectsList.length; sIdx++) {
      const subj = subjectsList[sIdx];
      const assignedFac = savedFaculties[sIdx % savedFaculties.length];

      for (let i = 0; i < datesList.length; i++) {
        const dObj = datesList[i];
        lectureDocs.push({
          subject: subj,
          department: mainDept._id,
          branch: 'SD',
          batch: 'Batch-5',
          faculty: assignedFac._id,
          createdBy: defaultAdmin._id,
          date: new Date(dObj.date),
          timeSlot: dObj.timeSlot,
          status: 'completed',
          remarks: 'Regular Lecture'
        });
      }
    }

    const createdLectures = await Lecture.insertMany(lectureDocs);
    console.log(` Inserted ${createdLectures.length} lecture timetable sessions.`);

    // 7. Seed Student Attendance Records in Batch
    await Attendance.deleteMany({ branch: 'SD' });

    const attendanceDocs = [];
    for (const lec of createdLectures) {
      for (let i = 0; i < studentUsers.length; i++) {
        const st = studentUsers[i];
        // 85% attendance distribution
        const isPresent = (i % 6 !== 0 && (i + (lec.subject || '').length) % 7 !== 0);
        const status = isPresent ? 'present' : 'absent';

        attendanceDocs.push({
          lecture: lec._id,
          student: st._id,
          department: mainDept._id,
          status,
          date: lec.date,
          markedBy: lec.faculty,
          branch: 'SD',
          batch: 'Batch-5'
        });
      }
    }

    console.log(` Bulk inserting ${attendanceDocs.length} attendance records...`);
    await Attendance.insertMany(attendanceDocs);
    console.log(` Successfully inserted ${attendanceDocs.length} attendance records!`);

    console.log('\n======================================================');
    console.log(' COMPLETE SAMPLE DATA READY IN MONGO DB!');
    console.log('======================================================');
    console.log(' Credentials:');
    console.log('1. Superadmin : superadmin@attendance.com   / superadmin123');
    console.log('2. Admin      : sdadmin@attendance.com      / sdadmin123');
    console.log('3. Faculty    : shrutimishra@attendance.com / shruti123');
    console.log('4. Student    : suthar.hitesh@student.com   / student123');
    console.log('   Student 2  : bohra.idris@student.com     / student123');
    console.log('======================================================');

    process.exit(0);
  } catch (err) {
    console.error('Error seeding data:', err);
    process.exit(1);
  }
}

seedCompleteData();
