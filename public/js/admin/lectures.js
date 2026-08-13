document.addEventListener('DOMContentLoaded', () => {
  const currentUser = Auth.requireRole(['admin']);
  if (!currentUser) return;

  const adminNameElem = document.getElementById('adminName');
  if (adminNameElem) adminNameElem.textContent = currentUser.name;

  const adminEmailElem = document.getElementById('adminEmail');
  if (adminEmailElem) adminEmailElem.textContent = currentUser.email;

  const adminDeptText = currentUser.departments && currentUser.departments.length > 0
    ? currentUser.departments.map(d => `${d.name} (${d.code})`).join(', ')
    : 'All Managed Departments';
  const adminDeptListElem = document.getElementById('adminDeptList');
  if (adminDeptListElem) adminDeptListElem.textContent = adminDeptText;

  const logoutBtn = document.getElementById('logoutBtn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', (e) => {
      e.preventDefault();
      Auth.logout();
    });
  }

  // ── Time Slot Picker Logic ────────────────────────────────────
  const startTimeInput = document.getElementById('timeStartInput');
  const endTimeInput = document.getElementById('timeEndInput');
  const slotHiddenInput = document.getElementById('lectureSlot');
  const chipContainer = document.getElementById('timeSlotChips');

  const format24to12 = (time24) => {
    if (!time24) return '';
    const [hStr, mStr] = time24.split(':');
    let h = parseInt(hStr, 10);
    const ampm = h >= 12 ? 'pm' : 'am';
    h = h % 12 || 12;
    return `${h}:${mStr}${ampm}`;
  };

  const updateTimeSlotFromInputs = () => {
    if (!startTimeInput || !endTimeInput || !slotHiddenInput) return;
    const start12 = format24to12(startTimeInput.value);
    const end12 = format24to12(endTimeInput.value);
    if (start12 && end12) {
      slotHiddenInput.value = `${start12} to ${end12}`;
    }

    if (chipContainer) {
      chipContainer.querySelectorAll('.timeslot-chip').forEach(chip => {
        const isMatch = chip.dataset.start === startTimeInput.value && chip.dataset.end === endTimeInput.value;
        chip.classList.toggle('active', isMatch);
      });
    }
  };

  if (startTimeInput && endTimeInput) {
    startTimeInput.addEventListener('change', updateTimeSlotFromInputs);
    endTimeInput.addEventListener('change', updateTimeSlotFromInputs);
  }

  if (chipContainer) {
    chipContainer.querySelectorAll('.timeslot-chip').forEach(chip => {
      chip.addEventListener('click', () => {
        chipContainer.querySelectorAll('.timeslot-chip').forEach(c => c.classList.remove('active'));
        chip.classList.add('active');

        if (startTimeInput && chip.dataset.start) startTimeInput.value = chip.dataset.start;
        if (endTimeInput && chip.dataset.end) endTimeInput.value = chip.dataset.end;
        if (slotHiddenInput && chip.dataset.slot) slotHiddenInput.value = chip.dataset.slot;
      });
    });
  }

  let allFaculties = [];

  const loadFacultiesAndDepts = async () => {
    try {
      const [facRes, deptRes] = await Promise.all([
        fetch('/api/users?role=faculty', { headers: Auth.getHeaders() }),
        fetch('/api/departments', { headers: Auth.getHeaders() })
      ]);

      const facData = await facRes.json();
      const deptData = await deptRes.json();

      if (facData.success) {
        allFaculties = facData.users || facData.faculties || [];
        const facSelect = document.getElementById('lectureFaculty');
        if (facSelect) {
          facSelect.innerHTML = '<option value="">-- No Primary Faculty (Optional) --</option>';
          allFaculties.forEach(fac => {
            const opt = document.createElement('option');
            opt.value = fac._id;
            opt.textContent = `${fac.name} (${fac.email})`;
            facSelect.appendChild(opt);
          });
          if (allFaculties.length > 0) {
            facSelect.selectedIndex = 1;
          }
        }
      }

      if (deptData.success && deptData.departments) {
        const deptSelect = document.getElementById('lectureDept');
        if (deptSelect) {
          deptSelect.innerHTML = '<option value="">-- Select Department --</option>';
          deptData.departments.forEach(dept => {
            const opt = document.createElement('option');
            opt.value = dept._id;
            opt.textContent = `${dept.name} (${dept.code})`;
            deptSelect.appendChild(opt);
          });

          // Auto-select admin's managed department
          const adminDeptId = (currentUser.departments && currentUser.departments.length > 0)
            ? (currentUser.departments[0]._id || currentUser.departments[0])
            : null;

          if (adminDeptId) {
            deptSelect.value = adminDeptId;
          } else if (deptData.departments.length > 0) {
            deptSelect.selectedIndex = 1;
          }
        }
      }
    } catch (err) {
      console.error('Error loading faculties/departments:', err);
    }
  };

  const loadLectures = async () => {
    const tbody = document.getElementById('lecturesTableBody');
    if (!tbody) return;
    tbody.innerHTML = '<tr><td colspan="7" align="center">Loading lecture schedule...</td></tr>';

    try {
      const res = await fetch('/api/lectures', { headers: Auth.getHeaders() });
      const data = await res.json();

      if (data.success && data.lectures && data.lectures.length > 0) {
        let html = '';
        data.lectures.forEach(lec => {
          const formattedDate = new Date(lec.date).toLocaleDateString();
          const primaryName = lec.faculty ? lec.faculty.name : 'Unassigned';
          const subName = lec.substituteFaculty ? lec.substituteFaculty.name : 'None';

          let subOptions = '<option value="">-- No Substitute (Primary Only) --</option>';
          allFaculties.forEach(f => {
            const isSelected = lec.substituteFaculty && (lec.substituteFaculty._id === f._id || lec.substituteFaculty === f._id);
            subOptions += `<option value="${f._id}" ${isSelected ? 'selected' : ''}>${f.name}</option>`;
          });

          html += `
            <tr>
              <td><b>${formattedDate}</b><br><small style="color: var(--text-secondary);">${lec.timeSlot}</small></td>
              <td><b>${lec.subject}</b></td>
              <td>${lec.branch || 'SD'} / ${lec.batch || 'Batch-5'}</td>
              <td>${primaryName}</td>
              <td><b style="color: ${lec.substituteFaculty ? '#2563eb' : '#475569'};">${subName}</b></td>
              <td>
                <select id="subSelect_${lec._id}" style="font-size: 11.5px; padding: 4px;">
                  ${subOptions}
                </select>
                <button type="button" onclick="window.updateSubstitute('${lec._id}')" style="font-size: 11px; padding: 3px 8px;">Save</button>
              </td>
              <td>
                <button type="button" onclick="window.deleteLecture('${lec._id}')" style="background: #fef2f2; color: #dc2626; border-color: #fecaca; font-size: 11px; padding: 3px 8px;">Delete</button>
              </td>
            </tr>
          `;
        });

        tbody.innerHTML = html;
      } else {
        tbody.innerHTML = '<tr><td colspan="7" align="center">No scheduled lectures found.</td></tr>';
      }
    } catch (err) {
      console.error(err);
      tbody.innerHTML = '<tr><td colspan="7" align="center" style="color: red;">Error loading lectures from server.</td></tr>';
    }
  };

  window.updateSubstitute = async (lectureId) => {
    const select = document.getElementById(`subSelect_${lectureId}`);
    const substituteFacultyId = select ? select.value : '';

    try {
      const res = await fetch(`/api/lectures/${lectureId}/substitute`, {
        method: 'PUT',
        headers: Auth.getHeaders(),
        body: JSON.stringify({ substituteFacultyId })
      });
      const data = await res.json();
      if (data.success) {
        loadLectures();
      } else {
        alert(data.message || 'Failed to update substitute faculty.');
      }
    } catch (err) {
      alert('Error updating substitute faculty.');
    }
  };

  window.deleteLecture = async (lectureId) => {
    if (!confirm('Are you sure you want to delete this lecture session?')) return;
    try {
      const res = await fetch(`/api/lectures/${lectureId}`, {
        method: 'DELETE',
        headers: Auth.getHeaders()
      });
      const data = await res.json();
      if (data.success) {
        loadLectures();
      } else {
        alert(data.message || 'Failed to delete lecture.');
      }
    } catch (err) {
      alert('Error deleting lecture.');
    }
  };

  const createForm = document.getElementById('createLectureForm');
  if (createForm) {
    createForm.addEventListener('submit', async (e) => {
      e.preventDefault();

      const subject = (document.getElementById('subjectName')?.value || '').trim();
      const rawFacultyId = document.getElementById('lectureFaculty')?.value;
      const facultyId = (rawFacultyId && rawFacultyId.trim().length > 0) ? rawFacultyId : undefined;
      const departmentId = document.getElementById('lectureDept')?.value;
      const branch = (document.getElementById('lectureBranch')?.value || '').trim();
      const batch = (document.getElementById('lectureBatch')?.value || '').trim();
      const date = document.getElementById('lectureDate')?.value;
      const timeSlot = (document.getElementById('lectureSlot')?.value || '').trim() || '9:30am to 11:30am';
      const lectureMsg = document.getElementById('lectureMsg');

      if (!departmentId) {
        if (lectureMsg) {
          lectureMsg.style.color = '#dc2626';
          lectureMsg.textContent = 'Please select a department for the lecture.';
        }
        return;
      }

      if (lectureMsg) lectureMsg.textContent = '';

      try {
        const res = await fetch('/api/lectures', {
          method: 'POST',
          headers: Auth.getHeaders(),
          body: JSON.stringify({ subject, departmentId, branch, batch, facultyId, date, timeSlot })
        });
        const data = await res.json();

        if (data.success) {
          if (lectureMsg) {
            lectureMsg.style.color = '#16a34a';
            lectureMsg.textContent = ' Lecture session scheduled successfully!';
          }
          createForm.reset();
          loadFacultiesAndDepts().then(loadLectures);
        } else {
          if (lectureMsg) {
            lectureMsg.style.color = '#dc2626';
            lectureMsg.textContent = data.message || 'Failed to schedule lecture.';
          }
        }
      } catch (err) {
        if (lectureMsg) {
          lectureMsg.style.color = '#dc2626';
          lectureMsg.textContent = 'Server error creating lecture.';
        }
      }
    });
  }

  loadFacultiesAndDepts().then(loadLectures);
});
