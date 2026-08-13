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

  // Load student stats
  try {
    const res = await fetch('/api/attendance/my-attendance', { headers: Auth.getHeaders() });
    const data = await res.json();

    if (data.success && Array.isArray(data.records)) {
      const records = data.records;
      const total = records.length;
      const present = records.filter(r => r.status === 'present').length;
      const pct = total > 0 ? Math.round((present / total) * 100) : 0;

      const statTotal = document.getElementById('statTotalLectures');
      const statAttended = document.getElementById('statAttended');
      const statPct = document.getElementById('statPercentage');

      if (statTotal) statTotal.textContent = total;
      if (statAttended) statAttended.textContent = present;
      if (statPct) statPct.textContent = `${pct}%`;
    }
  } catch (e) {
    console.error('Error loading student stats:', e);
  }
});
