document.addEventListener('DOMContentLoaded', () => {
  const currentUser = Auth.requireRole(['superadmin']);
  if (!currentUser) return;

  const nameElem = document.getElementById('superadminName');
  if (nameElem) nameElem.textContent = currentUser.name;
  const emailElem = document.getElementById('superadminEmail');
  if (emailElem) emailElem.textContent = currentUser.email;

  const logoutBtn = document.getElementById('logoutBtn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', (e) => {
      e.preventDefault();
      Auth.logout();
    });
  }

  // Auto-generate Department Name and Code based on Degree + Branch selection
  const degreeSelect = document.getElementById('deptDegree');
  const branchInput = document.getElementById('deptBranch');
  const nameInput = document.getElementById('deptName');
  const codeInput = document.getElementById('deptCode');

  const updateAutoFields = () => {
    if (!degreeSelect || !branchInput || !nameInput || !codeInput) return;
    const degree = degreeSelect.value.trim().toUpperCase();
    const branch = branchInput.value.trim().toUpperCase();

    if (degree && branch) {
      nameInput.value = `${degree} IN ${branch}`;
      codeInput.value = `${degree}-${branch}`;
    }
  };

  if (degreeSelect) degreeSelect.addEventListener('change', updateAutoFields);
  if (branchInput) {
    branchInput.addEventListener('input', updateAutoFields);
    branchInput.addEventListener('keyup', updateAutoFields);
  }

  const loadDepartments = async () => {
    try {
      const res = await fetch('/api/departments', { headers: Auth.getHeaders() });
      const data = await res.json();
      const tbody = document.getElementById('deptTableBody');
      if (!tbody) return;

      if (data.success) {
        if (data.departments.length === 0) {
          tbody.innerHTML = '<tr><td colspan="5" align="center">No departments created yet.</td></tr>';
          return;
        }

        tbody.innerHTML = '';
        data.departments.forEach((dept, idx) => {
          const tr = document.createElement('tr');
          tr.innerHTML = `
            <td>${idx + 1}</td>
            <td><b>${dept.code}</b></td>
            <td>${dept.name}</td>
            <td>${dept.description || '-'}</td>
            <td>
              <button type="button" class="edit-dept-btn" data-id="${dept._id}" style="padding: 3px 8px; margin-right: 5px;">Edit</button>
              <button type="button" class="delete-dept-btn" data-id="${dept._id}" style="color: red; padding: 3px 8px;">Delete</button>
            </td>
          `;
          tbody.appendChild(tr);

          const editTr = document.createElement('tr');
          editTr.id = `edit_dept_row_${dept._id}`;
          editTr.style.display = 'none';
          editTr.style.backgroundColor = '#f9f9f9';
          editTr.innerHTML = `
            <td colspan="5">
              <fieldset style="margin: 5px; padding: 10px;">
                <legend><b>Edit Department: ${dept.code}</b></legend>
                <p>
                  <label><b>Department Name:</b></label><br>
                  <input type="text" id="edit_name_${dept._id}" value="${dept.name}" style="width: 250px; padding: 4px;">
                </p>
                <p>
                  <label><b>Code:</b></label><br>
                  <input type="text" id="edit_code_${dept._id}" value="${dept.code}" style="width: 120px; padding: 4px;">
                </p>
                <p>
                  <label><b>Description:</b></label><br>
                  <input type="text" id="edit_desc_${dept._id}" value="${dept.description || ''}" style="width: 250px; padding: 4px;">
                </p>
                <p>
                  <button type="button" class="save-dept-btn" data-id="${dept._id}" style="padding: 4px 12px; margin-right: 5px; color: green;"><b>Save Changes</b></button>
                  <button type="button" class="cancel-edit-dept-btn" data-id="${dept._id}" style="padding: 4px 12px;">Cancel</button>
                </p>
                <p id="edit_dept_msg_${dept._id}"></p>
              </fieldset>
            </td>
          `;
          tbody.appendChild(editTr);
        });

        document.querySelectorAll('.edit-dept-btn').forEach(btn => {
          btn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            const id = e.currentTarget.dataset.id;
            const editRow = document.getElementById(`edit_dept_row_${id}`);
            if (editRow) {
              editRow.style.display = editRow.style.display === 'none' ? 'table-row' : 'none';
            }
          });
        });

        document.querySelectorAll('.cancel-edit-dept-btn').forEach(btn => {
          btn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            const id = e.currentTarget.dataset.id;
            const editRow = document.getElementById(`edit_dept_row_${id}`);
            if (editRow) editRow.style.display = 'none';
          });
        });

        document.querySelectorAll('.save-dept-btn').forEach(btn => {
          btn.addEventListener('click', async (e) => {
            e.preventDefault();
            e.stopPropagation();
            const id = e.currentTarget.dataset.id;
            await saveDepartmentEdit(id);
          });
        });

        document.querySelectorAll('.delete-dept-btn').forEach(btn => {
          btn.addEventListener('click', async (e) => {
            e.preventDefault();
            e.stopPropagation();
            const b = e.currentTarget;
            if (b.dataset.confirming === 'true') {
              await deleteDepartment(b.dataset.id);
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
      console.error('Error loading departments:', err);
    }
  };

  const saveDepartmentEdit = async (id) => {
    const nameInput = document.getElementById(`edit_name_${id}`);
    const codeInput = document.getElementById(`edit_code_${id}`);
    const descInput = document.getElementById(`edit_desc_${id}`);
    const msg = document.getElementById(`edit_dept_msg_${id}`);

    const name = nameInput ? nameInput.value.trim() : '';
    const code = codeInput ? codeInput.value.trim() : '';
    const description = descInput ? descInput.value.trim() : '';

    try {
      const res = await fetch(`/api/departments/${id}`, {
        method: 'PUT',
        headers: Auth.getHeaders(),
        body: JSON.stringify({ name, code, description })
      });
      const data = await res.json();
      if (data.success) {
        if (msg) {
          msg.style.color = 'green';
          msg.textContent = 'Department updated successfully!';
        }
        setTimeout(async () => {
          await loadDepartments();
        }, 500);
      } else {
        if (msg) {
          msg.style.color = 'red';
          msg.textContent = data.message || 'Failed to update department.';
        }
      }
    } catch (err) {
      if (msg) {
        msg.style.color = 'red';
        msg.textContent = 'Error saving changes.';
      }
    }
  };

  const deleteDepartment = async (id) => {
    try {
      const res = await fetch(`/api/departments/${id}`, {
        method: 'DELETE',
        headers: Auth.getHeaders()
      });
      const data = await res.json();
      if (data.success) {
        await loadDepartments();
      } else {
        alert(data.message || 'Failed to delete department.');
      }
    } catch (err) {
      alert('Server error deleting department.');
    }
  };

  const form = document.getElementById('createDeptForm');
  if (form) {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const deptMsg = document.getElementById('deptMsg');

      const name = nameInput ? nameInput.value.trim() : '';
      const code = codeInput ? codeInput.value.trim() : '';
      const descInput = document.getElementById('deptDesc');
      const description = descInput ? descInput.value.trim() : '';

      if (!name || !code) {
        if (deptMsg) {
          deptMsg.style.color = 'red';
          deptMsg.textContent = 'Department Name and Department Code are required.';
        }
        return;
      }

      if (deptMsg) {
        deptMsg.style.color = 'blue';
        deptMsg.textContent = 'Creating department in MongoDB Atlas Cloud...';
      }

      try {
        const res = await fetch('/api/departments', {
          method: 'POST',
          headers: Auth.getHeaders(),
          body: JSON.stringify({ name, code, description })
        });
        const data = await res.json();

        if (res.ok && data.success) {
          if (deptMsg) {
            deptMsg.style.color = 'green';
            deptMsg.textContent = `Department '${name}' (${code}) created successfully in MongoDB Atlas Cloud!`;
          }
          form.reset();
          await loadDepartments();
        } else {
          if (deptMsg) {
            deptMsg.style.color = 'red';
            deptMsg.textContent = data.message || 'Failed to create department.';
          }
        }
      } catch (err) {
        if (deptMsg) {
          deptMsg.style.color = 'red';
          deptMsg.textContent = 'Server error creating department.';
        }
      }
    });
  }

  loadDepartments();
});
