document.addEventListener('DOMContentLoaded', () => {
  const currentUser = Auth.requireRole(['admin']);
  if (!currentUser) return;

  const nameElem = document.getElementById('adminName');
  if (nameElem) nameElem.textContent = currentUser.name;
  const emailElem = document.getElementById('adminEmail');
  if (emailElem) emailElem.textContent = currentUser.email;

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

  let managedDepartments = [];

  const loadDepartments = async () => {
    try {
      const res = await fetch('/api/departments', { headers: Auth.getHeaders() });
      const data = await res.json();
      if (data.success) {
        managedDepartments = data.departments;
        
        // Option 1: Handle Select dropdown id="facultyDept"
        const facultyDeptSelect = document.getElementById('facultyDept');
        if (facultyDeptSelect) {
          facultyDeptSelect.innerHTML = '<option value="">-- Select Department --</option>';
          managedDepartments.forEach(dept => {
            const opt = document.createElement('option');
            opt.value = dept._id;
            opt.textContent = `${dept.name} (${dept.code})`;
            if (currentUser.departments && currentUser.departments.some(d => (d._id || d).toString() === dept._id.toString())) {
              opt.selected = true;
            }
            facultyDeptSelect.appendChild(opt);
          });
        }

        // Option 2: Handle Checkboxes container id="facultyDeptCheckboxes"
        const facultyDeptCheckboxes = document.getElementById('facultyDeptCheckboxes');
        if (facultyDeptCheckboxes) {
          facultyDeptCheckboxes.innerHTML = '';
          if (managedDepartments.length === 0) {
            facultyDeptCheckboxes.innerHTML = '<p><i>No departments found. Contact Superadmin.</i></p>';
            return;
          }
          managedDepartments.forEach(dept => {
            const lbl = document.createElement('label');
            lbl.style.marginRight = '15px';
            lbl.innerHTML = `<input type="checkbox" name="facultyDept" value="${dept._id}" checked> ${dept.name} (${dept.code})`;
            facultyDeptCheckboxes.appendChild(lbl);
          });
        }
      }
    } catch (err) {
      console.error('Error loading departments:', err);
    }
  };

  const loadFaculties = async () => {
    try {
      const res = await fetch('/api/users?role=faculty', { headers: Auth.getHeaders() });
      const data = await res.json();
      const tbody = document.getElementById('facultyTableBody');
      if (!tbody) return;

      if (data.success) {
        if (data.users.length === 0) {
          tbody.innerHTML = '<tr><td colspan="5" align="center">No faculty members found. Create one above.</td></tr>';
          return;
        }

        tbody.innerHTML = '';
        data.users.forEach((fac, idx) => {
          const depts = fac.departments && fac.departments.length > 0
            ? fac.departments.map(d => `${d.name} (${d.code})`).join(', ')
            : 'Unassigned';

          const tr = document.createElement('tr');
          tr.innerHTML = `
            <td>${idx + 1}</td>
            <td><b>${fac.name}</b></td>
            <td>${fac.email}</td>
            <td>${depts}</td>
            <td>
              <button type="button" class="manage-fac-depts-btn" data-id="${fac._id}" style="padding: 3px 8px; margin-right: 5px;">Manage Departments</button>
              <button type="button" class="delete-user-btn" data-id="${fac._id}" style="color: red; padding: 3px 8px;">Delete</button>
            </td>
          `;
          tbody.appendChild(tr);

          let facDeptCheckboxes = managedDepartments.map(d => {
            const isAssigned = fac.departments && fac.departments.some(fd => (fd._id || fd).toString() === d._id.toString());
            return `<label style="margin-right: 15px;"><input type="checkbox" class="fac-dept-cb-${fac._id}" value="${d._id}" ${isAssigned ? 'checked' : ''}> ${d.name} (${d.code})</label>`;
          }).join('');

          const deptTr = document.createElement('tr');
          deptTr.id = `fac_dept_manage_row_${fac._id}`;
          deptTr.style.display = 'none';
          deptTr.style.backgroundColor = '#f9f9f9';
          deptTr.innerHTML = `
            <td colspan="5">
              <fieldset style="margin: 5px; padding: 10px;">
                <legend><b>Assign Departments for ${fac.name}</b></legend>
                <div>${facDeptCheckboxes || 'No departments available.'}</div>
                <p style="margin-top: 10px;">
                  <button type="button" class="save-fac-depts-btn" data-id="${fac._id}" style="padding: 4px 12px; margin-right: 5px; color: green;"><b>Save Departments</b></button>
                  <button type="button" class="cancel-fac-depts-btn" data-id="${fac._id}" style="padding: 4px 12px;">Cancel</button>
                </p>
                <p id="fac_dept_msg_${fac._id}"></p>
              </fieldset>
            </td>
          `;
          tbody.appendChild(deptTr);
        });

        document.querySelectorAll('#facultyTableBody .manage-fac-depts-btn').forEach(btn => {
          btn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            const id = e.currentTarget.dataset.id;
            const row = document.getElementById(`fac_dept_manage_row_${id}`);
            if (row) row.style.display = row.style.display === 'none' ? 'table-row' : 'none';
          });
        });

        document.querySelectorAll('.cancel-fac-depts-btn').forEach(btn => {
          btn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            const id = e.currentTarget.dataset.id;
            const row = document.getElementById(`fac_dept_manage_row_${id}`);
            if (row) row.style.display = 'none';
          });
        });

        document.querySelectorAll('.save-fac-depts-btn').forEach(btn => {
          btn.addEventListener('click', async (e) => {
            e.preventDefault();
            e.stopPropagation();
            const id = e.currentTarget.dataset.id;
            await saveFacultyDepartments(id);
          });
        });

        document.querySelectorAll('#facultyTableBody .delete-user-btn').forEach(btn => {
          btn.addEventListener('click', async (e) => {
            e.preventDefault();
            e.stopPropagation();
            const b = e.currentTarget;
            if (b.dataset.confirming === 'true') {
              await deleteUser(b.dataset.id, loadFaculties);
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
      console.error('Error loading faculties:', err);
    }
  };

  const saveFacultyDepartments = async (facultyId) => {
    const msg = document.getElementById(`fac_dept_msg_${facultyId}`);
    const selectedIds = [];
    document.querySelectorAll(`.fac-dept-cb-${facultyId}:checked`).forEach(cb => {
      selectedIds.push(cb.value);
    });

    try {
      const res = await fetch(`/api/users/${facultyId}/departments`, {
        method: 'PUT',
        headers: Auth.getHeaders(),
        body: JSON.stringify({ departmentIds: selectedIds })
      });
      const data = await res.json();
      if (data.success) {
        if (msg) {
          msg.style.color = 'green';
          msg.textContent = 'Faculty departments updated successfully!';
        }
        setTimeout(async () => {
          await loadFaculties();
        }, 500);
      } else {
        if (msg) {
          msg.style.color = 'red';
          msg.textContent = data.message || 'Failed to update faculty departments.';
        }
      }
    } catch (err) {
      if (msg) {
        msg.style.color = 'red';
        msg.textContent = 'Error updating faculty departments.';
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

  const form = document.getElementById('createFacultyForm');
  if (form) {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const nameInput = document.getElementById('facultyName');
      const emailInput = document.getElementById('facultyEmail');
      const passInput = document.getElementById('facultyPassword');
      const deptSelect = document.getElementById('facultyDept');
      const facultyMsg = document.getElementById('facultyMsg');

      const name = nameInput ? nameInput.value.trim() : '';
      const email = emailInput ? emailInput.value.trim() : '';
      const password = passInput ? passInput.value.trim() : '';

      const selectedDepts = [];
      if (deptSelect && deptSelect.value) {
        selectedDepts.push(deptSelect.value);
      } else {
        document.querySelectorAll('input[name="facultyDept"]:checked').forEach(cb => {
          selectedDepts.push(cb.value);
        });
      }

      if (facultyMsg) {
        facultyMsg.style.color = 'blue';
        facultyMsg.textContent = 'Creating faculty member in MongoDB Atlas Cloud...';
      }

      try {
        const res = await fetch('/api/users/faculty', {
          method: 'POST',
          headers: Auth.getHeaders(),
          body: JSON.stringify({ name, email, password, departmentIds: selectedDepts })
        });
        const data = await res.json();

        if (res.ok && data.success) {
          if (facultyMsg) {
            facultyMsg.style.color = 'green';
            facultyMsg.textContent = `Faculty ${name} created successfully in MongoDB Atlas Cloud!`;
          }
          form.reset();
          await loadFaculties();
        } else {
          if (facultyMsg) {
            facultyMsg.style.color = 'red';
            facultyMsg.textContent = data.message || 'Failed to create faculty.';
          }
        }
      } catch (err) {
        if (facultyMsg) {
          facultyMsg.style.color = 'red';
          facultyMsg.textContent = 'Server error creating faculty: ' + err.message;
        }
      }
    });
  }

  loadDepartments().then(loadFaculties);
});
