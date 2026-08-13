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

  const loadStats = async () => {
    try {
      const res = await fetch('/api/lectures', { headers: Auth.getHeaders() });
      const data = await res.json();
      if (data.success && data.lectures) {
        const total = data.lectures.length;
        const conducted = data.lectures.filter(l => l.status === 'completed').length;
        const subs = data.lectures.filter(l => l.substituteFaculty).length;

        const statTotal = document.getElementById('statTotalLectures');
        const statConducted = document.getElementById('statConducted');
        const statSubs = document.getElementById('statSubstitutes');

        if (statTotal) statTotal.textContent = total;
        if (statConducted) statConducted.textContent = conducted;
        if (statSubs) statSubs.textContent = subs;
      }
    } catch (e) {}
  };

  loadStats();
});
