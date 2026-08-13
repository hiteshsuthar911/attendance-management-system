document.addEventListener('DOMContentLoaded', async () => {
  const currentUser = Auth.requireRole(['student']);
  if (!currentUser) return;

  document.getElementById('studentName').textContent = currentUser.name;
  document.getElementById('studentEmail').textContent = currentUser.email;

  document.getElementById('logoutBtn').addEventListener('click', (e) => {
    e.preventDefault();
    Auth.logout();
  });

  try {
    const res = await fetch('/api/attendance/my-attendance', { headers: Auth.getHeaders() });
    const data = await res.json();
    const tbody = document.getElementById('studentAttendanceBody');

    if (data.success) {
      if (data.attendance.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7">No attendance logs found for your account yet.</td></tr>';
        return;
      }

      tbody.innerHTML = '';
      data.attendance.forEach((item, idx) => {
        const formattedDate = new Date(item.date).toLocaleDateString();
        const statusBadge = item.status === 'present'
          ? `<b style="color: green;">PRESENT</b>`
          : `<b style="color: red;">ABSENT</b>`;

        const tr = document.createElement('tr');
        tr.innerHTML = `
          <td>${idx + 1}</td>
          <td>${formattedDate}<br><small>${item.timeSlot}</small></td>
          <td><b>${item.subject}</b></td>
          <td>${item.facultyName}</td>
          <td>${item.departmentName}</td>
          <td>${item.branch} / ${item.batch}</td>
          <td>${statusBadge}</td>
        `;
        tbody.appendChild(tr);
      });
    } else {
      tbody.innerHTML = `<tr><td colspan="7" style="color:red;">${data.message || 'Failed to load attendance logs.'}</td></tr>`;
    }
  } catch (err) {
    console.error('Error fetching attendance:', err);
    document.getElementById('studentAttendanceBody').innerHTML = '<tr><td colspan="7" style="color:red;">Server error loading attendance logs.</td></tr>';
  }
});
