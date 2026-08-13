document.addEventListener('DOMContentLoaded', () => {
  const currentUser = Auth.requireRole(['faculty']);
  if (!currentUser) return;

  const facultyNameElem = document.getElementById('facultyName');
  if (facultyNameElem) facultyNameElem.textContent = currentUser.name;

  const facultyEmailElem = document.getElementById('facultyEmail');
  if (facultyEmailElem) facultyEmailElem.textContent = currentUser.email;

  const assignedDepts = currentUser.departments && currentUser.departments.length > 0
    ? currentUser.departments.map(d => `${d.name || d} (${d.code || ''})`).join(', ')
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

  const historyBody = document.getElementById('historyTableBody');

  const loadHistory = async () => {
    if (!historyBody) return;
    historyBody.innerHTML = '<tr><td colspan="7" align="center">Loading attendance history...</td></tr>';

    try {
      const res = await fetch('/api/lectures', { headers: Auth.getHeaders() });
      const data = await res.json();

      const lecturesList = (data.success && Array.isArray(data.lectures)) ? data.lectures : [];

      if (lecturesList.length === 0) {
        historyBody.innerHTML = '<tr><td colspan="7" align="center">No lecture sessions recorded yet in your department.</td></tr>';
        return;
      }

      let html = '';
      lecturesList.forEach(lec => {
        const dateStr = new Date(lec.date).toLocaleDateString();
        const presentCount = lec.presentCount !== undefined ? lec.presentCount : '-';
        const totalCount = lec.totalStudents !== undefined ? lec.totalStudents : '-';
        const pct = lec.attendancePercentage !== undefined ? `${lec.attendancePercentage}%` : '-';

        html += `
          <tr>
            <td><b>${dateStr}</b><br><small style="color: var(--text-secondary);">${lec.timeSlot}</small></td>
            <td><b>${lec.subject}</b></td>
            <td>${lec.branch || 'SD'} / ${lec.batch || 'Batch-5'}</td>
            <td align="center" style="color: #16a34a; font-weight: bold;">${presentCount}</td>
            <td align="center">${totalCount}</td>
            <td align="center" style="font-weight: bold;">${pct}</td>
            <td align="center">
              <a href="/faculty/attendance.html?lectureId=${lec._id}" class="btn-link" style="font-size: 11.5px; padding: 3px 10px;">Mark / Edit Sheet</a>
            </td>
          </tr>
        `;
      });

      historyBody.innerHTML = html;
    } catch (err) {
      console.error(err);
      historyBody.innerHTML = '<tr><td colspan="7" align="center" style="color: red;">Error connecting to server.</td></tr>';
    }
  };

  loadHistory();
});
