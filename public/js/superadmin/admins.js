document.addEventListener('DOMContentLoaded', () => {
  const currentUser = Auth.requireRole(['superadmin']);
  if (!currentUser) return;

  const sName = document.getElementById('superadminName');
  if (sName) sName.textContent = currentUser.name;
  const sEmail = document.getElementById('superadminEmail');
  if (sEmail) sEmail.textContent = currentUser.email;

  const logoutBtn = document.getElementById('logoutBtn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', (e) => {
      e.preventDefault();
      Auth.logout();
    });
  }

  let departmentsList = [];

  const loadDepartmentsForCheckboxes = async () => {
    try {
      const res = await fetch('/api/departments', { headers: Auth.getHeaders() });
      const data = await res.json();
      const container = document.getElementById('adminDeptCheckboxes');
      if (!container) return;

      if (data.success) {
        departmentsList = data.departments;
        if (data.departments.length === 0) {
          container.innerHTML = '<p style="color: #666;"><i>No departments available yet. Please create a department first under "Manage Departments".</i></p>';
          return;
        }

        container.innerHTML = '';
        data.departments.forEach(dept => {
          const lbl = document.createElement('label');
          lbl.style.marginRight = '18px';
          lbl.style.display = 'inline-block';
          lbl.style.marginBottom = '5px';
          lbl.innerHTML = `<input type="checkbox" name="adminDept" value="${dept._id}"> <b>${dept.name}</b> (${dept.code})`;
          container.appendChild(lbl);
        });
      }
    } catch (err) {
      console.error('Error loading departments:', err);
    }
  };

  const loadAdmins = async () => {
    try {
      const res = await fetch('/api/users?role=admin', { headers: Auth.getHeaders() });
      const data = await res.json();
      const tbody = document.getElementById('adminTableBody');
      if (!tbody) return;

      if (data.success) {
        if (data.users.length === 0) {
          tbody.innerHTML = '<tr><td colspan="6" align="center">No department admins created yet.</td></tr>';
          return;
        }

        tbody.innerHTML = '';
        data.users.forEach((admin, idx) => {
          const deptNames = admin.departments && admin.departments.length > 0
            ? admin.departments.map(d => `${d.name} (${d.code})`).join(', ')
            : 'Unassigned';

          const tr = document.createElement('tr');
          tr.innerHTML = `
            <td>${idx + 1}</td>
            <td><b>${admin.name}</b></td>
            <td>${admin.email}</td>
            <td>${deptNames}</td>
            <td>${new Date(admin.createdAt).toLocaleDateString()}</td>
            <td>
              <button type="button" class="edit-admin-depts-btn" data-id="${admin._id}" style="padding: 3px 8px; margin-right: 5px;">Manage Departments</button>
              <button type="button" class="delete-user-btn" data-id="${admin._id}" style="color: red; padding: 3px 8px;">Delete</button>
            </td>
          `;
          tbody.appendChild(tr);

          let deptCheckboxesHtml = departmentsList.map(d => {
            const isAssigned = admin.departments && admin.departments.some(ad => (ad._id || ad).toString() === d._id.toString());
            return `<label style="margin-right: 15px;"><input type="checkbox" class="admin-dept-cb-${admin._id}" value="${d._id}" ${isAssigned ? 'checked' : ''}> ${d.name} (${d.code})</label>`;
          }).join('');

          if (!deptCheckboxesHtml) deptCheckboxesHtml = '<p><i>No departments available.</i></p>';

          const deptTr = document.createElement('tr');
          deptTr.id = `dept_manage_row_${admin._id}`;
          deptTr.style.display = 'none';
          deptTr.style.backgroundColor = '#f9f9f9';
          deptTr.innerHTML = `
            <td colspan="6">
              <fieldset style="margin: 5px; padding: 10px;">
                <legend><b>Assign Departments for ${admin.name}</b></legend>
                <div>${deptCheckboxesHtml}</div>
                <p style="margin-top: 10px;">
                  <button type="button" class="save-admin-depts-btn" data-id="${admin._id}" style="padding: 4px 12px; margin-right: 5px; color: green;"><b>Save Assigned Departments</b></button>
                  <button type="button" class="cancel-admin-depts-btn" data-id="${admin._id}" style="padding: 4px 12px;">Cancel</button>
                </p>
                <p id="manage_admin_dept_msg_${admin._id}"></p>
              </fieldset>
            </td>
          `;
          tbody.appendChild(deptTr);
        });

        document.querySelectorAll('.edit-admin-depts-btn').forEach(btn => {
          btn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            const id = e.currentTarget.dataset.id;
            const row = document.getElementById(`dept_manage_row_${id}`);
            if (row) row.style.display = row.style.display === 'none' ? 'table-row' : 'none';
          });
        });

        document.querySelectorAll('.cancel-admin-depts-btn').forEach(btn => {
          btn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            const id = e.currentTarget.dataset.id;
            const row = document.getElementById(`dept_manage_row_${id}`);
            if (row) row.style.display = 'none';
          });
        });

        document.querySelectorAll('.save-admin-depts-btn').forEach(btn => {
          btn.addEventListener('click', async (e) => {
            e.preventDefault();
            e.stopPropagation();
            const id = e.currentTarget.dataset.id;
            await saveUserDepartments(id, `.admin-dept-cb-${id}`, `manage_admin_dept_msg_${id}`, loadAdmins);
          });
        });

        document.querySelectorAll('.delete-user-btn').forEach(btn => {
          btn.addEventListener('click', async (e) => {
            e.preventDefault();
            e.stopPropagation();
            const b = e.currentTarget;
            if (b.dataset.confirming === 'true') {
              await deleteUser(b.dataset.id, loadAdmins);
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
      console.error('Error loading admins:', err);
    }
  };

  const saveUserDepartments = async (userId, checkboxSelector, msgElemId, callback) => {
    const msg = document.getElementById(msgElemId);
    const selectedIds = [];
    document.querySelectorAll(checkboxSelector + ':checked').forEach(cb => {
      selectedIds.push(cb.value);
    });

    try {
      const res = await fetch(`/api/users/${userId}/departments`, {
        method: 'PUT',
        headers: Auth.getHeaders(),
        body: JSON.stringify({ departmentIds: selectedIds })
      });
      const data = await res.json();
      if (data.success) {
        if (msg) {
          msg.style.color = 'green';
          msg.textContent = 'Departments updated successfully!';
        }
        setTimeout(async () => {
          if (callback) await callback();
        }, 500);
      } else {
        if (msg) {
          msg.style.color = 'red';
          msg.textContent = data.message || 'Failed to update departments.';
        }
      }
    } catch (err) {
      if (msg) {
        msg.style.color = 'red';
        msg.textContent = 'Error updating user departments.';
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

  const form = document.getElementById('createAdminForm');
  if (form) {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const nameInput = document.getElementById('adminNameInput');
      const emailInput = document.getElementById('adminEmailInput');
      const passInput = document.getElementById('adminPasswordInput');
      const adminMsg = document.getElementById('adminMsg');

      const name = nameInput ? nameInput.value.trim() : '';
      const email = emailInput ? emailInput.value.trim() : '';
      const password = passInput ? passInput.value.trim() : '';

      if (!name || !email || !password) {
        if (adminMsg) {
          adminMsg.style.color = 'red';
          adminMsg.textContent = 'Please fill in all required fields (Name, Email, Password).';
        }
        return;
      }

      if (adminMsg) {
        adminMsg.style.color = 'blue';
        adminMsg.textContent = 'Creating admin account in MongoDB Atlas Cloud...';
      }

      const selectedDepts = [];
      document.querySelectorAll('input[name="adminDept"]:checked').forEach(cb => {
        if (cb.value) selectedDepts.push(cb.value);
      });

      try {
        const res = await fetch('/api/users/admin', {
          method: 'POST',
          headers: Auth.getHeaders(),
          body: JSON.stringify({ name, email, password, departmentIds: selectedDepts })
        });
        const data = await res.json();

        if (res.ok && data.success) {
          if (adminMsg) {
            adminMsg.style.color = 'green';
            adminMsg.textContent = 'Department Admin created successfully in MongoDB Atlas Cloud!';
          }
          form.reset();
          await loadAdmins();
        } else {
          if (adminMsg) {
            adminMsg.style.color = 'red';
            adminMsg.textContent = data.message || 'Failed to create admin.';
          }
        }
      } catch (err) {
        if (adminMsg) {
          adminMsg.style.color = 'red';
          adminMsg.textContent = 'Connection error: ' + err.message;
        }
      }
    });
  }

  loadDepartmentsForCheckboxes().then(loadAdmins);
});
