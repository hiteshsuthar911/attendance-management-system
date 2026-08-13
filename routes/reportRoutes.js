const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Attendance = require('../models/Attendance');
const Lecture = require('../models/Lecture');
const Department = require('../models/Department');
const { verifyToken, authorizeRoles } = require('../middleware/authMiddleware');

const SECRET = process.env.JWT_SECRET || 'super_secret_jwt_key_attendance_system_2026';

// Middleware to accept auth token from header or query param
const verifyTokenFromHeaderOrQuery = async (req, res, next) => {
  let token = req.headers.authorization ? req.headers.authorization.split(' ')[1] : null;
  if (!token && req.query.token) {
    token = req.query.token;
  }

  if (!token) {
    return res.status(401).send('Authentication token required.');
  }

  try {
    const decoded = jwt.verify(token, SECRET);
    const user = await User.findById(decoded.id).select('-password');
    if (!user) {
      return res.status(401).send('User account not found.');
    }
    req.user = user;
    next();
  } catch (err) {
    return res.status(401).send('Invalid or expired token.');
  }
};

// Helper: fetch all student logs in 1 batch query
async function getLogsByStudentMap(studentIds) {
  if (!studentIds || studentIds.length === 0) return {};
  const allLogs = await Attendance.find({ student: { $in: studentIds } }).populate('lecture');
  const map = {};
  allLogs.forEach(log => {
    const sid = log.student.toString();
    if (!map[sid]) map[sid] = [];
    map[sid].push(log);
  });
  return map;
}

