document.addEventListener('DOMContentLoaded', () => {
  const currentUser = Auth.requireRole(['admin']);
  if (!currentUser) return;

  const adminNameElem = document.getElementById('adminName');
  if (adminNameElem) adminNameElem.textContent = currentUser.name;
  const adminEmailElem = document.getElementById('adminEmail');
  if (adminEmailElem) adminEmailElem.textContent = currentUser.email;

  const adminDeptText = currentUser.departments && currentUser.departments.length > 0
    ? currentUser.departments.map(d => `${d.name} (${d.code})`).join(', ')
    : 'All Departments';
  const adminDeptListElem = document.getElementById('adminDeptList');
  if (adminDeptListElem) adminDeptListElem.textContent = adminDeptText;

  const logoutBtn = document.getElementById('logoutBtn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', (e) => {
      e.preventDefault();
      Auth.logout();
    });
  }

  const loadDepartments = async () => {
    try {
      const res = await fetch('/api/departments', { headers: Auth.getHeaders() });
      const data = await res.json();
      const select = document.getElementById('studentDept') || document.getElementById('studentDepartment');
      if (!select) return;

      if (data.success) {
        select.innerHTML = '<option value="">-- Select Department --</option>';

        data.departments.forEach(dept => {
          const opt = document.createElement('option');
          opt.value = dept._id;
          opt.textContent = `${dept.name} (${dept.code})`;
          
          // Auto-select if admin manages this department
          if (currentUser.departments && currentUser.departments.some(d => (d._id || d).toString() === dept._id.toString())) {
            opt.selected = true;
          }
          select.appendChild(opt);
        });
      }
    } catch (err) {
      console.error('Error loading departments:', err);
    }
  };

  const loadStudents = async () => {
    const branchElem = document.getElementById('filterBranch');
    const batchElem = document.getElementById('filterBatch');
    const branch = branchElem ? branchElem.value.trim() : '';
    const batch = batchElem ? batchElem.value.trim() : '';

    let url = '/api/users?role=student';
    if (branch) url += `&branch=${encodeURIComponent(branch)}`;
    if (batch) url += `&batch=${encodeURIComponent(batch)}`;

    try {
      const res = await fetch(url, { headers: Auth.getHeaders() });
      const data = await res.json();
      const tbody = document.getElementById('studentTableBody');
      if (!tbody) return;

      if (data.success) {
        if (data.users.length === 0) {
          tbody.innerHTML = '<tr><td colspan="8" align="center">No enrolled students found. Register a student above.</td></tr>';
          return;
        }

        tbody.innerHTML = '';
        data.users.forEach((s, idx) => {
          const sd = s.studentDetails || {};
          const deptName = sd.department ? (sd.department.name || 'N/A') : 'N/A';

          const tr = document.createElement('tr');
          tr.innerHTML = `
            <td>${idx + 1}</td>
            <td><b>${sd.rollNumber || 'N/A'}</b></td>
            <td>${s.name}</td>
            <td>${s.email}</td>
            <td>${sd.branch || 'N/A'}</td>
            <td>${sd.batch || 'N/A'}</td>
            <td>${deptName}</td>
            <td>
              <button type="button" class="edit-student-btn" data-id="${s._id}" style="padding: 3px 6px; margin-right: 3px;">Edit</button>
              <button type="button" class="delete-user-btn" data-id="${s._id}" style="color: red; padding: 3px 6px;">Delete</button>
            </td>
          `;
          tbody.appendChild(tr);

          const editTr = document.createElement('tr');
          editTr.id = `edit_student_row_${s._id}`;
          editTr.style.display = 'none';
          editTr.style.backgroundColor = '#f9f9f9';
          editTr.innerHTML = `
            <td colspan="8">
              <fieldset style="margin: 5px; padding: 10px;">
                <legend><b>Edit Student Details for ${s.name}</b></legend>
                <p>
                  <label><b>Full Name:</b></label><br>
                  <input type="text" id="edit_st_name_${s._id}" value="${s.name}" style="width: 250px; padding: 4px;">
                </p>
                <p>
                  <label><b>Roll Number:</b></label><br>
                  <input type="text" id="edit_st_roll_${s._id}" value="${sd.rollNumber || ''}" style="width: 200px; padding: 4px;">
                </p>
                <p>
                  <label><b>Branch:</b></label><br>
                  <input type="text" id="edit_st_branch_${s._id}" value="${sd.branch || ''}" style="width: 250px; padding: 4px;">
                </p>
                <p>
                  <label><b>Batch:</b></label><br>
                  <input type="text" id="edit_st_batch_${s._id}" value="${sd.batch || ''}" style="width: 250px; padding: 4px;">
                </p>
                <p>
                  <button type="button" class="save-student-edit-btn" data-id="${s._id}" style="padding: 4px 12px; margin-right: 5px; color: green;"><b>Save Student Details</b></button>
                  <button type="button" class="cancel-student-edit-btn" data-id="${s._id}" style="padding: 4px 12px;">Cancel</button>
                </p>
                <p id="edit_st_msg_${s._id}"></p>
              </fieldset>
            </td>
          `;
          tbody.appendChild(editTr);
        });

        document.querySelectorAll('.edit-student-btn').forEach(btn => {
          btn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            const id = e.currentTarget.dataset.id;
            const row = document.getElementById(`edit_student_row_${id}`);
            if (row) row.style.display = row.style.display === 'none' ? 'table-row' : 'none';
          });
        });

        document.querySelectorAll('.cancel-student-edit-btn').forEach(btn => {
          btn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            const id = e.currentTarget.dataset.id;
            const row = document.getElementById(`edit_student_row_${id}`);
            if (row) row.style.display = 'none';
          });
        });

        document.querySelectorAll('.save-student-edit-btn').forEach(btn => {
          btn.addEventListener('click', async (e) => {
            e.preventDefault();
            e.stopPropagation();
            const id = e.currentTarget.dataset.id;
            await saveStudentEdit(id);
          });
        });

        document.querySelectorAll('#studentTableBody .delete-user-btn').forEach(btn => {
          btn.addEventListener('click', async (e) => {
            e.preventDefault();
            e.stopPropagation();
            const b = e.currentTarget;
            if (b.dataset.confirming === 'true') {
              await deleteUser(b.dataset.id, loadStudents);
            } else {
              b.dataset.confirming = 'true';
              b.textContent = 'Confirm Delete?';
              b.style.backgroundColor = 'red';
              b.style.color = 'white';
              setTimeout(() => {
                b.dataset.confirming = 'false';
                b.textContent = 'Delete';
                b.style.backgroundColor = '';
                b.style.color = 'red';
              }, 4000);
            }
          });
        });
      }
    } catch (err) {
      console.error('Error loading students:', err);
    }
  };

  const saveStudentEdit = async (id) => {
    const nameInput = document.getElementById(`edit_st_name_${id}`);
    const rollInput = document.getElementById(`edit_st_roll_${id}`);
    const branchInput = document.getElementById(`edit_st_branch_${id}`);
    const batchInput = document.getElementById(`edit_st_batch_${id}`);
    const msg = document.getElementById(`edit_st_msg_${id}`);

    const name = nameInput ? nameInput.value.trim() : '';
    const rollNumber = rollInput ? rollInput.value.trim() : '';
    const branch = branchInput ? branchInput.value.trim() : '';
    const batch = batchInput ? batchInput.value.trim() : '';

    try {
      const res = await fetch(`/api/users/${id}`, {
        method: 'PUT',
        headers: Auth.getHeaders(),
        body: JSON.stringify({ name, rollNumber, branch, batch })
      });
      const data = await res.json();
      if (data.success) {
        if (msg) {
          msg.style.color = 'green';
          msg.textContent = 'Student updated successfully!';
        }
        setTimeout(async () => {
          await loadStudents();
        }, 500);
      } else {
        if (msg) {
          msg.style.color = 'red';
          msg.textContent = data.message || 'Failed to update student.';
        }
      }
    } catch (err) {
      if (msg) {
        msg.style.color = 'red';
        msg.textContent = 'Error updating student.';
      }
    }
  };

  const deleteUser = async (id, callback) => {
    try {
      const res = await fetch(`/api/users/${id}`, {
        method: 'DELETE',
        headers: Auth.getHeaders()
      });
      const data = await res.json();
      if (data.success) {
        if (callback) await callback();
      } else {
        alert(data.message || 'Failed to delete user.');
      }
    } catch (err) {
      alert('Error deleting user.');
    }
  };

  const filterBtn = document.getElementById('filterStudentsBtn');
  if (filterBtn) {
    filterBtn.addEventListener('click', (e) => {
      e.preventDefault();
      loadStudents();
    });
  }

  const form = document.getElementById('createStudentForm');
  if (form) {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const nameInput = document.getElementById('studentName');
      const emailInput = document.getElementById('studentEmail');
      const passInput = document.getElementById('studentPassword');
      const rollInput = document.getElementById('studentRoll');
      const branchInput = document.getElementById('studentBranch');
      const batchInput = document.getElementById('studentBatch');
      const deptSelect = document.getElementById('studentDept') || document.getElementById('studentDepartment');
      const studentMsg = document.getElementById('studentMsg');

      const name = nameInput ? nameInput.value.trim() : '';
      const email = emailInput ? emailInput.value.trim() : '';
      const password = passInput ? passInput.value.trim() : '';
      const rollNumber = rollInput ? rollInput.value.trim() : '';
      const branch = branchInput ? branchInput.value.trim() : '';
      const batch = batchInput ? batchInput.value.trim() : '';
      const departmentId = deptSelect ? deptSelect.value : '';

      if (!departmentId) {
        if (studentMsg) {
          studentMsg.style.color = 'red';
          studentMsg.textContent = 'Please select a department for the student.';
        }
        return;
      }

      if (studentMsg) {
        studentMsg.style.color = 'blue';
        studentMsg.textContent = 'Enrolling student in MongoDB Atlas Cloud...';
      }

      try {
        const res = await fetch('/api/users/student', {
          method: 'POST',
          headers: Auth.getHeaders(),
          body: JSON.stringify({ name, email, password, rollNumber, branch, batch, departmentId })
        });
        const data = await res.json();

        if (res.ok && data.success) {
          if (studentMsg) {
            studentMsg.style.color = 'green';
            studentMsg.textContent = `Student ${name} enrolled successfully in MongoDB Atlas Cloud!`;
          }
          form.reset();
          await loadStudents();
        } else {
          if (studentMsg) {
            studentMsg.style.color = 'red';
            studentMsg.textContent = data.message || 'Failed to register student.';
          }
        }
      } catch (err) {
        if (studentMsg) {
          studentMsg.style.color = 'red';
          studentMsg.textContent = 'Server error registering student: ' + err.message;
        }
      }
    });
  }

  loadDepartments().then(loadStudents);
});
