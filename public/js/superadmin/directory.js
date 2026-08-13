document.addEventListener('DOMContentLoaded', () => {
  const currentUser = Auth.requireRole(['superadmin']);
  if (!currentUser) return;

  const saName = document.getElementById('superadminName');
  if (saName) saName.textContent = currentUser.name;

  const saEmail = document.getElementById('superadminEmail');
  if (saEmail) saEmail.textContent = currentUser.email;

  const logoutBtn = document.getElementById('logoutBtn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', (e) => {
      e.preventDefault();
      Auth.logout();
    });
  }

  const roleSelect = document.getElementById('filterRole');
  const deptSelect = document.getElementById('filterDept');
  const applyBtn = document.getElementById('applyFilterBtn');
  const tbody = document.getElementById('directoryTableBody');

  const loadDepartments = async () => {
    if (!deptSelect) return;
    try {
      const res = await fetch('/api/departments', { headers: Auth.getHeaders() });
      const data = await res.json();
      deptSelect.innerHTML = '<option value="">All Departments</option>';

      if (data.success && data.departments) {
        data.departments.forEach(d => {
          const opt = document.createElement('option');
          opt.value = d._id;
          opt.textContent = `${d.name} (${d.code})`;
          deptSelect.appendChild(opt);
        });
      }
    } catch (e) {
      console.error('Error loading departments:', e);
    }
  };

  const loadDirectory = async () => {
    if (!tbody) return;
    tbody.innerHTML = '<tr><td colspan="5" align="center">Loading directory...</td></tr>';

    const role = roleSelect ? roleSelect.value : '';
    const dept = deptSelect ? deptSelect.value : '';

    let q = [];
    if (role) q.push(`role=${encodeURIComponent(role)}`);
    if (dept) q.push(`departmentId=${encodeURIComponent(dept)}`);

    const queryString = q.length > 0 ? `?${q.join('&')}` : '';

    try {
      let users = [];

      if (!role) {
        // Fetch both faculty and students
        const [facRes, stRes] = await Promise.all([
          fetch(`/api/users?role=faculty${dept ? '&departmentId=' + dept : ''}`, { headers: Auth.getHeaders() }),
          fetch(`/api/users?role=student${dept ? '&departmentId=' + dept : ''}`, { headers: Auth.getHeaders() })
        ]);
        const facData = await facRes.json();
        const stData = await stRes.json();

        if (facData.success && facData.users) users.push(...facData.users);
        if (stData.success && stData.users) users.push(...stData.users);
      } else {
        const res = await fetch(`/api/users${queryString}`, { headers: Auth.getHeaders() });
        const data = await res.json();
        if (data.success && data.users) users = data.users;
      }

      if (users.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" align="center">No faculty or student users found for the selected criteria.</td></tr>';
        return;
      }

      let html = '';
      users.forEach((u) => {
        const isStudent = u.role === 'student';
        const roleBadge = isStudent
          ? '<b style="color: #2563eb;">Student</b>'
          : '<b style="color: #059669;">Faculty</b>';

        let details = '';
        if (isStudent) {
          const sd = u.studentDetails || {};
          const deptName = sd.department ? (sd.department.code || sd.department.name || '') : 'N/A';
          details = `Roll: <b>${sd.rollNumber || 'N/A'}</b> | ${sd.branch || 'SD'} / ${sd.batch || 'Batch-5'} (${deptName})`;
        } else {
          const depts = u.departments && u.departments.length > 0
            ? u.departments.map(d => `${d.name} (${d.code})`).join(', ')
            : 'None assigned';
          details = `Depts: ${depts}`;
        }

        html += `
          <tr>
            <td><b>${u.name}</b></td>
            <td>${u.email}</td>
            <td align="center">${roleBadge}</td>
            <td>${details}</td>
            <td align="center">
              <button type="button" class="btn-delete-user" data-id="${u._id}" style="background: #fef2f2; color: #dc2626; border-color: #fecaca; font-size: 11.5px; padding: 3px 10px;">Delete</button>
            </td>
          </tr>
        `;
      });

      tbody.innerHTML = html;

      // Event binding for Delete buttons
      document.querySelectorAll('.btn-delete-user').forEach(btn => {
        btn.addEventListener('click', async (ev) => {
          ev.preventDefault();
          const userId = ev.currentTarget.dataset.id;
          if (!confirm('Are you sure you want to delete this user from the system?')) return;

          try {
            const res = await fetch(`/api/users/${userId}`, {
              method: 'DELETE',
              headers: Auth.getHeaders()
            });
            const data = await res.json();
            if (data.success) {
              loadDirectory();
            } else {
              alert(data.message || 'Failed to delete user.');
            }
          } catch (err) {
            alert('Error deleting user.');
          }
        });
      });
    } catch (err) {
      console.error('Error loading directory:', err);
      tbody.innerHTML = '<tr><td colspan="5" align="center" style="color: red;">Error connecting to server.</td></tr>';
    }
  };

  if (applyBtn) {
    applyBtn.addEventListener('click', (e) => {
      e.preventDefault();
      loadDirectory();
    });
  }

  loadDepartments().then(loadDirectory);
});