// Backend Export CSV Endpoint (Direct File Attachment Header)
router.get('/export-csv', verifyTokenFromHeaderOrQuery, authorizeRoles('superadmin', 'admin', 'faculty'), async (req, res) => {
  try {
    const { departmentId, branch, batch, month, year } = req.query;

    let targetDeptId = departmentId;
    if (req.user.role === 'admin' && !targetDeptId) {
      if (req.user.departments && req.user.departments.length > 0) {
        targetDeptId = req.user.departments[0]._id || req.user.departments[0];
      }
    }

    let studentFilter = { role: 'student' };
    if (targetDeptId) studentFilter['studentDetails.department'] = targetDeptId;
    if (branch) studentFilter['studentDetails.branch'] = new RegExp(`^${branch}$`, 'i');
    if (batch) studentFilter['studentDetails.batch'] = new RegExp(`^${batch}$`, 'i');

    const students = await User.find(studentFilter)
      .select('-password')
      .populate('studentDetails.department')
      .sort({ 'studentDetails.rollNumber': 1, name: 1 });

    let lectureFilter = {};
    if (targetDeptId) lectureFilter.department = targetDeptId;
    if (branch) lectureFilter.branch = new RegExp(`^${branch}$`, 'i');
    if (batch) lectureFilter.batch = new RegExp(`^${batch}$`, 'i');

    const lectures = await Lecture.find(lectureFilter).populate('faculty', 'name');

    const subjectsMap = {};
    const reportMonth = month ? parseInt(month) : (new Date().getMonth() + 1);
    const reportYear = year ? parseInt(year) : new Date().getFullYear();

    lectures.forEach(lec => {
      const subj = lec.subject;
      if (!subjectsMap[subj]) {
        subjectsMap[subj] = { subjectName: subj, mlyTotalLectures: 0, cumTotalLectures: 0 };
      }
      const lecDate = new Date(lec.date);
      const lecMonth = lecDate.getMonth() + 1;
      const lecYear = lecDate.getFullYear();

      if (lecYear < reportYear || (lecYear === reportYear && lecMonth <= reportMonth)) {
        subjectsMap[subj].cumTotalLectures++;
      }
      if (lecYear === reportYear && lecMonth === reportMonth) {
        subjectsMap[subj].mlyTotalLectures++;
      }
    });

    const subjectsList = Object.values(subjectsMap);
    const studentIds = students.map(s => s._id);
    const logsMap = await getLogsByStudentMap(studentIds);

    let csv = '\uFEFF'; // UTF-8 BOM
    csv += `"Roll No.","Student Name"`;
    subjectsList.forEach(s => {
      csv += `,"${s.subjectName} MLY Att","${s.subjectName} MLY %","${s.subjectName} CUM Att","${s.subjectName} CUM %"`;
    });
    csv += `,"Total MLY Att","Total MLY %","Total CUM Att","Total CUM %"\n`;

    for (const student of students) {
      const studentLogs = logsMap[student._id.toString()] || [];

      const subjectStats = {};
      subjectsList.forEach(s => {
        subjectStats[s.subjectName] = { mlyAttended: 0, cumAttended: 0 };
      });

      let totalMlyAttended = 0;
      let totalMlyLectures = 0;
      let totalCumAttended = 0;
      let totalCumLectures = 0;

      studentLogs.forEach(log => {
        if (!log.lecture) return;
        const subjName = log.lecture.subject;
        const logDate = new Date(log.date);
        const logMonth = logDate.getMonth() + 1;
        const logYear = logDate.getFullYear();

        if (log.status === 'present') {
          if (logYear < reportYear || (logYear === reportYear && logMonth <= reportMonth)) {
            if (subjectStats[subjName]) subjectStats[subjName].cumAttended++;
            totalCumAttended++;
          }
          if (logYear === reportYear && logMonth === reportMonth) {
            if (subjectStats[subjName]) subjectStats[subjName].mlyAttended++;
            totalMlyAttended++;
          }
        }
      });

      let rowStr = `"${student.studentDetails ? student.studentDetails.rollNumber : 'N/A'}","${student.name}"`;

      subjectsList.forEach(s => {
        const mlyLec = s.mlyTotalLectures;
        const cumLec = s.cumTotalLectures;
        totalMlyLectures += mlyLec;
        totalCumLectures += cumLec;

        const st = subjectStats[s.subjectName] || { mlyAttended: 0, cumAttended: 0 };
        const mlyPct = mlyLec > 0 ? Math.round((st.mlyAttended / mlyLec) * 100) : 0;
        const cumPct = cumLec > 0 ? Math.round((st.cumAttended / cumLec) * 100) : 0;

        rowStr += `,"${st.mlyAttended}","${mlyPct}%","${st.cumAttended}","${cumPct}%"`;
      });

      const overallMlyPct = totalMlyLectures > 0 ? Math.round((totalMlyAttended / totalMlyLectures) * 100) : 0;
      const overallCumPct = totalCumLectures > 0 ? Math.round((totalCumAttended / totalCumLectures) * 100) : 0;

      rowStr += `,"${totalMlyAttended}","${overallMlyPct}%","${totalCumAttended}","${overallCumPct}%"\n`;
      csv += rowStr;
    }

    const filename = `Monthly_Attendance_Report_${reportYear}_${reportMonth}.csv`;
    res.setHeader('Content-Type', 'application/octet-stream');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"; filename*=UTF-8''${encodeURIComponent(filename)}`);
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.status(200).send(csv);
  } catch (error) {
    res.status(500).send('Error generating CSV file.');
  }
});

