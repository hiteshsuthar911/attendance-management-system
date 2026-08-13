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

  // ── Time Slot Picker Logic ────────────────────────────────────
  const startTimeInput = document.getElementById('timeStartInput');
  const endTimeInput = document.getElementById('timeEndInput');
  const slotHiddenInput = document.getElementById('timeSlot');
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

  const createForm = document.getElementById('createLectureForm');
  if (createForm) {
    createForm.addEventListener('submit', async (e) => {
      e.preventDefault();

      const subject = (document.getElementById('subjectName')?.value || '').trim();
      const branch = (document.getElementById('lectureBranch')?.value || '').trim();
      const batch = (document.getElementById('lectureBatch')?.value || '').trim();
      const date = document.getElementById('lectureDate')?.value || '';
      const timeSlot = (document.getElementById('timeSlot')?.value || '').trim() || '9:30am to 11:30am';
      const msg = document.getElementById('lectureMsg');

      const departmentId = (currentUser.departments && currentUser.departments.length > 0)
        ? currentUser.departments[0]._id || currentUser.departments[0]
        : undefined;

      try {
        const res = await fetch('/api/lectures', {
          method: 'POST',
          headers: Auth.getHeaders(),
          body: JSON.stringify({ subject, departmentId, branch, batch, date, timeSlot })
        });
        const data = await res.json();

        if (data.success) {
          if (msg) {
            msg.style.color = '#16a34a';
            msg.textContent = '✔ Lecture scheduled successfully! Opening attendance sheet...';
          }
          createForm.reset();
          setTimeout(() => {
            window.location.href = `/faculty/attendance.html?lectureId=${data.lecture._id}`;
          }, 800);
        } else {
          if (msg) {
            msg.style.color = '#dc2626';
            msg.textContent = data.message || 'Failed to create lecture.';
          }
        }
      } catch (err) {
        if (msg) {
          msg.style.color = '#dc2626';
          msg.textContent = 'Server error creating lecture.';
        }
      }
    });
  }
});
