document.addEventListener('DOMContentLoaded', async () => {
  const currentUser = Auth.requireRole(['student']);
  if (!currentUser) return;

  const stName = document.getElementById('studentName');
  if (stName) stName.textContent = currentUser.name;

  const stEmail = document.getElementById('studentEmail');
  if (stEmail) stEmail.textContent = currentUser.email;

  const sd = currentUser.studentDetails || {};
  const stRoll = document.getElementById('studentRoll');
  if (stRoll) stRoll.textContent = sd.rollNumber || 'N/A';

  const stBranchBatch = document.getElementById('studentBranchBatch');
  if (stBranchBatch) stBranchBatch.textContent = `${sd.branch || 'SD'} / ${sd.batch || 'Batch-5'}`;

  const logoutBtn = document.getElementById('logoutBtn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', (e) => {
      e.preventDefault();
      Auth.logout();
    });
  }

  const tbody = document.getElementById('studentLogsBody');
  const filterBtn = document.getElementById('filterLogsBtn');
  const filterSubjectInput = document.getElementById('filterSubject');

  const loadLogs = async () => {
    if (!tbody) return;
    tbody.innerHTML = '<tr><td colspan="4" align="center">Loading attendance logs...</td></tr>';

    try {
      const res = await fetch('/api/attendance/my-attendance', { headers: Auth.getHeaders() });
      const data = await res.json();

      const records = (data.success && Array.isArray(data.records)) ? data.records : [];
      const filterText = (filterSubjectInput?.value || '').trim().toLowerCase();

      const filteredRecords = filterText
        ? records.filter(r => (r.subjectName || r.subject || '').toLowerCase().includes(filterText))
        : records;

      if (filteredRecords.length === 0) {
        tbody.innerHTML = '<tr><td colspan="4" align="center">No attendance logs found.</td></tr>';
        return;
      }

      let html = '';
      filteredRecords.forEach((item) => {
        const formattedDate = new Date(item.date).toLocaleDateString();
        const statusBadge = item.status === 'present'
          ? `<b style="color: #16a34a;">PRESENT (P)</b>`
          : `<b style="color: #dc2626;">ABSENT (Ab)</b>`;

        html += `
          <tr>
            <td><b>${formattedDate}</b><br><small style="color: var(--text-secondary);">${item.timeSlot || 'N/A'}</small></td>
            <td><b>${item.subjectName || item.subject || 'N/A'}</b></td>
            <td>${item.facultyName || 'N/A'}</td>
            <td align="center">${statusBadge}</td>
          </tr>
        `;
      });

      tbody.innerHTML = html;
    } catch (err) {
      console.error('Error fetching attendance:', err);
      if (tbody) tbody.innerHTML = '<tr><td colspan="4" align="center" style="color:red;">Error loading attendance logs.</td></tr>';
    }
  };

  if (filterBtn) {
    filterBtn.addEventListener('click', (e) => {
      e.preventDefault();
      loadLogs();
    });
  }

  loadLogs();
});