// Backend Export Excel Endpoint (Direct File Attachment Header)
router.get('/export-excel', verifyTokenFromHeaderOrQuery, authorizeRoles('superadmin', 'admin', 'faculty'), async (req, res) => {
  try {
    const { departmentId, branch, batch, month, year } = req.query;

    let targetDeptId = departmentId;
    if (req.user.role === 'admin' && !targetDeptId) {
      if (req.user.departments && req.user.departments.length > 0) {
        targetDeptId = req.user.departments[0]._id || req.user.departments[0];
      }
    }

    const deptObj = targetDeptId ? await Department.findById(targetDeptId) : null;
    const deptName = deptObj ? deptObj.name : 'All Departments';
    const deptCode = deptObj ? deptObj.code : 'ALL';

    let studentFilter = { role: 'student' };
    if (targetDeptId) studentFilter['studentDetails.department'] = targetDeptId;
    if (branch) studentFilter['studentDetails.branch'] = new RegExp(`^${branch}$`, 'i');
    if (batch) studentFilter['studentDetails.batch'] = new RegExp(`^${batch}$`, 'i');

    const students = await User.find(studentFilter)
      .select('-password')
      .populate('studentDetails.department')
      .sort({ 'studentDetails.rollNumber': 1, name: 1 });

    let lectureFilter = {};
    if (targetDeptId) lectureFilter.department = targetDeptId;
    if (branch) lectureFilter.branch = new RegExp(`^${branch}$`, 'i');
    if (batch) lectureFilter.batch = new RegExp(`^${batch}$`, 'i');

    const lectures = await Lecture.find(lectureFilter).populate('faculty', 'name');

    const subjectsMap = {};
    const reportMonth = month ? parseInt(month) : (new Date().getMonth() + 1);
    const reportYear = year ? parseInt(year) : new Date().getFullYear();

    lectures.forEach(lec => {
      const subj = lec.subject;
      if (!subjectsMap[subj]) {
        subjectsMap[subj] = { subjectName: subj, facultyName: lec.faculty ? lec.faculty.name : 'Faculty', mlyTotalLectures: 0, cumTotalLectures: 0 };
      }
      const lecDate = new Date(lec.date);
      const lecMonth = lecDate.getMonth() + 1;
      const lecYear = lecDate.getFullYear();

      if (lecYear < reportYear || (lecYear === reportYear && lecMonth <= reportMonth)) {
        subjectsMap[subj].cumTotalLectures++;
      }
      if (lecYear === reportYear && lecMonth === reportMonth) {
        subjectsMap[subj].mlyTotalLectures++;
      }
    });

    const subjectsList = Object.values(subjectsMap);
    const studentIds = students.map(s => s._id);
    const logsMap = await getLogsByStudentMap(studentIds);

    let html = `<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
    <head><meta charset="utf-8"/></head><body>
    <h2>TCET | THAKUR COLLEGE OF ENGINEERING & TECHNOLOGY</h2>
    <p>Department: ${deptName} (${deptCode}) | Month: ${reportMonth}/${reportYear}</p>
    <table border="1">
      <thead>
        <tr style="background-color: #f2f2f2;">
          <th rowspan="3">Roll No.</th>
          <th rowspan="3">Name of Student</th>`;

    subjectsList.forEach(s => {
      html += `<th colspan="4">${s.subjectName}</th>`;
    });
    html += `<th colspan="4">Total Attendance</th></tr><tr style="background-color: #f9f9f9;">`;

    subjectsList.forEach(() => {
      html += `<th colspan="2">MLY</th><th colspan="2">CUM</th>`;
    });
    html += `<th colspan="2">MLY</th><th colspan="2">CUM</th></tr><tr style="background-color: #f9f9f9;">`;

    subjectsList.forEach(() => {
      html += `<th>Att</th><th>%</th><th>Att</th><th>%</th>`;
    });
    html += `<th>Att</th><th>%</th><th>Att</th><th>%</th></tr></thead><tbody>`;

    for (const student of students) {
      const studentLogs = logsMap[student._id.toString()] || [];

      const subjectStats = {};
      subjectsList.forEach(s => {
        subjectStats[s.subjectName] = { mlyAttended: 0, cumAttended: 0 };
      });

      let totalMlyAttended = 0;
      let totalMlyLectures = 0;
      let totalCumAttended = 0;
      let totalCumLectures = 0;

      studentLogs.forEach(log => {
        if (!log.lecture) return;
        const subjName = log.lecture.subject;
        const logDate = new Date(log.date);
        const logMonth = logDate.getMonth() + 1;
        const logYear = logDate.getFullYear();

        if (log.status === 'present') {
          if (logYear < reportYear || (logYear === reportYear && logMonth <= reportMonth)) {
            if (subjectStats[subjName]) subjectStats[subjName].cumAttended++;
            totalCumAttended++;
          }
          if (logYear === reportYear && logMonth === reportMonth) {
            if (subjectStats[subjName]) subjectStats[subjName].mlyAttended++;
            totalMlyAttended++;
          }
        }
      });

      html += `<tr><td>${student.studentDetails ? student.studentDetails.rollNumber : 'N/A'}</td><td>${student.name}</td>`;

      subjectsList.forEach(s => {
        const mlyLec = s.mlyTotalLectures;
        const cumLec = s.cumTotalLectures;
        totalMlyLectures += mlyLec;
        totalCumLectures += cumLec;

        const st = subjectStats[s.subjectName] || { mlyAttended: 0, cumAttended: 0 };
        const mlyPct = mlyLec > 0 ? Math.round((st.mlyAttended / mlyLec) * 100) : 0;
        const cumPct = cumLec > 0 ? Math.round((st.cumAttended / cumLec) * 100) : 0;

        html += `<td>${st.mlyAttended}</td><td>${mlyPct}%</td><td>${st.cumAttended}</td><td>${cumPct}%</td>`;
      });

      const overallMlyPct = totalMlyLectures > 0 ? Math.round((totalMlyAttended / totalMlyLectures) * 100) : 0;
      const overallCumPct = totalCumLectures > 0 ? Math.round((totalCumAttended / totalCumLectures) * 100) : 0;

      html += `<td>${totalMlyAttended}</td><td>${overallMlyPct}%</td><td>${totalCumAttended}</td><td>${overallCumPct}%</td></tr>`;
    }

    html += `</tbody></table></body></html>`;

    const filename = `Monthly_Attendance_Report_${reportYear}_${reportMonth}.xls`;
    res.setHeader('Content-Type', 'application/octet-stream');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"; filename*=UTF-8''${encodeURIComponent(filename)}`);
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.status(200).send(html);
  } catch (error) {
    res.status(500).send('Error generating Excel file.');
  }
});

