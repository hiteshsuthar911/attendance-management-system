document.addEventListener('DOMContentLoaded', () => {
  const currentUser = Auth.requireRole(['faculty']);
  if (!currentUser) return;

  const facultyNameElem = document.getElementById('facultyName');
  if (facultyNameElem) facultyNameElem.textContent = currentUser.name;

  const facultyEmailElem = document.getElementById('facultyEmail');
  if (facultyEmailElem) facultyEmailElem.textContent = currentUser.email;

  const assignedDepts = currentUser.departments && currentUser.departments.length > 0
    ? currentUser.departments.map(d => `${d.name} (${d.code})`).join(', ')
    : 'None assigned';
  const facultyDeptElem = document.getElementById('facultyDept');
  if (facultyDeptElem) facultyDeptElem.textContent = assignedDepts;

  const logoutBtn = document.getElementById('logoutBtn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', (e) => {
      e.preventDefault();
      Auth.logout();
    });
  }

  let activeLectureId = null;
  let rosterStudents = [];

  const urlParams = new URLSearchParams(window.location.search);
  const paramLectureId = urlParams.get('lectureId');

  const loadLectures = async () => {
    try {
      const res = await fetch('/api/lectures', { headers: Auth.getHeaders() });
      const data = await res.json();
      const select = document.getElementById('lectureSelect');
      if (!select) return;

      select.innerHTML = '<option value="">-- Select a Scheduled Lecture Session --</option>';

      if (data.success && data.lectures) {
        data.lectures.forEach(lec => {
          const facultyName = lec.faculty ? lec.faculty.name : 'N/A';
          const formattedDate = new Date(lec.date).toLocaleDateString();
          const opt = document.createElement('option');
          opt.value = lec._id;
          opt.textContent = `[${formattedDate} ${lec.timeSlot}] ${lec.subject} - ${lec.branch}/${lec.batch} (${facultyName})`;
          select.appendChild(opt);
        });

        if (paramLectureId) {
          select.value = paramLectureId;
          loadRosterForLecture(paramLectureId);
        }
      }
    } catch (err) {
      console.error('Error loading lectures:', err);
    }
  };

  const loadStudentsBtn = document.getElementById('loadStudentsBtn');
  if (loadStudentsBtn) {
    loadStudentsBtn.addEventListener('click', (e) => {
      e.preventDefault();
      const select = document.getElementById('lectureSelect');
      const lectureId = select ? select.value : '';
      if (!lectureId) {
        alert('Please select a scheduled lecture session from the dropdown first.');
        return;
      }
      loadRosterForLecture(lectureId);
    });
  }

  const loadRosterForLecture = async (lectureId) => {
    activeLectureId = lectureId;
    const section = document.getElementById('attendanceSection');
    const rosterBody = document.getElementById('studentRosterBody');
    const msg = document.getElementById('attendanceMsg');

    if (section) section.style.display = 'block';
    if (rosterBody) rosterBody.innerHTML = '<tr><td colspan="4" align="center">Loading student roster...</td></tr>';
    if (msg) msg.textContent = '';

    try {
      const res = await fetch(`/api/attendance/students-for-lecture?lectureId=${lectureId}`, {
        headers: Auth.getHeaders()
      });
      const data = await res.json();

      if (data.success) {
        rosterStudents = data.students || [];

        if (rosterStudents.length === 0) {
          if (rosterBody) {
            rosterBody.innerHTML = '<tr><td colspan="4" align="center" style="color: red; font-weight: bold;">No registered students found for this lecture branch/batch.</td></tr>';
          }
          return;
        }

        let html = '';
        rosterStudents.forEach((st) => {
          const isPresent = st.status === 'present';
          html += `
            <tr>
              <td><b>${st.rollNumber || 'N/A'}</b></td>
              <td>${st.name}</td>
              <td>${st.branch || 'SD'} / ${st.batch || 'Batch-5'}</td>
              <td>
                <label style="margin-right: 20px; color: #16a34a; font-weight: 700; cursor: pointer;">
                  <input type="radio" name="att_${st._id}" value="present" ${isPresent ? 'checked' : ''}> Present (P)
                </label>
                <label style="color: #dc2626; font-weight: 700; cursor: pointer;">
                  <input type="radio" name="att_${st._id}" value="absent" ${!isPresent ? 'checked' : ''}> Absent (Ab)
                </label>
              </td>
            </tr>
          `;
        });

        if (rosterBody) rosterBody.innerHTML = html;
        if (section) section.scrollIntoView({ behavior: 'smooth' });
      } else {
        if (rosterBody) rosterBody.innerHTML = `<tr><td colspan="4" align="center" style="color: red;">${data.message || 'Failed to load roster.'}</td></tr>`;
      }
    } catch (err) {
      console.error(err);
      if (rosterBody) rosterBody.innerHTML = '<tr><td colspan="4" align="center" style="color: red;">Error connecting to server.</td></tr>';
    }
  };

  const markPresentBtn = document.getElementById('markAllPresentBtn');
  if (markPresentBtn) {
    markPresentBtn.addEventListener('click', (e) => {
      e.preventDefault();
      rosterStudents.forEach(st => {
        const rad = document.querySelector(`input[name="att_${st._id}"][value="present"]`);
        if (rad) rad.checked = true;
      });
    });
  }

  const markAbsentBtn = document.getElementById('markAllAbsentBtn');
  if (markAbsentBtn) {
    markAbsentBtn.addEventListener('click', (e) => {
      e.preventDefault();
      rosterStudents.forEach(st => {
        const rad = document.querySelector(`input[name="att_${st._id}"][value="absent"]`);
        if (rad) rad.checked = true;
      });
    });
  }

  const attendanceForm = document.getElementById('attendanceForm');
  if (attendanceForm) {
    attendanceForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      if (!activeLectureId) return;

      const msg = document.getElementById('attendanceMsg');
      const radioInputs = document.querySelectorAll('#studentRosterBody input[type="radio"]:checked');

      const attendanceRecords = [];
      radioInputs.forEach(input => {
        const studentId = input.name.replace('att_', '');
        attendanceRecords.push({ studentId, status: input.value });
      });

      if (msg) {
        msg.style.color = '#2563eb';
        msg.textContent = 'Saving attendance records...';
      }

      try {
        const res = await fetch('/api/attendance/mark', {
          method: 'POST',
          headers: Auth.getHeaders(),
          body: JSON.stringify({ lectureId: activeLectureId, attendanceRecords })
        });
        const data = await res.json();

        if (data.success) {
          if (msg) {
            msg.style.color = '#16a34a';
            msg.textContent = ' Attendance successfully recorded and lecture marked completed!';
          }
        } else {
          if (msg) {
            msg.style.color = '#dc2626';
            msg.textContent = data.message || 'Failed to submit attendance.';
          }
        }
      } catch (err) {
        if (msg) {
          msg.style.color = '#dc2626';
          msg.textContent = 'Error connecting to server.';
        }
      }
    });
  }

  loadLectures();
});