// Monthly Matrix Attendance Report (Photo 2 format JSON)
router.get('/monthly-matrix', verifyToken, authorizeRoles('superadmin', 'admin', 'faculty'), async (req, res) => {
  try {
    const { departmentId, branch, batch, month, year } = req.query;

    let targetDeptId = departmentId;
    if (req.user.role === 'admin' && !targetDeptId) {
      if (req.user.departments && req.user.departments.length > 0) {
        targetDeptId = req.user.departments[0]._id || req.user.departments[0];
      }
    }

    const deptObj = targetDeptId ? await Department.findById(targetDeptId) : null;
    const deptName = deptObj ? deptObj.name : 'All Departments';
    const deptCode = deptObj ? deptObj.code : 'ALL';

    let studentFilter = { role: 'student' };
    if (targetDeptId) studentFilter['studentDetails.department'] = targetDeptId;
    if (branch) studentFilter['studentDetails.branch'] = new RegExp(`^${branch}$`, 'i');
    if (batch) studentFilter['studentDetails.batch'] = new RegExp(`^${batch}$`, 'i');

    const students = await User.find(studentFilter)
      .select('-password')
      .populate('studentDetails.department')
      .sort({ 'studentDetails.rollNumber': 1, name: 1 });

    let lectureFilter = {};
    if (targetDeptId) lectureFilter.department = targetDeptId;
    if (branch) lectureFilter.branch = new RegExp(`^${branch}$`, 'i');
    if (batch) lectureFilter.batch = new RegExp(`^${batch}$`, 'i');

    const lectures = await Lecture.find(lectureFilter).populate('faculty', 'name');
    
    const subjectsMap = {};
    const reportMonth = month ? parseInt(month) : (new Date().getMonth() + 1);
    const reportYear = year ? parseInt(year) : new Date().getFullYear();

    lectures.forEach(lec => {
      const subj = lec.subject;
      if (!subjectsMap[subj]) {
        subjectsMap[subj] = {
          subjectName: subj,
          facultyName: lec.faculty ? lec.faculty.name : 'Faculty',
          mlyTotalLectures: 0,
          cumTotalLectures: 0
        };
      }

      const lecDate = new Date(lec.date);
      const lecMonth = lecDate.getMonth() + 1;
      const lecYear = lecDate.getFullYear();

      if (lecYear < reportYear || (lecYear === reportYear && lecMonth <= reportMonth)) {
        subjectsMap[subj].cumTotalLectures++;
      }

      if (lecYear === reportYear && lecMonth === reportMonth) {
        subjectsMap[subj].mlyTotalLectures++;
      }
    });

    const subjectsList = Object.values(subjectsMap);
    const studentIds = students.map(s => s._id);
    const logsMap = await getLogsByStudentMap(studentIds);
    const studentRows = [];

    for (const student of students) {
      const studentLogs = logsMap[student._id.toString()] || [];

      const subjectStats = {};
      subjectsList.forEach(s => {
        subjectStats[s.subjectName] = {
          mlyAttended: 0,
          cumAttended: 0
        };
      });

      let totalMlyAttended = 0;
      let totalMlyLectures = 0;
      let totalCumAttended = 0;
      let totalCumLectures = 0;

      studentLogs.forEach(log => {
        if (!log.lecture) return;
        const subjName = log.lecture.subject;
        const logDate = new Date(log.date);
        const logMonth = logDate.getMonth() + 1;
        const logYear = logDate.getFullYear();

        if (log.status === 'present') {
          if (logYear < reportYear || (logYear === reportYear && logMonth <= reportMonth)) {
            if (subjectStats[subjName]) subjectStats[subjName].cumAttended++;
            totalCumAttended++;
          }
          if (logYear === reportYear && logMonth === reportMonth) {
            if (subjectStats[subjName]) subjectStats[subjName].mlyAttended++;
            totalMlyAttended++;
          }
        }
      });

      subjectsList.forEach(s => {
        const mlyLec = s.mlyTotalLectures;
        const cumLec = s.cumTotalLectures;
        totalMlyLectures += mlyLec;
        totalCumLectures += cumLec;

        const st = subjectStats[s.subjectName] || { mlyAttended: 0, cumAttended: 0 };
        st.mlyPercentage = mlyLec > 0 ? Math.round((st.mlyAttended / mlyLec) * 100) : 0;
        st.cumPercentage = cumLec > 0 ? Math.round((st.cumAttended / cumLec) * 100) : 0;
      });

      const overallMlyPct = totalMlyLectures > 0 ? Math.round((totalMlyAttended / totalMlyLectures) * 100) : 0;
      const overallCumPct = totalCumLectures > 0 ? Math.round((totalCumAttended / totalCumLectures) * 100) : 0;

      studentRows.push({
        studentId: student._id,
        rollNumber: student.studentDetails ? student.studentDetails.rollNumber : 'N/A',
        studentName: student.name,
        branch: student.studentDetails ? student.studentDetails.branch : 'N/A',
        batch: student.studentDetails ? student.studentDetails.batch : 'N/A',
        subjectStats,
        overall: {
          totalMlyAttended,
          totalMlyLectures,
          overallMlyPct,
          totalCumAttended,
          totalCumLectures,
          overallCumPct
        }
      });
    }

    const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
    const reportMonthName = monthNames[reportMonth - 1] || 'July';

    res.json({
      success: true,
      header: {
        collegeTitle: "TCET | THAKUR COLLEGE OF ENGINEERING & TECHNOLOGY",
        subTitle: `Department: ${deptName} (${deptCode})`,
        reportTitle: `${deptCode} Overall Attendance (${reportMonthName} Monthly Attendance) ${reportYear} ${batch ? batch : ''}`,
        spanSummary: `Month wise and Span Wise Summary (Cr Yr Wise) Report for ${reportMonthName} ${reportYear}`,
        academicSession: `For Session ${reportYear}-${reportYear + 1} (ODD)`
      },
      filters: { departmentId: targetDeptId, branch, batch, month: reportMonth, year: reportYear },
      subjects: subjectsList,
      students: studentRows
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to generate monthly matrix report.', error: error.message });
  }
});

// Manual Register View Grid API (Photo 1 format)
router.get('/register-grid', verifyToken, authorizeRoles('superadmin', 'admin', 'faculty'), async (req, res) => {
  try {
    const { departmentId, branch, batch, subject } = req.query;

    let filter = {};
    if (departmentId) filter.department = departmentId;
    if (branch) filter.branch = new RegExp(`^${branch}$`, 'i');
    if (batch) filter.batch = new RegExp(`^${batch}$`, 'i');
    if (subject) filter.subject = new RegExp(`^${subject}$`, 'i');

    const lectures = await Lecture.find(filter)
      .populate('department')
      .populate('faculty', 'name email')
      .sort({ date: 1, timeSlot: 1 });

    let facultyName = 'Shruti Mishra';
    let subjectName = subject || (lectures.length > 0 ? lectures[0].subject : 'WD-TT (JS)');
    let yearText = '2nd Year';

    if (lectures.length > 0 && lectures[0].faculty) {
      facultyName = lectures[0].faculty.name;
    }

    const columns = lectures.map(lec => {
      const d = new Date(lec.date);
      const formattedDate = `${d.getDate()}/${d.getMonth() + 1}/${d.getFullYear().toString().slice(-2)}`;
      return {
        lectureId: lec._id,
        date: formattedDate,
        timeSlot: lec.timeSlot || '9:30am to 11:30am'
      };
    });

    let studentFilter = { role: 'student' };
    if (departmentId) studentFilter['studentDetails.department'] = departmentId;
    if (branch) studentFilter['studentDetails.branch'] = new RegExp(`^${branch}$`, 'i');
    if (batch) studentFilter['studentDetails.batch'] = new RegExp(`^${batch}$`, 'i');

    const students = await User.find(studentFilter)
      .select('-password')
      .sort({ 'studentDetails.rollNumber': 1, name: 1 });

    // Batch query all attendance logs for these lectures and students
    const lectureIds = columns.map(c => c.lectureId);
    const studentIds = students.map(s => s._id);
    const allAtt = await Attendance.find({
      lecture: { $in: lectureIds },
      student: { $in: studentIds }
    });

    const attMap = {};
    allAtt.forEach(a => {
      const key = `${a.lecture.toString()}_${a.student.toString()}`;
      attMap[key] = a.status;
    });

    const rows = [];
    const colTotalPresent = Array(columns.length).fill(0);

    for (let i = 0; i < students.length; i++) {
      const student = students[i];
      const statusPerCol = [];

      for (let c = 0; c < columns.length; c++) {
        const col = columns[c];
        const key = `${col.lectureId.toString()}_${student._id.toString()}`;
        const st = attMap[key] === 'present' ? 'P' : 'Ab';
        if (st === 'P') colTotalPresent[c]++;
        statusPerCol.push(st);
      }

      rows.push({
        srNo: i + 1,
        rollNo: student.studentDetails ? student.studentDetails.rollNumber : `BV25-SD${(i+1).toString().padStart(2, '0')}`,
        studentName: student.name,
        statusPerCol
      });
    }

    const columnSummaries = colTotalPresent.map(pCount => `${pCount}/${students.length}`);

    res.json({
      success: true,
      meta: {
        facultyName,
        subjectName,
        year: yearText,
        branch: branch || 'SD',
        batch: batch || 'Batch-5'
      },
      columns,
      students: rows,
      columnSummaries
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to generate register grid.', error: error.message });
  }
});

// Branch-wise Attendance Report
router.get('/branch', verifyToken, authorizeRoles('superadmin', 'admin'), async (req, res) => {
  try {
    const { departmentId, branch, batch } = req.query;

    let queryDept = departmentId;
    if (req.user.role === 'admin' && !queryDept) {
      if (req.user.departments && req.user.departments.length > 0) {
        queryDept = req.user.departments[0]._id || req.user.departments[0];
      }
    }

    let studentFilter = { role: 'student' };
    if (queryDept) studentFilter['studentDetails.department'] = queryDept;
    if (branch) studentFilter['studentDetails.branch'] = new RegExp(`^${branch}$`, 'i');
    if (batch) studentFilter['studentDetails.batch'] = new RegExp(`^${batch}$`, 'i');

    const students = await User.find(studentFilter)
      .select('-password')
      .populate('studentDetails.department')
      .sort({ 'studentDetails.rollNumber': 1, name: 1 });

    const studentIds = students.map(s => s._id);
    const logsMap = await getLogsByStudentMap(studentIds);

    let report = [];

    for (const student of students) {
      const logs = logsMap[student._id.toString()] || [];
      
      let presentCount = 0;
      let absentCount = 0;
      const history = logs.map(log => {
        if (log.status === 'present') presentCount++;
        if (log.status === 'absent') absentCount++;

        return {
          lectureId: log.lecture ? log.lecture._id : null,
          subject: log.lecture ? log.lecture.subject : 'N/A',
          date: log.date,
          status: log.status
        };
      });

      const totalLectures = presentCount + absentCount;
      const percentage = totalLectures > 0 ? ((presentCount / totalLectures) * 100).toFixed(1) + '%' : '0.0%';

      report.push({
        studentId: student._id,
        name: student.name,
        email: student.email,
        rollNumber: student.studentDetails ? student.studentDetails.rollNumber : 'N/A',
        branch: student.studentDetails ? student.studentDetails.branch : 'N/A',
        batch: student.studentDetails ? student.studentDetails.batch : 'N/A',
        department: student.studentDetails && student.studentDetails.department ? student.studentDetails.department.name : 'N/A',
        totalLectures,
        presentCount,
        absentCount,
        percentage,
        history
      });
    }

    res.json({
      success: true,
      count: report.length,
      filters: { departmentId: queryDept, branch, batch },
      report
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to generate branch report.', error: error.message });
  }
});

// Single Student Attendance Report
router.get('/student/:studentId', verifyToken, authorizeRoles('superadmin', 'admin', 'faculty'), async (req, res) => {
  try {
    const student = await User.findById(req.params.studentId)
      .select('-password')
      .populate('studentDetails.department');

    if (!student || student.role !== 'student') {
      return res.status(404).json({ success: false, message: 'Student not found.' });
    }

    const attendanceLogs = await Attendance.find({ student: student._id })
      .populate({
        path: 'lecture',
        populate: [
          { path: 'faculty', select: 'name email' },
          { path: 'department', select: 'name code' }
        ]
      })
      .sort({ date: -1 });

    let presentCount = 0;
    let absentCount = 0;

    const logs = attendanceLogs.map(log => {
      if (log.status === 'present') presentCount++;
      if (log.status === 'absent') absentCount++;

      const lecture = log.lecture || {};
      return {
        id: log._id,
        date: log.date,
        subject: lecture.subject || 'N/A',
        timeSlot: lecture.timeSlot || 'N/A',
        facultyName: lecture.faculty ? lecture.faculty.name : 'N/A',
        department: lecture.department ? lecture.department.name : 'N/A',
        branch: log.branch,
        batch: log.batch,
        status: log.status
      };
    });

    const totalLectures = presentCount + absentCount;
    const percentage = totalLectures > 0 ? ((presentCount / totalLectures) * 100).toFixed(1) + '%' : '0.0%';

    res.json({
      success: true,
      student: {
        id: student._id,
        name: student.name,
        email: student.email,
        rollNumber: student.studentDetails ? student.studentDetails.rollNumber : 'N/A',
        branch: student.studentDetails ? student.studentDetails.branch : 'N/A',
        batch: student.studentDetails ? student.studentDetails.batch : 'N/A',
        department: student.studentDetails && student.studentDetails.department ? student.studentDetails.department.name : 'N/A'
      },
      summary: {
        totalLectures,
        presentCount,
        absentCount,
        percentage
      },
      logs
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to generate single student report.', error: error.message });
  }
});

// All Students System/Department Summary Report
router.get('/all', verifyToken, authorizeRoles('superadmin', 'admin'), async (req, res) => {
  try {
    let filter = { role: 'student' };
    if (req.user.role === 'admin') {
      const adminDeptIds = req.user.departments.map(d => d._id || d);
      if (adminDeptIds.length > 0) {
        filter['studentDetails.department'] = { $in: adminDeptIds };
      }
    }

    const totalStudents = await User.countDocuments(filter);
    const totalFaculty = await User.countDocuments(req.user.role === 'admin' ? { role: 'faculty', departments: { $in: req.user.departments.map(d => d._id || d) } } : { role: 'faculty' });
    const totalDepartments = await Department.countDocuments();
    const totalLectures = await Lecture.countDocuments();

    res.json({
      success: true,
      summary: {
        totalStudents,
        totalFaculty,
        totalDepartments,
        totalLectures
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to generate overall report summary.', error: error.message });
  }
});

module.exports = router;
